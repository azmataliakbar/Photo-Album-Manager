import { DatabaseManager } from './db.js';
import { AlbumManager } from './album.js';

class PhotoAlbumApp {
    private dbManager: DatabaseManager;
    private albumManager: AlbumManager;
    private currentView: 'albums' | 'album-detail' = 'albums';
    private currentAlbumId: string | null = null;
    private selectedPhotos: Set<{ path: string; caption: string }> = new Set();

    constructor() {
        this.dbManager = new DatabaseManager();
        this.albumManager = new AlbumManager(this.dbManager);
    }

    async init() {
        try {
            await this.dbManager.init();
            await this.seedTestData();
            this.setupEventListeners();
            await this.renderAlbums();
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to load application. Please refresh the page.');
        }
    }

    async seedTestData() {
        const albums = await this.albumManager.getAlbums();
        if (albums.length === 0) {
            console.log('Seeding test data...');
            
            // Create first album
            const albumId1 = await this.albumManager.createAlbum('Nature Photos', '2024-11-09');
            await this.albumManager.addPhotoToAlbum(albumId1, 'https://picsum.photos/seed/nature1/300/200', 'Beautiful mountain landscape');
            await this.albumManager.addPhotoToAlbum(albumId1, 'https://picsum.photos/seed/nature2/300/200', 'Forest path in autumn');
            await this.albumManager.addPhotoToAlbum(albumId1, 'https://picsum.photos/seed/nature3/300/200', 'Sunset over the lake');

            // Create second album
            const albumId2 = await this.albumManager.createAlbum('Urban Photography', '2024-11-08');
            await this.albumManager.addPhotoToAlbum(albumId2, 'https://picsum.photos/seed/city1/300/200', 'City skyline at night');
            await this.albumManager.addPhotoToAlbum(albumId2, 'https://picsum.photos/seed/city2/300/200', 'Street art and graffiti');
            
            console.log('Test data seeded successfully');
        }
    }

