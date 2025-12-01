/**
 * MAIN APPLICATION CONTROLLER
 * Manages UI interactions, data loading, and user actions
 */

// ============================================
// APPLICATION STATE
// ============================================

const AppState = {
    tracks: [],
    playlists: [],
    currentView: 'all-tracks',
    currentPlaylist: null,
    searchQuery: '',
    theme: localStorage.getItem('theme') || 'light'
};

// ============================================
// DOM READY
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    initializeTheme();
    attachEventListeners();
    await loadInitialData();
});

// ============================================
// THEME MANAGEMENT
// ============================================

function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    
    // Apply saved theme
    if (AppState.theme === 'dark') {
        document.body.classList.add('dark-theme');
        themeIcon.textContent = '☀️';
    }
    
    // Toggle theme on click
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        themeIcon.textContent = isDark ? '☀️' : '🌙';
        AppState.theme = isDark ? 'dark' : 'light';
        localStorage.setItem('theme', AppState.theme);
    });
}

// ============================================
// EVENT LISTENERS
// ============================================

function attachEventListeners() {
    // Header buttons
    document.getElementById('uploadBtn').addEventListener('click', openUploadModal);
    document.getElementById('createPlaylistBtn').addEventListener('click', openPlaylistModal);
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const view = e.currentTarget.dataset.view;
            switchView(view);
        });
    });
    
    // Search
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');
    
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        AppState.searchQuery = '';
        clearSearch.classList.remove('active');
        renderTracks(AppState.tracks);
    });
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModals();
            }
        });
    });
    
    // Upload functionality
    setupUploadHandlers();
    
    // Playlist form
    document.getElementById('playlistForm').addEventListener('submit', handlePlaylistCreate);
    
    // Track change listener (from player)
    window.addEventListener('trackChanged', (e) => {
        updateActiveTrack(e.detail.track);
    });
}

// ============================================
// DATA LOADING
// ============================================

async function loadInitialData() {
    try {
        showLoading(true);
        
        // Load tracks and playlists in parallel
        const [tracks, playlists] = await Promise.all([
            API.getAllTracks(),
            API.getAllPlaylists()
        ]);
        
        AppState.tracks = tracks;
        AppState.playlists = playlists;
        
        renderTracks(tracks);
        renderPlaylistsSidebar(playlists);
        
        updateViewTitle('All Tracks', `${tracks.length} tracks`);
        
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load data. Please refresh the page.');
    } finally {
        showLoading(false);
    }
}

async function refreshTracks() {
    try {
        const tracks = await API.getAllTracks();
        AppState.tracks = tracks;
        
        if (AppState.currentView === 'all-tracks' && !AppState.searchQuery) {
            renderTracks(tracks);
        }
    } catch (error) {
        console.error('Error refreshing tracks:', error);
    }
}

async function refreshPlaylists() {
    try {
        const playlists = await API.getAllPlaylists();
        AppState.playlists = playlists;
        renderPlaylistsSidebar(playlists);
    } catch (error) {
        console.error('Error refreshing playlists:', error);
    }
}

// ============================================
// VIEW MANAGEMENT
// ============================================

async function switchView(view) {
    AppState.currentView = view;
    AppState.searchQuery = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearch').classList.remove('active');
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === view);
    });
    
    showLoading(true);
    
    try {
        switch(view) {
            case 'all-tracks':
                renderTracks(AppState.tracks);
                updateViewTitle('All Tracks', `${AppState.tracks.length} tracks`);
                break;
                
            case 'playlists':
                renderPlaylists(AppState.playlists);
                updateViewTitle('Your Playlists', `${AppState.playlists.length} playlists`);
                break;
                
            case 'genres':
                renderByGenre();
                updateViewTitle('Browse by Genre', '');
                break;
                
            case 'artists':
                renderByArtist();
                updateViewTitle('Browse by Artist', '');
                break;
        }
    } finally {
        showLoading(false);
    }
}

