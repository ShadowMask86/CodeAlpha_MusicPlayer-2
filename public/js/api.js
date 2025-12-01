/**
 * API MODULE
 * Handles all communication with the backend API
 * All API calls are centralized here for easy maintenance
 */

const API = {
    baseURL: "/api",

    // ============================================
    // TRACK OPERATIONS
    // ============================================

    /**
     * Fetch all tracks from the server
     * @returns {Promise<Array>} Array of track objects
     */
    async getAllTracks() {
        try {
            const response = await fetch(`${this.baseURL}/tracks`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch tracks');
            }
            
            return data.tracks || [];
        } catch (error) {
            console.error('Error fetching tracks:', error);
            throw error;
        }
    },

    /**
     * Upload a single audio file
     * @param {File} file - Audio file to upload
     * @param {Object} metadata - Optional metadata (title, artist, etc.)
     * @returns {Promise<Object>} Uploaded track object
     */
    async uploadTrack(file, metadata = {}) {
        try {
            const formData = new FormData();
            formData.append('audio', file);
            
            // Add optional metadata
            if (metadata.title) formData.append('title', metadata.title);
            if (metadata.artist) formData.append('artist', metadata.artist);
            if (metadata.album) formData.append('album', metadata.album);
            if (metadata.genre) formData.append('genre', metadata.genre);
            
            const response = await fetch(`${this.baseURL}/tracks/upload`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to upload track');
            }
            
            return data.track;
        } catch (error) {
            console.error('Error uploading track:', error);
            throw error;
        }
    },

    /**
     * Search tracks by query
     * @param {string} query - Search term
     * @returns {Promise<Array>} Array of matching tracks
     */
    async searchTracks(query) {
        try {
            const response = await fetch(`${this.baseURL}/tracks/search/${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to search tracks');
            }
            
            return data.tracks || [];
        } catch (error) {
            console.error('Error searching tracks:', error);
            throw error;
        }
    },

    /**
     * Delete a track
     * @param {string} trackId - ID of track to delete
     * @returns {Promise<Object>} Success response
     */
    async deleteTrack(trackId) {
        try {
            const response = await fetch(`${this.baseURL}/tracks/${trackId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to delete track');
            }
            
            return data;
        } catch (error) {
            console.error('Error deleting track:', error);
            throw error;
        }
    },

    /**
     * Update track metadata
     * @param {string} trackId - ID of track to update
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated track object
     */
    async updateTrack(trackId, updates) {
        try {
            const response = await fetch(`${this.baseURL}/tracks/${trackId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to update track');
            }
            
            return data.track;
        } catch (error) {
            console.error('Error updating track:', error);
            throw error;
        }
    },

    // ============================================
    // PLAYLIST OPERATIONS
    // ============================================

    /**
     * Fetch all playlists
     * @returns {Promise<Array>} Array of playlist objects
     */
    async getAllPlaylists() {
        try {
            const response = await fetch(`${this.baseURL}/playlists`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch playlists');
            }
            
            return data.playlists || [];
        } catch (error) {
            console.error('Error fetching playlists:', error);
            throw error;
        }
    },

    /**
     * Get a single playlist with full track details
     * @param {string} playlistId - ID of playlist
     * @returns {Promise<Object>} Playlist object with tracks
     */
    async getPlaylist(playlistId) {
        try {
            const response = await fetch(`${this.baseURL}/playlists/${playlistId}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch playlist');
            }
            
            return data.playlist;
        } catch (error) {
            console.error('Error fetching playlist:', error);
            throw error;
        }
    },

    /**
     * Create a new playlist
     * @param {string} name - Playlist name
     * @param {string} description - Optional description
     * @returns {Promise<Object>} Created playlist object
     */
    async createPlaylist(name, description = '') {
        try {
            const response = await fetch(`${this.baseURL}/playlists`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, description })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to create playlist');
            }
            
            return data.playlist;
        } catch (error) {
            console.error('Error creating playlist:', error);
            throw error;
        }
    },

    /**
     * Update playlist info
     * @param {string} playlistId - ID of playlist
     * @param {Object} updates - Fields to update (name, description)
     * @returns {Promise<Object>} Updated playlist object
     */
    async updatePlaylist(playlistId, updates) {
        try {
            const response = await fetch(`${this.baseURL}/playlists/${playlistId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to update playlist');
            }
            
            return data.playlist;
        } catch (error) {
            console.error('Error updating playlist:', error);
            throw error;
        }
    },

    /**
     * Delete a playlist
     * @param {string} playlistId - ID of playlist to delete
     * @returns {Promise<Object>} Success response
     */
    async deletePlaylist(playlistId) {
        try {
            const response = await fetch(`${this.baseURL}/playlists/${playlistId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to delete playlist');
            }
            
            return data;
        } catch (error) {
            console.error('Error deleting playlist:', error);
            throw error;
        }
    },

    /**
     * Add a track to a playlist
     * @param {string} playlistId - ID of playlist
     * @param {string} trackId - ID of track to add
     * @returns {Promise<Object>} Updated playlist object
     */
    async addTrackToPlaylist(playlistId, trackId) {
        try {
            const response = await fetch(`${this.baseURL}/playlists/${playlistId}/tracks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ trackId })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to add track to playlist');
            }
            
            return data.playlist;
        } catch (error) {
            console.error('Error adding track to playlist:', error);
            throw error;
        }
    },

    /**
     * Remove a track from a playlist
     * @param {string} playlistId - ID of playlist
     * @param {string} trackId - ID of track to remove
     * @returns {Promise<Object>} Updated playlist object
     */
    async removeTrackFromPlaylist(playlistId, trackId) {
        try {
            const response = await fetch(`${this.baseURL}/playlists/${playlistId}/tracks/${trackId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to remove track from playlist');
            }
            
            return data.playlist;
        } catch (error) {
            console.error('Error removing track from playlist:', error);
            throw error;
        }
    }
};