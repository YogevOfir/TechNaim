
// import * as Location from 'expo-location';
const express = require('express');
const Appointment = require('../models/appointmentModel'); // Appointment model
const Technician = require('../models/technicianModel'); // Technician model
const User = require('../models/userModel'); // User model
const router = express.Router();

/**
 * Recalculate the schedule for a technician on a given appointment date.
 * For future appointments, use the technician’s stored addressCoordinates and start at 8:00 AM.
 * For today (after 8:00 AM), use the technician’s current location and current time.
 *
 * @param {String} technicianId - ID of the technician.
 * @param {String} appointmentDate - ISO date string of the appointment.
 * @param {Object} [currentLocation] - Optional {lat, lng} if appointment is today and current location is provided.
 * @returns {Promise<Array>} - Returns updated appointments schedule.
 */
async function recalcScheduleForTechnician(technicianId, appointmentDate, currentLocation) {
    try {
        let apptDate = new Date(appointmentDate);
        const now = new Date();

        let startCoords, startTime;

        // Determine if the appointment is today and current time is after 8:00.
        const isToday = now.toDateString() === apptDate.toDateString();
        if (isToday && now.getHours() >= 8) {
            startTime = now; // Use current time for today
        }
        else {
            apptDate.setHours(8, 0, 0, 0); // Set to start of the day for future appointments
            startTime = apptDate;
        }
        if (currentLocation && currentLocation.lat && currentLocation.lng) {
            console.log("Using current location for today.");
            startCoords = currentLocation;
        } else {
            // Otherwise, fetch the technician's stored coordinates from their record.
            const technician = await Technician.findById(technicianId);
            if (!technician) {
                throw new Error("Technician not found");
            }
            console.log("techncian.location:", technician.location);
            if (!technician.location || !technician.location.lat || !technician.location.lng) {
                console.log("Technician's location is not defined. Using user address coordinates instead.");
                const userOfTech = await User.findById(technician.userId);
                if (!userOfTech) {
                    throw new Error("User of technician not found");
                }
                startCoords = userOfTech.addressCoordinates;
            } else {
                startCoords = technician.location;
            }
        }

        // Get pending appointments for the technician on that day:
        let dayStart = new Date(appointmentDate);
        dayStart.setHours(8, 0, 0, 0); // Set to start of the day
    
        let dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999); // Set to end of the day


        const pendingApps = await Appointment.find({
            technicianId,
            scheduledTime: { $gte: dayStart, $lt: dayEnd },
            status: isToday ? 'in-progress' : 'pending'
        }).populate('customerId', 'name address addressCoordinates phone');

        if (!pendingApps.length) {
            console.log("No pending appointments for this technician on that day.");
            return [];
        }

        // Prepare an array of customers from the appointments:
        let customers = pendingApps
            .filter(app => app.customerId.addressCoordinates)
            .map(app => ({
                _id: app.customerId._id.toString(),
                name: app.customerId.name,
                address: app.customerId.address,
                coordinates: app.customerId.addressCoordinates
            }));

        // Calculate route using a greedy nearest neighbor algorithm:
        let route = [];
        let currentPos = startCoords;
        if (!currentPos) {
            throw new Error("Technician's starting position is not defined.");
        }
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

        // With the route, calculate scheduled times:
        const WORKING_TIME = 30; // minutes to add after each appointment
        let scheduledTime = new Date(startTime);
        let updatedApps = [];
        let prevPos = startCoords;
        let isFirstAppointment = true;
        if (!prevPos) {
            throw new Error("Technician's starting position is not defined.");
        }
        for (const leg of route) {
            const travelTime = await getTravelTime(prevPos, leg.customer.coordinates);
            if (travelTime === Infinity ) {
                console.error(`Error: Unable to calculate travel time for ${leg.customer.name}. Skipping this appointment.`);
                continue;
            }
            console.log('StartTime: ', scheduledTime, ' TravelTime: ' , travelTime);
            scheduledTime = new Date(scheduledTime.getTime() + travelTime * 60000);
            console.log('ScheduledTime:', scheduledTime);
            // Find the corresponding appointment and update scheduledTime.
            const app = pendingApps.find(app =>
                app.customerId._id.toString() === leg.customer._id
            );
            if (app) {
                app.scheduledTime = scheduledTime.toISOString();
                updatedApps.push(app);
            }
            // Add the fixed working time.
            
            scheduledTime = new Date(scheduledTime.getTime() + WORKING_TIME * 60000);
            
            
            isFirstAppointment = false;
            prevPos = leg.customer.coordinates;
        }

        // Bulk update updated appointments in MongoDB:
        const bulkOps = updatedApps.map(app => ({
            updateOne: {
                filter: { _id: app._id },
                update: { $set: { scheduledTime: app.scheduledTime } }
            }
        }));
        await Appointment.bulkWrite(bulkOps);

        return updatedApps;
    } catch (error) {
        console.error("Error in recalcScheduleForTechnician:", error);
        throw error;
    }
}

// Helper: Haversine distance (same as before)
function haversineDistance(lat1, lng1, lat2, lng2) {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Helper: Get travel time (as earlier)
async function getTravelTime(origin, destination) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const originStr = `${origin.lat},${origin.lng}`;
    const destinationStr = `${destination.lat},${destination.lng}`;
    console.log("apiKey:", apiKey, "Origin:", originStr, "Destination:", destinationStr);
    if (!originStr || !destinationStr || originStr.lat === null || originStr.lng === null || destinationStr.lat === null || destinationStr.lng === null) {
        console.error("Origin or destination coordinates are not defined.");
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

module.exports = { recalcScheduleForTechnician };
