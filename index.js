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
  res.json({
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDummyKeyForSamePathApp12345678",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "samepath-web.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "samepath-web",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "samepath-web.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789012",
    appId: process.env.FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890"
  });
});

// Fallback all other routes to dist/index.html (Single Page App routing)
app.get(/^(?!\/api).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Same Path server listening on port ${PORT}...`);
});
