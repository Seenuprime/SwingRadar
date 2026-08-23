# SwingRadar — AI-Powered NSE Daily Stock Picks

A full-stack web app that screens NSE-listed stocks daily and surfaces swing-trading picks, with user accounts and automated data refresh.

## How it works
- Backend: Express + MongoDB server that parses stock CSV data, enriches it, and runs a scheduled cron job to refresh daily picks
- Auth: session-based login (Passport + express-session + connect-mongo)
- Email: automated notifications via a dedicated email service
- Frontend: React (Vite) client with login, stats bar, and stock listings

## Tech stack
JavaScript, Node.js, Express, MongoDB, React (Vite), Passport.js

## Run locally
Backend: cd server && npm install && npm run dev
Frontend: cd client && npm install && npm run dev

Requires a MongoDB connection string and mail service credentials - see server/.env.example.