async function viewPlaylist(playlistId) {
    try {
        showLoading(true);
        
        const playlist = await API.getPlaylist(playlistId);
        AppState.currentPlaylist = playlist;
        
        renderTracks(playlist.tracks);
        updateViewTitle(playlist.name, `${playlist.tracks.length} tracks`);
        
        AppState.currentView = 'playlist-detail';
    } catch (error) {
        console.error('Error loading playlist:', error);
        showToast('Error loading playlist', 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// RENDERING FUNCTIONS
// ============================================

function renderTracks(tracks) {
    const container = document.getElementById('tracksContainer');
    container.innerHTML = '';
    
    if (!tracks || tracks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎵</div>
                <h3>No tracks found</h3>
                <p>Upload some music to get started!</p>
                <button class="btn btn-primary" onclick="openUploadModal()">
                    <span>📤</span> Upload Music
                </button>
            </div>
        `;
        return;
    }
    
    tracks.forEach(track => {
        const card = createTrackCard(track);
        container.appendChild(card);
    });
}

function createTrackCard(track) {
    const card = document.createElement('div');
    card.className = 'track-card';
    card.dataset.trackId = track.id;
    
    card.innerHTML = `
        <div class="track-artwork-card">🎵</div>
        <div class="track-info">
            <div class="track-title" title="${track.title}">${track.title}</div>
            <div class="track-artist" title="${track.artist}">${track.artist}</div>
        </div>
        <div class="track-actions">
            <button onclick="playTrack('${track.id}')" title="Play">▶️</button>
            <button onclick="addToPlaylist('${track.id}')" title="Add to playlist">➕</button>
        </div>
    `;
    
    // Play track on card click (but not on buttons)
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.track-actions')) {
            playTrack(track.id);
        }
    });
    
    return card;
}

function renderPlaylists(playlists) {
    const container = document.getElementById('tracksContainer');
    container.innerHTML = '';
    
    if (!playlists || playlists.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>No playlists yet</h3>
                <p>Create your first playlist!</p>
                <button class="btn btn-primary" onclick="openPlaylistModal()">
                    <span>➕</span> Create Playlist
                </button>
            </div>
        `;
        return;
    }
    
    playlists.forEach(playlist => {
        const card = createPlaylistCard(playlist);
        container.appendChild(card);
    });
}

function createPlaylistCard(playlist) {
    const card = document.createElement('div');
    card.className = 'track-card';
    
    card.innerHTML = `
        <div class="track-artwork-card">📋</div>
        <div class="track-info">
            <div class="track-title">${playlist.name}</div>
            <div class="track-artist">${playlist.tracks.length} tracks</div>
        </div>
        <div class="track-actions">
            <button onclick="viewPlaylist('${playlist.id}')" title="View">👁️</button>
            <button onclick="deletePlaylist('${playlist.id}')" title="Delete">🗑️</button>
        </div>
    `;
    
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.track-actions')) {
            viewPlaylist(playlist.id);
        }
    });
    
    return card;
}

function renderByGenre() {
    const genreMap = {};
    
    AppState.tracks.forEach(track => {
        const genre = track.genre || 'Uncategorized';
        if (!genreMap[genre]) {
            genreMap[genre] = [];
        }
        genreMap[genre].push(track);
    });
    
    const container = document.getElementById('tracksContainer');
    container.innerHTML = '';
    
    Object.entries(genreMap).forEach(([genre, tracks]) => {
        const card = document.createElement('div');
        card.className = 'track-card';
        
        card.innerHTML = `
            <div class="track-artwork-card">🎸</div>
            <div class="track-info">
                <div class="track-title">${genre}</div>
                <div class="track-artist">${tracks.length} tracks</div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            renderTracks(tracks);
            updateViewTitle(`Genre: ${genre}`, `${tracks.length} tracks`);
        });
        
        container.appendChild(card);
    });
}

function renderByArtist() {
    const artistMap = {};
    
    AppState.tracks.forEach(track => {
        const artist = track.artist || 'Unknown Artist';
        if (!artistMap[artist]) {
            artistMap[artist] = [];
        }
        artistMap[artist].push(track);
    });
    
    const container = document.getElementById('tracksContainer');
    container.innerHTML = '';
    
    Object.entries(artistMap).forEach(([artist, tracks]) => {
        const card = document.createElement('div');
        card.className = 'track-card';
        
        card.innerHTML = `
            <div class="track-artwork-card">🎤</div>
            <div class="track-info">
                <div class="track-title">${artist}</div>
                <div class="track-artist">${tracks.length} tracks</div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            renderTracks(tracks);
            updateViewTitle(`Artist: ${artist}`, `${tracks.length} tracks`);
        });
        
        container.appendChild(card);
    });
}

function renderPlaylistsSidebar(playlists) {
    const sidebar = document.getElementById('playlistsSidebar');
    sidebar.innerHTML = '';
    
    if (playlists.length === 0) {
        sidebar.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.875rem;">No playlists yet</p>';
        return;
    }
    
    playlists.forEach(playlist => {
        const item = document.createElement('button');
        item.className = 'playlist-item';
        item.textContent = `📋 ${playlist.name}`;
        item.addEventListener('click', () => viewPlaylist(playlist.id));
        sidebar.appendChild(item);
    });
}

// ============================================
// PLAYBACK FUNCTIONS
// ============================================

function playTrack(trackId) {
    const track = AppState.tracks.find(t => t.id === trackId);
    if (!track) return;
    
    // Get current track list based on view
    let queue = AppState.tracks;
    if (AppState.currentView === 'playlist-detail' && AppState.currentPlaylist) {
        queue = AppState.currentPlaylist.tracks;
    }
    
    const index = queue.findIndex(t => t.id === trackId);
    player.loadTrack(track, queue, index);
}

