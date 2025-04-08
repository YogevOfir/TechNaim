require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const routes = require('./routes'); // import all routes
require('./schedules/appointmentStatusUpdate'); // import the schedule for appointment status update

const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  }
});

const technicianNamespace = io.of('/technician');
const customerNamespace = io.of('/customer');

technicianNamespace.on('connection', (socket) => {
  console.log('Technician connected:', socket.id);

  socket.on('locationUpdate', (locationData) => {
    // Broadcast the location update to all technicians
    console.log('Location update from technician:', locationData);
    customerNamespace.to(locationData.technicianId).emit('locationUpdate', locationData);
  });

  socket.on('disconnect', () => {
    // console.log('Technician disconnected:', socket.id);
  });
}
);

customerNamespace.on('connection', (socket) => {
  console.log('Customer connected:', socket.id);

  socket.on('JoinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`Customer ${socket.id} joined room ${roomId}`);
  });
});


// Listen for connections via Socket.IO
io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});



// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));
  
  // Routes
  app.use('/api/', routes); // this is the route for the authRoutes file


const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// on close print message
process.on('SIGINT', () => {
  console.log('Bye bye!');
  process.exit();
});



