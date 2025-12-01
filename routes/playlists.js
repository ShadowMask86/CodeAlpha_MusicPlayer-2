/**
 * PLAYLISTS ROUTES
 * Handles all playlist operations:
 * - Create playlist
 * - Get all playlists
 * - Get single playlist
 * - Update playlist
 * - Delete playlist
 * - Add/remove tracks from playlist
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const PLAYLISTS_FILE = path.join(__dirname, '../data/playlists.json');
const TRACKS_FILE = path.join(__dirname, '../data/tracks.json');

// Helper functions
const readPlaylists = () => {
  const data = fs.readFileSync(PLAYLISTS_FILE, 'utf8');
  return JSON.parse(data);
};

const writePlaylists = (playlists) => {
  fs.writeFileSync(PLAYLISTS_FILE, JSON.stringify(playlists, null, 2));
};

const readTracks = () => {
  const data = fs.readFileSync(TRACKS_FILE, 'utf8');
  return JSON.parse(data);
};

// ============================================
// GET ALL PLAYLISTS
// ============================================
router.get('/', (req, res) => {
  try {
    const playlists = readPlaylists();
    res.json({
      success: true,
      count: playlists.length,
      playlists: playlists
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// CREATE NEW PLAYLIST
// ============================================
router.post('/', (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Playlist name is required' 
      });
    }
    
    const playlists = readPlaylists();
    
    // Check if playlist with same name exists
    const exists = playlists.some(p => p.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      return res.status(400).json({ 
        success: false, 
        error: 'Playlist with this name already exists' 
      });
    }
    
    const playlist = {
      id: Date.now().toString(),
      name: name,
      description: description || '',
      tracks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    playlists.push(playlist);
    writePlaylists(playlists);
    
    res.status(201).json({
      success: true,
      message: 'Playlist created successfully!',
      playlist: playlist
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// GET SINGLE PLAYLIST WITH TRACKS
// ============================================
router.get('/:id', (req, res) => {
  try {
    const playlists = readPlaylists();
    const playlist = playlists.find(p => p.id === req.params.id);
    
    if (!playlist) {
      return res.status(404).json({ 
        success: false, 
        error: 'Playlist not found' 
      });
    }
    
    // Populate full track details
    const allTracks = readTracks();
    const playlistWithTracks = {
      ...playlist,
      tracks: playlist.tracks.map(trackId => {
        return allTracks.find(t => t.id === trackId);
      }).filter(t => t !== undefined) // Remove any deleted tracks
    };
    
    res.json({ 
      success: true, 
      playlist: playlistWithTracks 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// UPDATE PLAYLIST INFO
// ============================================
router.put('/:id', (req, res) => {
  try {
    const playlists = readPlaylists();
    const playlistIndex = playlists.findIndex(p => p.id === req.params.id);
    
    if (playlistIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Playlist not found' 
      });
    }
    
    const { name, description } = req.body;
    
    if (name) playlists[playlistIndex].name = name;
    if (description !== undefined) playlists[playlistIndex].description = description;
    playlists[playlistIndex].updatedAt = new Date().toISOString();
    
    writePlaylists(playlists);
    
    res.json({ 
      success: true, 
      message: 'Playlist updated successfully',
      playlist: playlists[playlistIndex]
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// DELETE PLAYLIST
// ============================================
router.delete('/:id', (req, res) => {
  try {
    const playlists = readPlaylists();
    const playlistIndex = playlists.findIndex(p => p.id === req.params.id);
    
    if (playlistIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Playlist not found' 
      });
    }
    
    playlists.splice(playlistIndex, 1);
    writePlaylists(playlists);
    
    res.json({ 
      success: true, 
      message: 'Playlist deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// ADD TRACK TO PLAYLIST
// ============================================
router.post('/:id/tracks', (req, res) => {
  try {
    const { trackId } = req.body;
    
    if (!trackId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Track ID is required' 
      });
    }
    
    // Verify track exists
    const tracks = readTracks();
    const trackExists = tracks.some(t => t.id === trackId);
    if (!trackExists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Track not found' 
      });
    }
    
    const playlists = readPlaylists();
    const playlistIndex = playlists.findIndex(p => p.id === req.params.id);
    
    if (playlistIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Playlist not found' 
      });
    }
    
    // Check if track already in playlist
    if (playlists[playlistIndex].tracks.includes(trackId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Track already in playlist' 
      });
    }
    
    playlists[playlistIndex].tracks.push(trackId);
    playlists[playlistIndex].updatedAt = new Date().toISOString();
    writePlaylists(playlists);
    
    res.json({ 
      success: true, 
      message: 'Track added to playlist',
      playlist: playlists[playlistIndex]
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// REMOVE TRACK FROM PLAYLIST
// ============================================
router.delete('/:id/tracks/:trackId', (req, res) => {
  try {
    const playlists = readPlaylists();
    const playlistIndex = playlists.findIndex(p => p.id === req.params.id);
    
    if (playlistIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Playlist not found' 
      });
    }
    
    const trackIndex = playlists[playlistIndex].tracks.indexOf(req.params.trackId);
    if (trackIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Track not found in playlist' 
      });
    }
    
    playlists[playlistIndex].tracks.splice(trackIndex, 1);
    playlists[playlistIndex].updatedAt = new Date().toISOString();
    writePlaylists(playlists);
    
    res.json({ 
      success: true, 
      message: 'Track removed from playlist',
      playlist: playlists[playlistIndex]
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;