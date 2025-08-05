require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const PORT = process.env.PORT || 8000;
const MONGO_URL = process.env.MONGO_URL;

// Connect to MongoDB
mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
    
    // Start tiffin scheduler after DB connection
    const scheduler = require('./scheduler');
    scheduler.start();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// --- ROUTES ---
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Tiffin Manager API' });
});

// Test route without auth
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'No auth required' });
});

// Import and use routers
app.use('/api/users', require('./routes/users'));
app.use('/api/tiffin', require('./routes/tiffin'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/tiffin-orders', require('./routes/tiffinOrders'));

// Start server
app.listen(PORT, () => {
  console.log(`🍱 Tiffin Manager Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  const scheduler = require('./scheduler');
  scheduler.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  const scheduler = require('./scheduler');
  scheduler.stop();
  process.exit(0);
});
