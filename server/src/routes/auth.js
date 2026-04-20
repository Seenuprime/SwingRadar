const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// --- PASSPORT SETUP ---
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Configure Local Strategy
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) return done(null, false, { message: 'Incorrect email or password.' });
    if (!user.password) return done(null, false, { message: 'This email is linked to a social account.' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return done(null, false, { message: 'Incorrect email or password.' });
    
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Configure Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails?.[0]?.value,
          avatarUrl: profile.photos?.[0]?.value,
        });
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
}

// Configure GitHub Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: '/api/auth/github/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ githubId: profile.id });
      if (!user) {
        user = await User.create({
          githubId: profile.id,
          name: profile.displayName || profile.username,
          email: profile.emails?.[0]?.value,
          avatarUrl: profile.photos?.[0]?.value,
        });
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
}

// --- ROUTES ---

// 1. Local Auth
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email is already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Auto log them in
    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: 'Registration succeeded, but auto-login failed' });
      res.json({ success: true, user });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || 'Authentication failed' });
    
    req.logIn(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      return res.json({ success: true, user });
    });
  })(req, res, next);
});

// 2. Google Auth
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(500).send('Google Auth is not configured in .env');
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { failureRedirect: '/' })(req, res, next);
}, (req, res) => {
  res.redirect(process.env.CLIENT_URL || '/');
});

// 2. GitHub Auth
router.get('/github', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID) return res.status(500).send('GitHub Auth is not configured in .env');
  passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});

router.get('/github/callback', (req, res, next) => {
  passport.authenticate('github', { failureRedirect: '/' })(req, res, next);
}, (req, res) => {
  res.redirect(process.env.CLIENT_URL || '/');
});

// 3. User Session Data
router.get('/session', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.json({ user: null });
  }
});

// 4. Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      // For cross-origin or local dev, standard JSON is best
      res.json({ success: true });
    });
  });
});

module.exports = router;
