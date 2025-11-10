export class AlbumManager {
    constructor(private dbManager: any) {}

    async createAlbum(title: string, date: string): Promise<string> {
        const id = 'album_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await this.dbManager.run(
            `INSERT INTO albums (id, title, date) VALUES (?, ?, ?)`,
            [id, title, date]
        );
        return id;
    }

    async addPhotoToAlbum(albumId: string, path: string, caption: string): Promise<void> {
        const id = 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await this.dbManager.run(
            `INSERT INTO photos (id, album_id, path, caption) VALUES (?, ?, ?, ?)`,
            [id, albumId, path, caption]
        );
    }

    async getAlbums(): Promise<any[]> {
        return await this.dbManager.all(`SELECT * FROM albums ORDER BY date DESC`);
    }

    async getAlbumById(id: string): Promise<any> {
        const album = await this.dbManager.get(`SELECT * FROM albums WHERE id = ?`, [id]);
        if (!album) return null;
        
        const photos = await this.dbManager.all(
            `SELECT * FROM photos WHERE album_id = ? ORDER BY id`, 
            [id]
        );
        
        return { ...album, photos };
    }

    async searchAlbums(query: string): Promise<any[]> {
        if (!query.trim()) {
            return this.getAlbums();
        }
        
        return await this.dbManager.all(
            `SELECT * FROM albums 
             WHERE title LIKE ? OR date LIKE ? 
             ORDER BY date DESC`,
            [`%${query}%`, `%${query}%`]
        );
    }

    async deleteAlbum(id: string): Promise<void> {
        await this.dbManager.run(`DELETE FROM photos WHERE album_id = ?`, [id]);
        await this.dbManager.run(`DELETE FROM albums WHERE id = ?`, [id]);
    }
}