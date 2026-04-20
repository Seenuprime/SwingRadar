const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: String,
  githubId: String,
  name: String,
  email: String,
  password: { type: String, select: false }, // don't return password by default
  avatarUrl: String,
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
