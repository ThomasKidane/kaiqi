import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { join } from 'path';

// Initialize database
const dbPath = join(process.cwd(), 'kaiqi.db');
const db = new sqlite3.Database(dbPath);

// Promisify database methods
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// Export database methods for use in other modules
export { dbRun, dbGet, dbAll };


// Initialize database on import
let dbInitialized = false;
const initDatabase = async () => {
  if (dbInitialized) return;
  
  try {
    await dbRun(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        vendor TEXT,
        amount REAL,
        date TEXT,
        invoice_number TEXT,
        extracted_text TEXT,
        status TEXT DEFAULT 'processed',
        processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add extracted_text column to existing documents table if it doesn't exist
    try {
      await dbRun(`ALTER TABLE documents ADD COLUMN extracted_text TEXT`);
    } catch (error) {
      // Column already exists, ignore error
    }

    await dbRun(`
      CREATE TABLE IF NOT EXISTS document_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id INTEGER,
        description TEXT,
        amount REAL,
        FOREIGN KEY (document_id) REFERENCES documents (id)
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES chat_sessions (session_id)
      )
    `);
    
    dbInitialized = true;
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

export interface DocumentData {
  vendor: string;
  amount: number;
  date: string;
  invoice_number: string;
  items: Array<{ description: string; amount: number }>;
  file_path: string;
  processed_at: string;
  status: string;
  extracted_text?: string;
}

export interface SavedDocument {
  id: number;
  filename: string;
  file_path: string;
  vendor: string;
  amount: number;
  date: string;
  invoice_number: string;
  extracted_text?: string;
  status: string;
  processed_at: string;
}

export async function saveToDatabase(data: DocumentData & { filename: string }) {
  try {
    // Ensure database is initialized
    await initDatabase();
    
    // Insert document using a different approach
    const insertQuery = `
      INSERT INTO documents (filename, file_path, vendor, amount, date, invoice_number, extracted_text, status, processed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await new Promise<void>((resolve, reject) => {
      db.run(insertQuery, [
        data.filename,
        data.file_path,
        data.vendor,
        data.amount,
        data.date,
        data.invoice_number,
        data.extracted_text || null,
        data.status,
        data.processed_at
      ], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    // Get the last inserted ID
    const lastIdResult = await dbGet('SELECT last_insert_rowid() as id');
    const documentId = (lastIdResult as any).id;

    // Insert items
    for (const item of data.items) {
      await dbRun(`
        INSERT INTO document_items (document_id, description, amount)
        VALUES (?, ?, ?)
      `, [documentId, item.description, item.amount]);
    }

    // Return saved document
    const savedDoc = await dbGet(`
      SELECT * FROM documents WHERE id = ?
    `, [documentId]);
    
    return savedDoc as SavedDocument;

  } catch (error) {
    console.error('Database save error:', error);
    throw new Error(`Failed to save to database: ${error.message}`);
  }
}

export async function getAllDocuments(): Promise<SavedDocument[]> {
  await initDatabase();
  const docs = await dbAll('SELECT * FROM documents ORDER BY processed_at DESC');
  return docs as SavedDocument[];
}

export async function getDocumentsByVendor(vendor: string): Promise<SavedDocument[]> {
  await initDatabase();
  const docs = await dbAll('SELECT * FROM documents WHERE vendor LIKE ? ORDER BY processed_at DESC', [`%${vendor}%`]);
  return docs as SavedDocument[];
}

export async function getOutstandingBalances(): Promise<SavedDocument[]> {
  await initDatabase();
  // Real logic: find documents that are older than 30 days (considered overdue)
  const docs = await dbAll(`
    SELECT * FROM documents 
    WHERE status = 'processed' 
    AND date < date('now', '-30 days')
    ORDER BY amount DESC
  `);
  return docs as SavedDocument[];
}

export async function getTotalAmount(): Promise<number> {
  await initDatabase();
  const result = await dbGet('SELECT SUM(amount) as total FROM documents') as { total: number };
  return result?.total || 0;
}

export async function searchDocuments(query: string): Promise<SavedDocument[]> {
  await initDatabase();
  const searchTerm = `%${query}%`;
  const docs = await dbAll(`
    SELECT * FROM documents 
    WHERE vendor LIKE ? OR invoice_number LIKE ? OR filename LIKE ?
    ORDER BY processed_at DESC
  `, [searchTerm, searchTerm, searchTerm]);
  return docs as SavedDocument[];
}

export async function createChatSession(sessionId: string) {
  await initDatabase();
  await dbRun('INSERT OR IGNORE INTO chat_sessions (session_id) VALUES (?)', [sessionId]);
}

export async function saveChatMessage(sessionId: string, role: string, content: string) {
  await initDatabase();
  await dbRun(`
    INSERT INTO chat_messages (session_id, role, content)
    VALUES (?, ?, ?)
  `, [sessionId, role, content]);
}

export async function getChatHistory(sessionId: string) {
  await initDatabase();
  const messages = await dbAll(`
    SELECT role, content, timestamp 
    FROM chat_messages 
    WHERE session_id = ? 
    ORDER BY timestamp ASC
  `, [sessionId]);
  return messages;
}

// Clear all data from database (for testing purposes)
export async function clearAllData() {
  await initDatabase();
  try {
    await dbRun('DELETE FROM document_items');
    await dbRun('DELETE FROM documents');
    await dbRun('DELETE FROM chat_messages');
    await dbRun('DELETE FROM chat_sessions');
    console.log('All data cleared from database');
    return { success: true, message: 'All data cleared successfully' };
  } catch (error) {
    console.error('Error clearing database:', error);
    return { success: false, message: 'Failed to clear database' };
  }
}
