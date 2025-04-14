// routes/schedule.js
const express = require('express');
const router = express.Router();
const Appointment = require('../models/appointmentModel'); // Appointment model
const Technician = require('../models/technicianModel'); // Technician model
const moment = require('moment-timezone');
const fetch = require('node-fetch'); // Ensure you install v2: npm install node-fetch@2

// Helper: Haversine distance
function haversineDistance(lat1, lng1, lat2, lng2) {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // kilometers
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Helper: Get travel time in minutes between two coordinates.
async function getTravelTime(origin, destination) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const originStr = `${origin.lat},${origin.lng}`;
    const destinationStr = `${destination.lat},${destination.lng}`;
    console.log("apiKey:", apiKey, "Origin:", originStr, "Destination:", destinationStr);
    // Basic check for valid values (if not, return a fallback value).
    if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
        console.error("Origin or destination coordinates are invalid.");
        return Infinity;
    }
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
            const leg = data.routes[0].legs[0];
            return Math.ceil(leg.duration.value / 60);
        }
    } catch (error) {
        console.error("Error in getTravelTime:", error);
    }
    return Infinity;
}

// PUT /api/schedule/calculateSchedule
router.put('/calculateSchedule', async (req, res) => {
    try {
        const { technicianId, appointmentDate, currentLocation } = req.body;
        if (!technicianId || !appointmentDate) {
            return res.status(400).json({ message: "technicianId and appointmentDate are required." });
        }

        const apptDate = new Date(appointmentDate);
        const now = new Date();

        let startCoords, startTime;
        const isToday = now.toDateString() === apptDate.toDateString();

        if (isToday && now.getHours() >= 8 && currentLocation) {
            startCoords = currentLocation;
            startTime = now;
        } else {
            const technician = await Technician.findById(technicianId);
            if (!technician) {
                return res.status(404).json({ message: "Technician not found" });
            }
            // Prefer technician.location (which is updated periodically) but fallback to addressCoordinates
            if (technician.location && technician.location.lat && technician.location.lng) {
                startCoords = technician.location;
            } else if (technician.addressCoordinates) {
                startCoords = technician.addressCoordinates;
            } else {
                return res.status(400).json({ message: "No starting coordinates available for the technician." });
            }
            // For future dates, start at 8:00 AM on the appointment day.
            apptDate.setHours(8, 0, 0, 0);
            startTime = apptDate;
        }

        // Define the day range for the appointment date.
        const dayStart = new Date(appointmentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        // For today use in-progress; for future days, use pending appointments.
        const pendingApps = await Appointment.find({
            technicianId,
            scheduledTime: { $gte: dayStart, $lt: dayEnd },
            status: isToday ? 'in-progress' : 'pending'
        }).populate('customerId', 'name address addressCoordinates phone');

        if (!pendingApps.length) {
            console.log("No pending appointments for this technician on that day.");
            return res.status(200).json({ computedSchedule: [] });
        }

        // Build array of customers from appointments
        const customers = pendingApps
            .filter(app => app.customerId.addressCoordinates)
            .map(app => ({
                _id: app.customerId._id.toString(),
                name: app.customerId.name,
                address: app.customerId.address,
                coordinates: app.customerId.addressCoordinates
            }));

        if (customers.length === 0) {
            return res.status(400).json({ message: "No valid customer coordinates available for this day." });
        }

        // Calculate the route using a greedy nearest-neighbor algorithm.
        let route = [];
        let currentPos = startCoords;
        let remaining = [...customers];
        while (remaining.length > 0) {
            let bestCandidate = null;
            let bestDistance = Infinity;
            for (const cust of remaining) {
                const distance = haversineDistance(
                    currentPos.lat,
                    currentPos.lng,
                    cust.coordinates.lat,
                    cust.coordinates.lng
                );
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestCandidate = cust;
                }
            }
            if (!bestCandidate) break;
            route.push({ customer: bestCandidate, distance: bestDistance });
            currentPos = bestCandidate.coordinates;
            remaining = remaining.filter(c => c._id !== bestCandidate._id);
        }

        // Calculate scheduled times along the route.
        const WORKING_TIME = 30; // minutes to add after each appointment.
        let scheduledTime = new Date(startTime);
        const updatedApps = [];
        let prevPos = startCoords;
        for (const leg of route) {
            const travelTime = await getTravelTime(prevPos, leg.customer.coordinates);
            if (!isFinite(travelTime)) {
                console.error(`Invalid travel time from ${JSON.stringify(prevPos)} to ${JSON.stringify(leg.customer.coordinates)}. Skipping.`);
                continue;
            }
            scheduledTime = new Date(scheduledTime.getTime() + travelTime * 60000);
            // Find the corresponding appointment
            const app = pendingApps.find(app =>
                app.customerId._id.toString() === leg.customer._id
            );
            if (app) {
                app.scheduledTime = scheduledTime.toISOString();
                updatedApps.push(app);
            }
            // Add fixed working time
            scheduledTime = new Date(scheduledTime.getTime() + WORKING_TIME * 60000);
            prevPos = leg.customer.coordinates;
        }

        // Bulk update these appointments in MongoDB.
        const bulkOps = updatedApps.map(app => ({
            updateOne: {
                filter: { _id: app._id },
                update: { $set: { scheduledTime: app.scheduledTime } }
            }
        }));
        await Appointment.bulkWrite(bulkOps);

        return res.status(200).json({ message: "Schedule calculated successfully", computedSchedule: updatedApps });
    } catch (error) {
        console.error("Error in recalcScheduleForTechnician:", error);
        return res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
