require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const stockRoutes = require('./routes/stocks');
const { startCronJob } = require('./services/cronJob');

const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', stockRoutes);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Connect MongoDB then start server
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swingtrading')
  .then(() => {
    console.log('[DB] MongoDB connected');
    app.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
      startCronJob();
    });
  })
  .catch((err) => {
    console.error('[DB] Connection error:', err.message);
    process.exit(1);
  });
