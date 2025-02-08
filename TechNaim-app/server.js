require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes'); // this is the route for the authRoutes file


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

// Basic route example
app.get('/', (req, res) => {
  res.send('Technician Arrival App Backend');
});

// Listen for connections via Socket.IO
io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true, // New URL parser
    useUnifiedTopology: true, // New Server Discover and Monitoring engine
    useCreateIndex: true}) // New Indexing engine
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log(err.message));
  
  // Routes
  app.use('/api/auth', authRoutes); // this is the route for the authRoutes file


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// on close print message
process.on('SIGINT', () => {
  console.log('Bye bye!');
  process.exit();
});



