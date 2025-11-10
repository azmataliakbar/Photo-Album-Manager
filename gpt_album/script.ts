// script.ts - TypeScript for Photo Album Manager
// NOTE: In browser you need to compile this to JS (e.g. tsc script.ts) or use a bundler.
// This file uses standard DOM APIs and localStorage for persistence.

// -----------------------------
// Types
// -----------------------------
type Photo = {
  id: string;
  filename: string; // relative path e.g. photos/cat1.jpg
  name?: string;
  addedAt: string; // ISO
};

type Album = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  description?: string;
  photos: Photo[];
};

type AppState = {
  albums: Album[];
  order: string[]; // album ids in order
};

// -----------------------------
// Helpers
// -----------------------------
const mkId = (prefix = '') => prefix + Math.random().toString(36).slice(2, 9);
const qs = (sel: string) => document.querySelector(sel) as HTMLElement | null;
const qsa = (sel: string) => Array.from(document.querySelectorAll(sel)) as HTMLElement[];

// -----------------------------
// DOM Elements
// -----------------------------
const albumsContainer = qs('#albumsContainer')!;
const importInput = qs('#importInput') as HTMLInputElement;
const exportBtn = qs('#exportBtn')!;
const newAlbumBtn = qs('#newAlbumBtn')!;
const resetBtn = qs('#resetBtn')!;
const searchInput = qs('#searchInput') as HTMLInputElement;
const searchBtn = qs('#searchBtn')!;
const albumsCountEl = qs('#albumsCount')!;
const imagesCountEl = qs('#imagesCount')!;
const photosView = qs('#photosView')!;
const photosGrid = qs('#photosGrid')!;
const photosTitle = qs('#photosTitle')!;
const backBtn = qs('#backBtn')!;
const albumActions = qs('#albumActions')!;

// -----------------------------
// Storage
// -----------------------------
const STORAGE_KEY = 'photo_album_manager_v1';

function loadState(): AppState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { albums: [], order: [] };
  try {
    return JSON.parse(raw) as AppState;
  } catch {
    return { albums: [], order: [] };
  }
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// -----------------------------
// Initial sample assets (user provided)
// -----------------------------
const assetImages = [
  'cat1.jpg', 'cat2.jpg', 'cat3.jpg', 'cat4.jpeg', 'cat5.jpeg',
  'flower1.jpeg', 'flower2.jpeg', 'flower3.jpeg', 'flower4.jpeg',
  'nature1.jpeg', 'nature2.jpeg', 'nature3.jpeg',
  'urban1.jpeg', 'urban2.jpeg', 'urban3.jpeg',
  'garden1.jpeg', 'garden2.jpeg', 'garden3.jpeg',
  'az881.png','az882.png','az883.png','az884.png','az885.png','az886.png','az887.png','az888.png'
];

// Utility to check if image exists in photos folder - best-effort (image load)
function makeImgPath(name: string) {
  return `photos/${name}`;
}

// -----------------------------
// Album Manager
// -----------------------------
class AlbumManager {
  state: AppState;
  constructor() {
    this.state = loadState();
    // if empty - seed with suggested albums and auto-detect
    if (this.state.albums.length === 0) {
      this.seedDemoAndAutoDetect();
      saveState(this.state);
    }
  }

  async seedDemoAndAutoDetect() {
    // create albums
    const natureId = this.createAlbumSync('Nature Photos', '2024-11-09', 'Beautiful nature and landscape photos');
    const urbanId = this.createAlbumSync('Urban Photography', '2024-11-08', 'City life and architecture');
    const gardenId = this.createAlbumSync('Garden Photos', '2024-11-10', 'Beautiful garden and flower photos');
    const catId = this.createAlbumSync('Cat Photos', '2024-11-10', 'Cute and playful cat photos');
    const autoId = this.createAlbumSync('Auto-Detected Photos', '2024-11-10', 'Photos automatically detected from assets folder');

    // auto-distribute from assetImages to matching album by filename keywords
    for (const file of assetImages) {
      const path = makeImgPath(file);
      const lower = file.toLowerCase();
      const photo: Photo = { id: mkId('p_'), filename: path, name: file, addedAt: new Date().toISOString() };
      if (/(nature|nature1|nature2|nature3)/.test(lower)) {
        this.getAlbumById(natureId)!.photos.push(photo);
      } else if (/(urban|city)/.test(lower)) {
        this.getAlbumById(urbanId)!.photos.push(photo);
      } else if (/(garden|flower|flowers)/.test(lower)) {
        this.getAlbumById(gardenId)!.photos.push(photo);
      } else if (/(cat|kitten)/.test(lower)) {
        this.getAlbumById(catId)!.photos.push(photo);
      } else {
        this.getAlbumById(autoId)!.photos.push(photo);
      }
    }
  }

