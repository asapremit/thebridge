const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Body parser middleware
app.use(express.json());

// Serve static assets from build dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/api/firebase-config', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.json({
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyANoB6-PHmSVQ9OuiyNX2L_ORfATsB_Gs8",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "samepath-c3749.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "samepath-c3749",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "samepath-c3749.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "543979822804",
    appId: process.env.FIREBASE_APP_ID || "1:543979822804:web:eb6f606455f54258bca541"
  });
});

// Fallback all other routes to dist/index.html (Single Page App routing)
app.get(/^(?!\/api).*$/, (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Same Path server listening on port ${PORT}...`);
});
