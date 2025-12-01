/**
 * MUSIC PLAYER - MAIN SERVER FILE
 * This is the entry point for our Node.js backend
 * It sets up Express server, middleware, and routes
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes from backend folder
const tracksRouter = require('./routes/tracks');
const playlistsRouter = require('./routes/playlists');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/tracks', tracksRouter);
app.use('/api/playlists', playlistsRouter);

// Serve frontend files
app.use(express.static(path.join(__dirname, 'frontend')));

// Allow frontend routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


// ============================================
// MIDDLEWARE SETUP
// ============================================

// Enable CORS for frontend-backend communication
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve uploaded music files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// CREATE REQUIRED DIRECTORIES & FILES
// ============================================

const directories = [
  path.join(__dirname, 'uploads/music'),
  path.join(__dirname, 'data')
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Initialize JSON files if they don't exist
const initFile = (filePath, defaultData) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    console.log(`✅ Created file: ${filePath}`);
  }
};

initFile(path.join(__dirname, 'data/tracks.json'), []);
initFile(path.join(__dirname, 'data/playlists.json'), []);

// ============================================
// API ROUTES
// ============================================

app.use('/api/tracks', tracksRouter);
app.use('/api/playlists', playlistsRouter);

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: '🎵 Music Player API is running!',
    version: '1.0.0',
    endpoints: {
      tracks: '/api/tracks',
      playlists: '/api/playlists'
    }
  });
});

// Serve frontend for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log('\n🎵 ====================================');
  console.log(`   MUSIC PLAYER SERVER RUNNING`);
  console.log('   ====================================');
  console.log(`   🌐 Server: http://localhost:${PORT}`);
  console.log(`   📁 Frontend: http://localhost:${PORT}`);
  console.log(`   🔌 API: http://localhost:${PORT}/api`);
  console.log('   ====================================\n');
});