  createAlbumSync(title: string, date = new Date().toISOString().slice(0, 10), description = ''): string {
    const id = mkId('alb_');
    const album: Album = { id, title, date, description, photos: [] };
    this.state.albums.push(album);
    this.state.order.push(id);
    return id;
  }

  async createAlbum(title: string, date?: string, description?: string) {
    const id = this.createAlbumSync(title, date, description);
    saveState(this.state);
    return id;
  }

  getAlbumById(id: string) {
    return this.state.albums.find(a => a.id === id);
  }

  deleteAlbum(id: string) {
    this.state.albums = this.state.albums.filter(a => a.id !== id);
    this.state.order = this.state.order.filter(x => x !== id);
    saveState(this.state);
  }

  addPhotosToAlbum(albumId: string, files: File[] | Photo[]) {
    const album = this.getAlbumById(albumId);
    if (!album) return;
    for (const f of files as any) {
      if (f instanceof File) {
        const reader = new FileReader();
        reader.onload = () => {
          // Save as data URL to photo entry (so exported JSON contains image data)
          const p: Photo = { id: mkId('p_'), filename: reader.result as string, name: f.name, addedAt: new Date().toISOString() };
          album.photos.push(p);
          saveState(this.state);
          render();
        };
        reader.readAsDataURL(f);
      } else {
        // already Photo-like
        album.photos.push(f as Photo);
      }
    }
    saveState(this.state);
  }

  removePhoto(albumId: string, photoId: string) {
    const album = this.getAlbumById(albumId);
    if (!album) return;
    album.photos = album.photos.filter(p => p.id !== photoId);
    saveState(this.state);
  }

  reorderAlbums(newOrder: string[]) {
    this.state.order = newOrder;
    saveState(this.state);
  }

  reset() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = { albums: [], order: [] };
  }
}

const albumManager = new AlbumManager();

// -----------------------------
// Rendering & UI
// -----------------------------
let currentAlbumId: string | null = null;

function renderAlbums(filter = '') {
  albumsContainer.innerHTML = '';
  const { albums, order } = albumManager.state;

  // compute totals
  let totalImages = 0;
  albums.forEach(a => totalImages += a.photos.length);
  albumsCountEl.textContent = `Albums: ${albums.length}`;
  imagesCountEl.textContent = `Total images: ${totalImages}`;

  // show albums in saved order
  const ordered = order.map(id => albums.find(a => a.id === id)).filter(Boolean) as Album[];

  for (const album of ordered) {
    if (!album) continue;
    // filter
    const query = filter.trim().toLowerCase();
    if (query) {
      const content = `${album.title} ${album.date} ${album.description || ''}`.toLowerCase();
      if (!content.includes(query)) continue;
    }

    const card = document.createElement('article');
    card.className = 'album-card';
    card.draggable = true;
    card.dataset.albumId = album.id;

    // drag events
    card.addEventListener('dragstart', onDragStart);
    card.addEventListener('dragend', onDragEnd);

    // cover image (display first image if present)
    const cover = document.createElement('div');
    cover.className = 'album-cover';
    if (album.photos.length > 0) {
      const img = document.createElement('img');
      img.src = album.photos[0].filename;
      img.alt = album.title;
      cover.appendChild(img);
    } else {
      cover.innerHTML = `<div style="padding:10px;color:rgba(255,255,255,0.9);text-align:center">
        <div style="font-size:28px">📁</div>
        <div style="font-size:13px;margin-top:6px">No photos</div>
      </div>`;
    }
    card.appendChild(cover);

    // info row
    const info = document.createElement('div');
    info.className = 'album-info';
    info.innerHTML = `<div>
      <div class="album-title">${escapeHtml(album.title)}</div>
      <div class="album-meta">${album.date} • ${truncate(album.description || '', 60)}</div>
    </div>`;
    card.appendChild(info);

    // footer with counts & actions
    const footer = document.createElement('div');
    footer.className = 'album-footer';
    const left = document.createElement('div');
    left.innerHTML = `<div class="album-meta">${album.photos.length} photos</div>`;
    const actions = document.createElement('div');
    actions.className = 'album-actions';
    actions.innerHTML = `
      <button class="small-btn" data-open="${album.id}">Open</button>
      <button class="small-btn" data-add="${album.id}">➕ Add</button>
      <button class="small-btn" data-delete="${album.id}">🗑️ Delete</button>
    `;
    footer.appendChild(left);
    footer.appendChild(actions);
    card.appendChild(footer);

    // Bind action handlers
    actions.querySelector(`[data-open="${album.id}"]`)!.addEventListener('click', () => openAlbum(album.id));
    actions.querySelector(`[data-add="${album.id}"]`)!.addEventListener('click', () => {
      // trigger file input for adding to this album
      const finput = document.createElement('input');
      finput.type = 'file';
      finput.accept = 'image/*';
      finput.multiple = true;
      finput.onchange = () => {
        const files = Array.from(finput.files || []);
        albumManager.addPhotosToAlbum(album.id, files);
      };
      finput.click();
    });
    actions.querySelector(`[data-delete="${album.id}"]`)!.addEventListener('click', () => {
      if (confirm(`Delete album "${album.title}"? This will remove ${album.photos.length} photos from the manager.`)) {
        albumManager.deleteAlbum(album.id);
        render();
      }
    });

    albumsContainer.appendChild(card);
  }

  // enable drop for reorder
  enableAlbumDrop();
}

