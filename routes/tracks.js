/**
 * TRACKS ROUTES
 * Handles all track-related operations:
 * - Upload tracks
 * - Get all tracks
 * - Get single track
 * - Delete track
 * - Search tracks
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const upload = require('../middleware/upload');   // requires middleware/upload.js
const mm = require('music-metadata');

const TRACKS_FILE = path.join(__dirname, '../data/tracks.json');

// Helper function to read tracks
const readTracks = () => {
  const data = fs.readFileSync(TRACKS_FILE, 'utf8');
  return JSON.parse(data);
};

// Helper function to write tracks
const writeTracks = (tracks) => {
  fs.writeFileSync(TRACKS_FILE, JSON.stringify(tracks, null, 2));
};

// ============================================
// GET ALL TRACKS
// ============================================
router.get('/', (req, res) => {
  try {
    const tracks = readTracks();
    res.json({
      success: true,
      count: tracks.length,
      tracks: tracks
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// UPLOAD TRACK (with metadata extraction)
// ============================================
router.post('/upload', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    const filePath = req.file.path;
    let metadata = {
      title: req.body.title || path.basename(req.file.originalname, path.extname(req.file.originalname)),
      artist: req.body.artist || 'Unknown Artist',
      album: req.body.album || 'Unknown Album',
      genre: req.body.genre || 'Uncategorized',
      duration: 0
    };

    // Extract metadata from audio file
    try {
      const audioMetadata = await mm.parseFile(filePath);
      if (audioMetadata.common) {
        metadata.title = audioMetadata.common.title || metadata.title;
        metadata.artist = audioMetadata.common.artist || metadata.artist;
        metadata.album = audioMetadata.common.album || metadata.album;
        metadata.genre = (audioMetadata.common.genre && audioMetadata.common.genre[0]) || metadata.genre;
      }
      if (audioMetadata.format && audioMetadata.format.duration) {
        metadata.duration = Math.round(audioMetadata.format.duration);
      }
    } catch (metaError) {
      console.log('Could not extract metadata, using defaults');
    }

    const track = {
      id: Date.now().toString(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/music/${req.file.filename}`,
      size: req.file.size,
      uploadDate: new Date().toISOString(),
      ...metadata
    };

    const tracks = readTracks();
    tracks.push(track);
    writeTracks(tracks);

    res.status(201).json({
      success: true,
      message: 'Track uploaded successfully!',
      track: track
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// GET SINGLE TRACK BY ID
// ============================================
router.get('/:id', (req, res) => {
  try {
    const tracks = readTracks();
    const track = tracks.find(t => t.id === req.params.id);
    
    if (!track) {
      return res.status(404).json({ 
        success: false, 
        error: 'Track not found' 
      });
    }
    
    res.json({ 
      success: true, 
      track: track 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// SEARCH TRACKS
// ============================================
router.get('/search/:query', (req, res) => {
  try {
    const tracks = readTracks();
    const query = req.params.query.toLowerCase();
    
    const results = tracks.filter(track => 
      track.title.toLowerCase().includes(query) ||
      track.artist.toLowerCase().includes(query) ||
      track.album.toLowerCase().includes(query) ||
      track.genre.toLowerCase().includes(query)
    );
    
    res.json({ 
      success: true, 
      count: results.length,
      tracks: results 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// DELETE TRACK
// ============================================
router.delete('/:id', (req, res) => {
  try {
    const tracks = readTracks();
    const trackIndex = tracks.findIndex(t => t.id === req.params.id);
    
    if (trackIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Track not found' 
      });
    }
    
    const track = tracks[trackIndex];
    const filePath = path.join(__dirname, '../uploads/music', track.filename);
    
    // Delete file from disk
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Remove from database
    tracks.splice(trackIndex, 1);
    writeTracks(tracks);
    
    res.json({ 
      success: true, 
      message: 'Track deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// UPDATE TRACK METADATA
// ============================================
router.put('/:id', (req, res) => {
  try {
    const tracks = readTracks();
    const trackIndex = tracks.findIndex(t => t.id === req.params.id);
    
    if (trackIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Track not found' 
      });
    }
    
    // Update allowed fields
    const allowedUpdates = ['title', 'artist', 'album', 'genre'];
    allowedUpdates.forEach(field => {
      if (req.body[field]) {
        tracks[trackIndex][field] = req.body[field];
      }
    });
    
    writeTracks(tracks);
    
    res.json({ 
      success: true, 
      message: 'Track updated successfully',
      track: tracks[trackIndex]
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;