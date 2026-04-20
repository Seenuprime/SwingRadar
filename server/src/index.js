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

const session    = require('express-session');
const MongoStore = require('connect-mongo');
const passport   = require('passport');
const authRoutes = require('./routes/auth'); // requires passport config internally

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

// Session Setup
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/swingtrading';
app.use(session({
  secret: process.env.SESSION_SECRET || 'swingradar_secret_key_123',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: DB_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 } // 30 days
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', stockRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.use((req, res) => {
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
