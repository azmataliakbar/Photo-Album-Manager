import initSqlJs from 'sql.js';

export class DatabaseManager {
    private db: any = null;

    async init(): Promise<void> {
        try {
            const SQL = await initSqlJs({
                locateFile: (file: string) => 
                    `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
            });
            
            this.db = new SQL.Database();
            
            // Create tables if they don't exist
            this.db.run(`
                CREATE TABLE IF NOT EXISTS albums (
                    id TEXT PRIMARY KEY, 
                    title TEXT, 
                    date TEXT
                );
                CREATE TABLE IF NOT EXISTS photos (
                    id TEXT PRIMARY KEY, 
                    album_id TEXT, 
                    path TEXT, 
                    caption TEXT,
                    FOREIGN KEY (album_id) REFERENCES albums(id)
                );
            `);
            
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }

    async run(sql: string, params: any[] = []): Promise<void> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        this.db.run(sql, params);
    }

    async get(sql: string, params: any[] = []): Promise<any> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        const stmt = this.db.prepare(sql);
        try {
            stmt.bind(params);
            return stmt.step() ? stmt.getAsObject() : null;
        } finally {
            stmt.free();
        }
    }

    async all(sql: string, params: any[] = []): Promise<any[]> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        const stmt = this.db.prepare(sql);
        try {
            stmt.bind(params);
            const results = [];
            while (stmt.step()) {
                results.push(stmt.getAsObject());
            }
            return results;
        } finally {
            stmt.free();
        }
    }
}