function render() {
  renderAlbums(searchInput.value || '');
  // hide photos view if open
  if (!currentAlbumId) {
    photosView.classList.add('hidden');
  }
}

function openAlbum(albumId: string) {
  const album = albumManager.getAlbumById(albumId);
  if (!album) return;
  currentAlbumId = albumId;
  photosTitle.textContent = `${album.title} • ${album.date}`;
  photosGrid.innerHTML = '';

  // album actions
  albumActions.innerHTML = '';
  const addBtn = document.createElement('button');
  addBtn.className = 'btn';
  addBtn.textContent = '➕ Add Photos';
  addBtn.onclick = () => {
    const finput = document.createElement('input');
    finput.type = 'file';
    finput.accept = 'image/*';
    finput.multiple = true;
    finput.onchange = () => {
      const files = Array.from(finput.files || []);
      albumManager.addPhotosToAlbum(albumId, files);
    };
    finput.click();
  };
  const exportAlbumBtn = document.createElement('button');
  exportAlbumBtn.className = 'btn';
  exportAlbumBtn.textContent = '📤 Export Album';
  exportAlbumBtn.onclick = () => {
    const data = JSON.stringify(album, null, 2);
    downloadBlob(`${album.title.replace(/\s+/g,'_')}.json`, data, 'application/json');
  };
  const deleteAlbumBtn = document.createElement('button');
  deleteAlbumBtn.className = 'btn danger';
  deleteAlbumBtn.textContent = '🗑️ Delete Album';
  deleteAlbumBtn.onclick = () => {
    if (confirm(`Delete album "${album.title}"?`)) {
      albumManager.deleteAlbum(albumId);
      currentAlbumId = null;
      render();
    }
  };
  albumActions.appendChild(addBtn);
  albumActions.appendChild(exportAlbumBtn);
  albumActions.appendChild(deleteAlbumBtn);

  // photos tiles
  for (const photo of album.photos) {
    const tile = document.createElement('div');
    tile.className = 'photo-tile';
    const img = document.createElement('img');
    img.src = photo.filename;
    img.alt = photo.name || '';
    tile.appendChild(img);
    const actions = document.createElement('div');
    actions.className = 'photo-actions';
    const nameEl = document.createElement('div');
    nameEl.style.fontSize = '12px';
    nameEl.style.color = 'var(--muted)';
    nameEl.textContent = photo.name || '';
    const removeBtn = document.createElement('button');
    removeBtn.className = 'small-btn';
    removeBtn.textContent = '🗑️ Remove';
    removeBtn.onclick = () => {
      if (confirm('Remove this photo from album?')) {
        albumManager.removePhoto(albumId, photo.id);
        openAlbum(albumId); // refresh
      }
    };
    actions.appendChild(nameEl);
    actions.appendChild(removeBtn);
    tile.appendChild(actions);
    photosGrid.appendChild(tile);
  }

  photosView.classList.remove('hidden');
}

