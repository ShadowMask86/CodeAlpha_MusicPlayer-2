/**
 * MUSIC PLAYER CONTROLLER
 * Manages audio playback, queue, and player UI
 * Uses HTML5 Audio API for media control
 */

class MusicPlayer {
    constructor() {
        // Audio element
        this.audio = document.getElementById('audioPlayer');
        
        // Player state
        this.currentTrack = null;
        this.queue = [];
        this.currentIndex = -1;
        this.isPlaying = false;
        this.isShuffled = false;
        this.repeatMode = 'off'; // 'off', 'all', 'one'
        this.volume = 0.8;
        
        // UI Elements
        this.elements = {
            playPauseBtn: document.getElementById('playPauseBtn'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            shuffleBtn: document.getElementById('shuffleBtn'),
            repeatBtn: document.getElementById('repeatBtn'),
            volumeBtn: document.getElementById('volumeBtn'),
            volumeSlider: document.getElementById('volumeSlider'),
            volumeIcon: document.getElementById('volumeIcon'),
            progressBar: document.getElementById('progressBar'),
            progressFill: document.getElementById('progressFill'),
            currentTime: document.getElementById('currentTime'),
            duration: document.getElementById('duration'),
            currentTrackTitle: document.getElementById('currentTrackTitle'),
            currentTrackArtist: document.getElementById('currentTrackArtist'),
            queueBtn: document.getElementById('queueBtn')
        };
        
        this.initializePlayer();
        this.attachEventListeners();
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    initializePlayer() {
        // Set initial volume
        this.audio.volume = this.volume;
        this.elements.volumeSlider.value = this.volume * 100;
        
        // Disable controls initially
        this.updateControlsState(false);
    }

    attachEventListeners() {
        // Playback controls
        this.elements.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.elements.prevBtn.addEventListener('click', () => this.playPrevious());
        this.elements.nextBtn.addEventListener('click', () => this.playNext());
        this.elements.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.elements.repeatBtn.addEventListener('click', () => this.cycleRepeatMode());
        
        // Volume controls
        this.elements.volumeBtn.addEventListener('click', () => this.toggleMute());
        this.elements.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value / 100));
        
        // Progress bar
        this.elements.progressBar.addEventListener('input', (e) => this.seek(e.target.value / 100));
        
        // Queue button
        this.elements.queueBtn.addEventListener('click', () => this.showQueue());
        
        // Audio events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.handleTrackEnd());
        this.audio.addEventListener('error', (e) => this.handleAudioError(e));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    // ============================================
    // PLAYBACK CONTROL
    // ============================================

    /**
     * Load and play a specific track
     * @param {Object} track - Track object from API
     * @param {Array} queue - Optional queue of tracks
     * @param {number} startIndex - Optional starting index in queue
     */
    async loadTrack(track, queue = null, startIndex = 0) {
        try {
            // Update queue if provided
            if (queue) {
                this.queue = [...queue];
                this.currentIndex = startIndex;
            } else {
                // If no queue, create one with just this track
                this.queue = [track];
                this.currentIndex = 0;
            }
            
            this.currentTrack = track;
            
            // Load audio
            this.audio.src = `http://localhost:3000${track.url}`;
            this.audio.load();
            
            // Update UI
            this.updateNowPlaying();
            this.updateControlsState(true);
            
            // Auto-play
            await this.play();
            
            // Update active track in UI (via custom event)
            window.dispatchEvent(new CustomEvent('trackChanged', { 
                detail: { track: this.currentTrack } 
            }));
            
        } catch (error) {
            console.error('Error loading track:', error);
            showToast('Error loading track', 'error');
        }
    }

    async play() {
        try {
            await this.audio.play();
            this.isPlaying = true;
            this.updatePlayPauseButton();
        } catch (error) {
            console.error('Error playing audio:', error);
            showToast('Error playing audio', 'error');
        }
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayPauseButton();
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    async playNext() {
        if (this.queue.length === 0) return;
        
        if (this.isShuffled) {
            // Random next track
            this.currentIndex = Math.floor(Math.random() * this.queue.length);
        } else {
            // Sequential next
            this.currentIndex = (this.currentIndex + 1) % this.queue.length;
        }
        
        await this.loadTrack(this.queue[this.currentIndex], this.queue, this.currentIndex);
    }

    async playPrevious() {
        if (this.queue.length === 0) return;
        
        // If more than 3 seconds played, restart current track
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }
        
        // Otherwise go to previous track
        this.currentIndex = (this.currentIndex - 1 + this.queue.length) % this.queue.length;
        await this.loadTrack(this.queue[this.currentIndex], this.queue, this.currentIndex);
    }

    seek(percent) {
        if (this.audio.duration) {
            this.audio.currentTime = percent * this.audio.duration;
        }
    }

    // ============================================
    // VOLUME CONTROL
    // ============================================

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        this.audio.volume = this.volume;
        this.updateVolumeIcon();
    }

    toggleMute() {
        if (this.audio.volume > 0) {
            this.audio.volume = 0;
            this.elements.volumeSlider.value = 0;
        } else {
            this.audio.volume = this.volume;
            this.elements.volumeSlider.value = this.volume * 100;
        }
        this.updateVolumeIcon();
    }

    updateVolumeIcon() {
        const volume = this.audio.volume;
        if (volume === 0) {
            this.elements.volumeIcon.textContent = '🔇';
        } else if (volume < 0.5) {
            this.elements.volumeIcon.textContent = '🔉';
        } else {
            this.elements.volumeIcon.textContent = '🔊';
        }
    }

