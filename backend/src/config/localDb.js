import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../../data');
const dbFilePath = path.join(dataDir, 'db.json');

// Ensure data folder and db.json exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(dbFilePath)) {
  fs.writeFileSync(dbFilePath, JSON.stringify({ users: [], files: [] }, null, 2), 'utf-8');
}

// Read database
const readDB = () => {
  try {
    const content = fs.readFileSync(dbFilePath, 'utf-8');
    return JSON.parse(content || '{"users":[],"files":[]}');
  } catch {
    return { users: [], files: [] };
  }
};

// Write database
const writeDB = (data) => {
  fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
};

export const localDb = {
  users: {
    find: (filter = {}) => {
      const db = readDB();
      return db.users
        .filter((u) => {
          for (const key in filter) {
            if (u[key] !== filter[key]) return false;
          }
          return true;
        })
        .map((u) => ({ ...u, id: u.id || u._id }));
    },
    findOne: (filter = {}) => {
      const db = readDB();
      const u = db.users.find((u) => {
        for (const key in filter) {
          if (u[key] !== filter[key]) return false;
        }
        return true;
      });
      return u ? { ...u, id: u.id || u._id } : null;
    },
    findById: (id) => {
      const db = readDB();
      const u = db.users.find((u) => u._id === id || u.id === id);
      return u ? { ...u, id: u.id || u._id } : null;
    },
    create: (userData) => {
      const db = readDB();
      const uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newUser = {
        _id: uid,
        id: uid,
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.users.push(newUser);
      writeDB(db);
      return newUser;
    },
    insertOne: (userData) => {
      return localDb.users.create(userData);
    }
  },

  files: {
    find: (filter = {}) => {
      const db = readDB();
      return db.files
        .filter((f) => {
          for (const key in filter) {
            if (f[key] !== filter[key]) return false;
          }
          return true;
        })
        .map((f) => ({ ...f, id: f.id || f._id }));
    },
    findOne: (filter = {}) => {
      const db = readDB();
      const f = db.files.find((f) => {
        for (const key in filter) {
          if (f[key] !== filter[key]) return false;
        }
        return true;
      });
      return f ? { ...f, id: f.id || f._id } : null;
    },
    findById: (id) => {
      const db = readDB();
      const f = db.files.find((f) => f._id === id || f.id === id);
      return f ? { ...f, id: f.id || f._id } : null;
    },
    create: (fileData) => {
      const db = readDB();
      const fid = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newFile = {
        _id: fid,
        id: fid,
        downloadCount: 0,
        status: 'ACTIVE',
        ...fileData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.files.push(newFile);
      writeDB(db);
      return newFile;
    },
    insertOne: (fileData) => {
      return localDb.files.create(fileData);
    },
    updateOne: (filter, update) => {
      const db = readDB();
      const index = db.files.findIndex((f) => {
        for (const key in filter) {
          if (f[key] !== filter[key]) return false;
        }
        return true;
      });
      if (index !== -1) {
        db.files[index] = { ...db.files[index], ...update, updatedAt: new Date().toISOString() };
        writeDB(db);
        return db.files[index];
      }
      return null;
    },
    deleteOne: (id) => {
      const db = readDB();
      db.files = db.files.filter((f) => f._id !== id && f.id !== id);
      writeDB(db);
      return true;
    },
  },
};
