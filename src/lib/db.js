// IndexedDB ヘルパー — 音声 ArrayBuffer のキャッシュ
const DB_NAME = 'nightcast-db';
const STORE_NAME = 'audio-cache';

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => {
      dbPromise = null;
      reject(e.target.error);
    };
  });
  return dbPromise;
}

export async function getAudio(key) {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = (e) => resolve(e.target.result ?? null);
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (e) {
    console.warn('DB getAudio error:', e);
    return null;
  }
}

export async function saveAudio(key, buffer) {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(buffer, key);
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (e) {
    console.warn('DB saveAudio error:', e);
  }
}

export async function clearAllAudio() {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (e) {
    console.warn('DB clearAllAudio error:', e);
  }
}
