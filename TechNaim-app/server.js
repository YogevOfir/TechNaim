require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const routes = require('./routes'); // import all routes
const { updatePendingToInProgress } = require('./schedules/appointmentStatusUpdate');
const app = express();


app.use(express.json());
app.use(require('cors')());
app.use('/api/', routes); // Ensure routes contains your schedule route

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ['GET, POST'],
  }
});


io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  /**
   * Event: joinRoom
   * Data payload should include:
   *   - role: "technician" or "customer"
   *   - technicianId: (string) which defines the room name.
   *
   * For a technician: They always join the room with their own technicianId.
   * For a customer: They only join if they currently have an in-progress appointment
   *              with that technician. (Validation against your DB could be added here.)
   */

  socket.on('joinRoom', (data) => {
    if (!data || !data.technicianId || !data.role) {
      console.error('Invalid joinRoom data:', data);
      return;
    }

    const { technicianId, role } = data;
    // Join the room using technicianId as the room name.
    socket.join(technicianId);
    console.log(`${role} socket ${socket.id} joined room ${technicianId}`);

    // Store some information on the socket for later validation or debugging.
    socket.role = role;
    // For a technician, store the room (should be only one room per tech)
    if (role === 'technician') {
      socket.technicianId = technicianId;
    }
    // For a customer, maintain an array of technician rooms they are in.
    if (role === 'customer') {
      socket.technicianIds = socket.technicianIds || [];
      if (!socket.technicianIds.includes(technicianId)) {
        socket.technicianIds.push(technicianId);
      }
    }
  });

  /**
   * Event: leaveRoom
   * Data payload: { technicianId }
   *
   * When a customer (or even technician) no longer shares an in-progress
   * appointment with the technician, they can leave the room.
   */
  socket.on('leaveRoom', (data) => {
    if (!data || !data.technicianId) {
      console.error('Invalid leaveRoom data:', data);
      return;
    }
    const { technicianId } = data;
    socket.leave(technicianId);
    console.log(`Socket ${socket.id} left room ${technicianId}`);

    if (socket.role === 'customer' && socket.technicianIds) {
      socket.technicianIds = socket.technicianIds.filter((id) => id !== technicianId);
    }
  });

  /**
   * Event: locationUpdate
   * Data payload is expected to include:
   *   - technicianId: (string)
   *   - lat: (number)
   *   - lng: (number)
   *   - (optionally: queue information, appointment details, etc.)
   *
   * When a technician sends a location update, broadcast the update to all
   * sockets in the room (i.e. customers) except the sender.
   */
  socket.on('locationUpdate', (data) => {
    if (!data || !data.technicianId || !data.lat || !data.lng) {
      console.error('Invalid locationUpdate data:', data);
      return;
    }
    const { technicianId, lat, lng } = data;
    console.log(`Received location update from technician ${technicianId}: [${lat}, ${lng}]`);

    // Broadcast the location update to everyone in the room except the sender.
    socket.to(technicianId).emit('locationUpdate', { technicianId, lat, lng });
  });

  /**
   * Handle disconnecting.
   * This will automatically remove the socket from any joined rooms.
   * You might add additional cleanup if you keep any global maps of connected sockets.
   */
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    // Optionally, handle cleanup if needed.
  });
});





// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');

    // If the current time is 8:00 AM or later, update pending appointments immediately.
    const now = new Date();
    if (now.getHours() >= 8) {
      updatePendingToInProgress();
    }
  })
  .catch(err => console.error('Could not connect to MongoDB', err));

// Routes
app.use('/api/', routes); // this is the route for the authRoutes file


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// on close print message
process.on('SIGINT', () => {
  console.log('Bye bye!');
  process.exit();
});



