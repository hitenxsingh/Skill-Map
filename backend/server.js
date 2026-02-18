const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const dns = require("dns")

// Set custom DNS servers BEFORE loading anything else that might need DNS
// Use corporate DNS (40.54.1.13) with Google DNS as fallback
dns.setServers(['40.54.1.13', '8.8.8.8', '8.8.4.4'])
// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Skill Map API is running', timestamp: new Date().toISOString() });
});

// Mount routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/learning', require('./routes/learning'));
app.use('/api/mobility', require('./routes/mobility'));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