    setupEventListeners() {
        // Import button
        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.handleImport();
            });
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.handleExport();
            });
        }

        // Search functionality
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput') as HTMLInputElement;
        
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => {
                this.handleSearch(searchInput.value);
            });

            // Also search on Enter key
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch(searchInput.value);
                }
            });
        }

        // Create album button
        const createAlbumBtn = document.getElementById('createAlbumBtn');
        if (createAlbumBtn) {
            createAlbumBtn.addEventListener('click', () => {
                this.handleCreateAlbum();
            });
        }

        // Create first album button (in empty state)
        const createFirstAlbumBtn = document.getElementById('createFirstAlbum');
        if (createFirstAlbumBtn) {
            createFirstAlbumBtn.addEventListener('click', () => {
                this.handleCreateAlbum();
            });
        }

        // File import
        const importFile = document.getElementById('importFile') as HTMLInputElement;
        if (importFile) {
            importFile.addEventListener('change', (e) => {
                this.handleFileImport(e);
            });
        }
    }

    async handleSearch(query: string) {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
            await this.renderAlbums();
            return;
        }

        try {
            const results = await this.albumManager.searchAlbums(trimmedQuery);
            await this.renderAlbumList(results);
        } catch (error) {
            console.error('Search failed:', error);
            this.showError('Search failed. Please try again.');
        }
    }

    async renderAlbums() {
        try {
            const albums = await this.albumManager.getAlbums();
            await this.renderAlbumList(albums);
        } catch (error) {
            console.error('Failed to render albums:', error);
            this.showError('Failed to load albums.');
        }
    }

    async renderAlbumList(albums: any[]) {
        const container = document.getElementById('albums-list');
        const albumsContainer = document.getElementById('albums-container');
        const albumViewer = document.getElementById('album-viewer');
        const emptyState = document.getElementById('emptyState');

        if (!container || !albumsContainer || !albumViewer) return;

        // Update view state
        this.currentView = 'albums';

        // Hide viewer, show albums container
        albumViewer.classList.add('hidden');
        albumsContainer.classList.remove('hidden');

        // Show empty state if no albums
        if (albums.length === 0) {
            container.innerHTML = '';
            if (emptyState) {
                emptyState.classList.remove('hidden');
            }
            return;
        }

        // Hide empty state
        if (emptyState) {
            emptyState.classList.add('hidden');
        }

        container.innerHTML = '';

        for (const album of albums) {
            const albumDiv = document.createElement('div');
            albumDiv.className = 'album-card';
            
            // Get photos for this album
            const fullAlbum = await this.albumManager.getAlbumById(album.id);
            const photoCount = fullAlbum?.photos?.length || 0;

            albumDiv.innerHTML = `
                <div class="album-cover">
                    ${fullAlbum?.photos?.length ? `
                        <img src="${fullAlbum.photos[0].path}" alt="${fullAlbum.photos[0].caption || 'Album cover'}">
                    ` : `
                        <div style="width:100%;height:100%;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);display:flex;align-items:center;justify-content:center;color:white;">
                            <span>No Photos</span>
                        </div>
                    `}
                </div>
                <div class="album-info">
                    <h3>${this.escapeHtml(album.title) || 'Untitled Album'}</h3>
                    <p class="date">${this.formatDate(album.date) || 'Unknown date'}</p>
                    <div class="album-stats">
                        <span class="photo-count">📸 ${photoCount} photo${photoCount !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            `;

            // Click to view album
            albumDiv.addEventListener('click', () => {
                this.viewAlbum(album.id);
            });

            container.appendChild(albumDiv);
        }
    }

    async viewAlbum(albumId: string) {
        try {
            const album = await this.albumManager.getAlbumById(albumId);
            if (!album) {
                this.showError('Album not found.');
                return;
            }

            const albumsContainer = document.getElementById('albums-container');
            const albumViewer = document.getElementById('album-viewer');
            const currentAlbumTitle = document.getElementById('current-album-title');
            const photosGrid = document.getElementById('photos-grid');
            const breadcrumbCurrent = document.getElementById('breadcrumb-current');

            if (!albumsContainer || !albumViewer || !currentAlbumTitle || !photosGrid) return;

            // Update breadcrumb
            if (breadcrumbCurrent) {
                breadcrumbCurrent.textContent = album.title;
            }

            // Show breadcrumb
            const breadcrumb = document.querySelector('.breadcrumb');
            if (breadcrumb) {
                breadcrumb.classList.remove('hidden');
            }

            // Update title
            currentAlbumTitle.textContent = album.title;

            // Render photos
            photosGrid.innerHTML = album.photos.map((photo: any) => `
                <div class="photo-tile selectable-photo">
                    <img src="${photo.path}" alt="${this.escapeHtml(photo.caption) || 'Photo'}">
                    <div class="photo-overlay">
                        <div class="photo-caption">${this.escapeHtml(photo.caption) || ''}</div>
                        <div class="photo-selector">
                            <input type="checkbox" class="photo-checkbox" data-path="${photo.path}">
                        </div>
                    </div>
                </div>
            `).join('');

            // Add event listeners for photo selection
            const photoCheckboxes = photosGrid.querySelectorAll('.photo-checkbox');
            photoCheckboxes.forEach((checkbox: Element) => {
                const inputCheckbox = checkbox as HTMLInputElement;
                inputCheckbox.addEventListener('change', (e) => {
                    const target = e.target as HTMLInputElement;
                    const photoPath = target.dataset.path;
                    
                    if (target.checked) {
                        // Add photo to selection
                        const photo = album.photos.find((p: any) => p.path === photoPath);
                        if (photo) {
                            this.selectedPhotos.add({ path: photo.path, caption: photo.caption });
                        }
                    } else {
                        // Remove photo from selection
                        this.selectedPhotos.delete({ path: photoPath, caption: "" } as any); // Cast to override type for comparison
                    }
                    
                    // Update UI based on selection count
                    this.updatePhotoSelectionUI();
                });
            });

            // Update view state
            this.currentView = 'album-detail';
            this.currentAlbumId = albumId;

            // Switch views
            albumsContainer.classList.add('hidden');
            albumViewer.classList.remove('hidden');

            // Setup back button
            const backToAlbums = document.getElementById('backToAlbums');
            if (backToAlbums) {
                backToAlbums.onclick = () => this.showAlbums();
            }

        } catch (error) {
            console.error('Failed to view album:', error);
            this.showError('Failed to load album.');
        }
    }

    showAlbums() {
        const albumsContainer = document.getElementById('albums-container');
        const albumViewer = document.getElementById('album-viewer');
        const breadcrumb = document.querySelector('.breadcrumb');

        if (albumsContainer && albumViewer) {
            albumViewer.classList.add('hidden');
            albumsContainer.classList.remove('hidden');
        }

        // Update view state
        this.currentView = 'albums';
        this.currentAlbumId = null;

        // Hide breadcrumb
        if (breadcrumb) {
            breadcrumb.classList.add('hidden');
        }

        // Clear search
        const searchInput = document.getElementById('searchInput') as HTMLInputElement;
        if (searchInput) {
            searchInput.value = '';
        }
    }

    async handleCreateAlbum() {
        const title = prompt('Enter album title:');
        if (!title) return;

        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        try {
            await this.albumManager.createAlbum(title, date);
            await this.renderAlbums();
            this.showMessage('Album created successfully!');
        } catch (error) {
            console.error('Failed to create album:', error);
            this.showError('Failed to create album.');
        }
    }

    handleImport() {
        const importFile = document.getElementById('importFile') as HTMLInputElement;
        if (importFile) {
            importFile.click();
        }
    }

    handleExport() {
        this.showMessage('Export functionality would be implemented here.');
    }

    handleFileImport(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        this.showMessage('Import functionality would process the selected file.');
        // Reset file input
        input.value = '';
    }

    showError(message: string) {
        this.showMessage(message, 'error');
    }

    showMessage(message: string, type: 'success' | 'error' = 'success') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'error' ? '#ef4444' : '#10b981'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 500;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    escapeHtml(unsafe: string): string {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    formatDate(dateString: string): string {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    }

    updatePhotoSelectionUI() {
        // This method can be expanded to update UI based on selection count
        const selectionCount = this.selectedPhotos.size;
        
        // For now, just log the selection count
        console.log(`Selected photos: ${selectionCount}`);
    }

    getCurrentView(): 'albums' | 'album-detail' {
        return this.currentView;
    }

    getCurrentAlbumId(): string | null {
        return this.currentAlbumId;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const app = new PhotoAlbumApp();
    await app.init();
});