'use client';

let db: IDBDatabase | null = null;
const DB_NAME = 'MoneyFlowDB';
const OBJECT_STORE_NAME = 'store';

async function initializeDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject(new Error('IndexedDB failed to open.'));
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
        db.createObjectStore(OBJECT_STORE_NAME);
      }
    };
  });
}

async function saveData(key: string, value: any): Promise<void> {
  try {
    const idb = await initializeDB();
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction(OBJECT_STORE_NAME, 'readwrite');
      const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
      const request = objectStore.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        console.error('IndexedDB save error:', event);
        reject(new Error('IndexedDB failed to save data.'));
      };
    });
  } catch (error) {
    console.warn('IndexedDB save failed, falling back to localStorage:', error);
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (localStorageError) {
      console.error('localStorage save error:', localStorageError);
      throw new Error('localStorage failed to save data.');
    }
  }
}

async function loadData(key: string): Promise<any | null> {
  try {
    const idb = await initializeDB();
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction(OBJECT_STORE_NAME, 'readonly');
      const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
      const request = objectStore.get(key);

      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        resolve(result !== undefined ? result : null);
      };

      request.onerror = (event) => {
        console.error('IndexedDB load error:', event);
        reject(new Error('IndexedDB failed to load data.'));
      };
    });
  } catch (error) {
    console.warn('IndexedDB load failed, falling back to localStorage:', error);
    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : null;
    } catch (localStorageError) {
      console.error('localStorage load error:', localStorageError);
      return null;
    }
  }
}

export { saveData, loadData };