// -----------------------------
// Drag & Drop for album reordering
// -----------------------------
let draggedEl: HTMLElement | null = null;

function onDragStart(this: HTMLElement, e: DragEvent) {
  draggedEl = this;
  this.classList.add('dragging');
  e.dataTransfer?.setData('text/plain', this.dataset.albumId || '');
  e.dataTransfer?.setDragImage(this, 16, 16);
}

function onDragEnd(this: HTMLElement) {
  this.classList.remove('dragging');
  draggedEl = null;
}

function enableAlbumDrop() {
  // Add dragover/enter listeners for insertion points
  const cards = Array.from(albumsContainer.querySelectorAll('.album-card')) as HTMLElement[];
  for (const c of cards) {
    c.ondragover = (ev) => {
      ev.preventDefault();
      const after = getDragAfterElement(albumsContainer, ev.clientY);
      if (after == null) {
        albumsContainer.appendChild(draggedEl!);
      } else {
        albumsContainer.insertBefore(draggedEl!, after);
      }
    };
    c.ondrop = (ev) => {
      ev.preventDefault();
      updateOrderFromDom();
    };
  }
  // Also handle drop on container
  albumsContainer.ondrop = (ev) => {
    ev.preventDefault();
    updateOrderFromDom();
  };
}

function getDragAfterElement(container: HTMLElement, y: number) {
  const draggableElements = [...container.querySelectorAll('.album-card:not(.dragging)')] as HTMLElement[];
  return draggableElements.reduce((closest: HTMLElement | null, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > (closest ? (closest.getBoundingClientRect().top + closest.getBoundingClientRect().height/2 - box.top - box.height/2) : -Infinity)) {
      return child;
    } else {
      return closest;
    }
  }, null as HTMLElement | null);
}

function updateOrderFromDom() {
  const ids = Array.from(albumsContainer.querySelectorAll('.album-card')).map(el => el.getAttribute('data-album-id') || '') as string[];
  albumManager.reorderAlbums(ids.filter(Boolean));
  render();
}

// -----------------------------
// Utilities & Events
// -----------------------------
searchBtn.addEventListener('click', () => {
  renderAlbums(searchInput.value || '');
});
searchInput.addEventListener('keyup', (e) => {
  if ((e as KeyboardEvent).key === 'Enter') renderAlbums(searchInput.value || '');
});

importInput.addEventListener('change', () => {
  const files = Array.from(importInput.files || []);
  if (files.length === 0) return;
  // allow user to pick destination album
  const choice = prompt('Enter album title to import into (will create if not exists):', 'Imported Photos');
  if (!choice) return;
  // find or create album
  let album = albumManager.state.albums.find(a => a.title.toLowerCase() === choice.toLowerCase());
  if (!album) {
    const id = albumManager.createAlbumSync(choice, new Date().toISOString().slice(0,10), 'Imported photos');
    album = albumManager.getAlbumById(id)!;
  }
  albumManager.addPhotosToAlbum(album.id, files);
  importInput.value = '';
  render();
});

exportBtn.addEventListener('click', () => {
  const data = JSON.stringify(albumManager.state, null, 2);
  downloadBlob('photo_albums_export.json', data, 'application/json');
});

newAlbumBtn.addEventListener('click', async () => {
  const title = prompt('Album title:', 'New Album');
  if (!title) return;
  const date = prompt('Album date (YYYY-MM-DD):', new Date().toISOString().slice(0,10)) || new Date().toISOString().slice(0,10);
  const description = prompt('Description (optional):', '') || '';
  await albumManager.createAlbum(title, date, description);
  render();
});

resetBtn.addEventListener('click', () => {
  if (confirm('Reset all data? This will clear localStorage and reload default data.')) {
    albumManager.reset();
    // re-seed
    albumManager.seedDemoAndAutoDetect().then(() => {
      saveState(albumManager.state);
      render();
    });
  }
});

backBtn.addEventListener('click', () => {
  currentAlbumId = null;
  render();
});

// helper: download blob
function downloadBlob(filename: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// small helpers
function truncate(s: string, n = 40) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function escapeHtml(s: string) { return s.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m] as string) ); }

// Initial render
render();