    // ============================================
    // PLAYBACK MODES
    // ============================================

    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        this.elements.shuffleBtn.classList.toggle('active', this.isShuffled);
        this.elements.shuffleBtn.title = this.isShuffled ? 'Shuffle On' : 'Shuffle Off';
        showToast(this.isShuffled ? 'Shuffle enabled' : 'Shuffle disabled');
    }

    cycleRepeatMode() {
        const modes = ['off', 'all', 'one'];
        const currentIdx = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIdx + 1) % modes.length];
        
        // Update button
        this.elements.repeatBtn.classList.toggle('active', this.repeatMode !== 'off');
        
        // Update icon and title
        const icons = { off: '🔁', all: '🔁', one: '🔂' };
        const titles = { off: 'Repeat Off', all: 'Repeat All', one: 'Repeat One' };
        this.elements.repeatBtn.querySelector('span').textContent = icons[this.repeatMode];
        this.elements.repeatBtn.title = titles[this.repeatMode];
        
        showToast(`Repeat: ${titles[this.repeatMode]}`);
    }

    handleTrackEnd() {
        if (this.repeatMode === 'one') {
            // Repeat current track
            this.audio.currentTime = 0;
            this.play();
        } else if (this.repeatMode === 'all' || this.currentIndex < this.queue.length - 1) {
            // Play next track
            this.playNext();
        } else {
            // Stop at end of queue
            this.pause();
            this.audio.currentTime = 0;
        }
    }

    // ============================================
    // UI UPDATES
    // ============================================

    updateNowPlaying() {
        if (this.currentTrack) {
            this.elements.currentTrackTitle.textContent = this.currentTrack.title;
            this.elements.currentTrackArtist.textContent = this.currentTrack.artist;
        } else {
            this.elements.currentTrackTitle.textContent = 'No track playing';
            this.elements.currentTrackArtist.textContent = 'Select a track to begin';
        }
    }

    updatePlayPauseButton() {
        const icon = this.elements.playPauseBtn.querySelector('span');
        icon.textContent = this.isPlaying ? '⏸️' : '▶️';
        this.elements.playPauseBtn.title = this.isPlaying ? 'Pause' : 'Play';
    }

    updateProgress() {
        if (!this.audio.duration) return;
        
        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        this.elements.progressFill.style.width = `${percent}%`;
        this.elements.progressBar.value = percent;
        this.elements.currentTime.textContent = this.formatTime(this.audio.currentTime);
    }

    updateDuration() {
        if (this.audio.duration) {
            this.elements.duration.textContent = this.formatTime(this.audio.duration);
        }
    }

    updateControlsState(enabled) {
        const buttons = [
            this.elements.playPauseBtn,
            this.elements.prevBtn,
            this.elements.nextBtn,
            this.elements.shuffleBtn,
            this.elements.repeatBtn,
            this.elements.progressBar
        ];
        
        buttons.forEach(btn => {
            btn.disabled = !enabled;
            btn.style.opacity = enabled ? '1' : '0.5';
        });
    }

    // ============================================
    // QUEUE MANAGEMENT
    // ============================================

    showQueue() {
        const modal = document.getElementById('queueModal');
        const queueList = document.getElementById('queueList');
        
        // Clear existing queue
        queueList.innerHTML = '';
        
        if (this.queue.length === 0) {
            queueList.innerHTML = '<p class="empty-state">No tracks in queue</p>';
        } else {
            this.queue.forEach((track, index) => {
                const item = document.createElement('div');
                item.className = 'queue-item';
                if (index === this.currentIndex) {
                    item.classList.add('playing');
                }
                
                item.innerHTML = `
                    <div class="queue-item-number">${index + 1}</div>
                    <div style="flex: 1;">
                        <div class="track-title">${track.title}</div>
                        <div class="track-artist">${track.artist}</div>
                    </div>
                    <div class="time">${this.formatTime(track.duration || 0)}</div>
                `;
                
                item.addEventListener('click', () => {
                    this.loadTrack(track, this.queue, index);
                    modal.classList.remove('active');
                });
                
                queueList.appendChild(item);
            });
        }
        
        modal.classList.add('active');
    }

    // ============================================
    // KEYBOARD SHORTCUTS
    // ============================================

    handleKeyboard(e) {
        // Don't interfere with text inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch(e.key) {
            case ' ':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.audio.currentTime = Math.max(0, this.audio.currentTime - 5);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.audio.currentTime = Math.min(this.audio.duration, this.audio.currentTime + 5);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.setVolume(Math.min(1, this.audio.volume + 0.1));
                this.elements.volumeSlider.value = this.audio.volume * 100;
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.setVolume(Math.max(0, this.audio.volume - 0.1));
                this.elements.volumeSlider.value = this.audio.volume * 100;
                break;
            case 'n':
                this.playNext();
                break;
            case 'p':
                this.playPrevious();
                break;
            case 's':
                this.toggleShuffle();
                break;
            case 'r':
                this.cycleRepeatMode();
                break;
            case 'm':
                this.toggleMute();
                break;
        }
    }

    // ============================================
    // UTILITIES
    // ============================================

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    handleAudioError(e) {
        console.error('Audio error:', e);
        showToast('Error playing audio file', 'error');
        this.pause();
    }
}

// Initialize player when DOM is ready
let player;
document.addEventListener('DOMContentLoaded', () => {
    player = new MusicPlayer();
});