function updateActiveTrack(track) {
    // Remove active class from all cards
    document.querySelectorAll('.track-card').forEach(card => {
        card.classList.remove('playing');
    });
    
    // Add active class to current track
    const activeCard = document.querySelector(`[data-track-id="${track.id}"]`);
    if (activeCard) {
        activeCard.classList.add('playing');
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

async function handleSearch(e) {
    const query = e.target.value.trim();
    AppState.searchQuery = query;
    
    const clearBtn = document.getElementById('clearSearch');
    clearBtn.classList.toggle('active', query.length > 0);
    
    if (query.length === 0) {
        renderTracks(AppState.tracks);
        return;
    }
    
    try {
        showLoading(true);
        const results = await API.searchTracks(query);
        renderTracks(results);
        updateViewTitle('Search Results', `${results.length} tracks found`);
    } catch (error) {
        console.error('Error searching:', error);
        showToast('Search failed', 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// UPLOAD FUNCTIONALITY
// ============================================

function setupUploadHandlers() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    
    // Click to select files
    selectFileBtn.addEventListener('click', () => fileInput.click());
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });
}

async function handleFiles(files) {
    const uploadProgress = document.getElementById('uploadProgress');
    const fileList = uploadProgress.querySelector('.upload-file-list');
    
    uploadProgress.style.display = 'block';
    fileList.innerHTML = '';
    
    const audioFiles = Array.from(files).filter(file => file.type.startsWith('audio/'));
    
    if (audioFiles.length === 0) {
        showToast('Please select audio files', 'error');
        return;
    }
    
    for (const file of audioFiles) {
        await uploadFile(file, fileList);
    }
    
    showToast(`${audioFiles.length} file(s) uploaded successfully!`, 'success');
    
    // Refresh tracks and close modal
    setTimeout(() => {
        closeModals();
        refreshTracks();
        uploadProgress.style.display = 'none';
    }, 1000);
}

async function uploadFile(file, container) {
    const item = document.createElement('div');
    item.className = 'upload-file-item';
    item.innerHTML = `
        <span>📁 ${file.name}</span>
        <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
        </div>
        <span class="status">Uploading...</span>
    `;
    container.appendChild(item);
    
    const progressFill = item.querySelector('.progress-fill');
    const status = item.querySelector('.status');
    
    try {
        // Simulate progress (real progress tracking requires xhr)
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            progressFill.style.width = `${Math.min(progress, 90)}%`;
        }, 100);
        
        await API.uploadTrack(file);
        
        clearInterval(interval);
        progressFill.style.width = '100%';
        status.textContent = '✓ Complete';
        status.style.color = 'var(--accent-primary)';
    } catch (error) {
        console.error('Upload error:', error);
        status.textContent = '✗ Failed';
        status.style.color = '#ef4444';
    }
}

// ============================================
// PLAYLIST MANAGEMENT
// ============================================

async function handlePlaylistCreate(e) {
    e.preventDefault();
    
    const name = document.getElementById('playlistName').value.trim();
    const description = document.getElementById('playlistDescription').value.trim();
    
    if (!name) {
        showToast('Please enter a playlist name', 'error');
        return;
    }
    
    try {
        await API.createPlaylist(name, description);
        showToast('Playlist created successfully!', 'success');
        
        closeModals();
        e.target.reset();
        
        await refreshPlaylists();
        switchView('playlists');
    } catch (error) {
        console.error('Error creating playlist:', error);
        showToast(error.message || 'Failed to create playlist', 'error');
    }
}

async function addToPlaylist(trackId) {
    if (AppState.playlists.length === 0) {
        showToast('Create a playlist first!', 'error');
        openPlaylistModal();
        return;
    }
    
    // Simple implementation: add to first playlist
    // TODO: Show playlist selector modal
    const playlist = AppState.playlists[0];
    
    try {
        await API.addTrackToPlaylist(playlist.id, trackId);
        showToast(`Added to "${playlist.name}"`, 'success');
    } catch (error) {
        console.error('Error adding track:', error);
        showToast(error.message || 'Failed to add track', 'error');
    }
}

async function deletePlaylist(playlistId) {
    if (!confirm('Are you sure you want to delete this playlist?')) {
        return;
    }
    
    try {
        await API.deletePlaylist(playlistId);
        showToast('Playlist deleted', 'success');
        await refreshPlaylists();
        switchView('playlists');
    } catch (error) {
        console.error('Error deleting playlist:', error);
        showToast('Failed to delete playlist', 'error');
    }
}

// ============================================
// MODAL MANAGEMENT
// ============================================

function openUploadModal() {
    document.getElementById('uploadModal').classList.add('active');
}

function openPlaylistModal() {
    document.getElementById('playlistModal').classList.add('active');
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

// ============================================
// UI HELPERS
// ============================================

function updateViewTitle(title, subtitle = '') {
    document.getElementById('viewTitle').textContent = title;
    document.getElementById('viewSubtitle').textContent = subtitle;
}

function showLoading(show) {
    const container = document.getElementById('tracksContainer');
    if (show) {
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
    }
}

function showError(message) {
    const container = document.getElementById('tracksContainer');
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// UTILITIES
// ============================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}