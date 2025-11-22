
const DB_NAME = 'LocaleDB';
const STORE_NAME = 'keyval';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => {
      console.error('Failed to open database:', request.error);
      reject(request.error);
      dbPromise = null;
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
            db.close();
            dbPromise = null;
        };
        db.onclose = () => {
            dbPromise = null;
        };
        resolve(db);
    };
  });
  return dbPromise;
}

async function performTransaction(
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => IDBRequest
): Promise<any> {
    let db: IDBDatabase;
    try {
        db = await openDB();
    } catch (e) {
        console.error("Failed to open DB for transaction", e);
        throw e;
    }

    const runRequest = (database: IDBDatabase) => new Promise((resolve, reject) => {
        let transaction: IDBTransaction;
        try {
            transaction = database.transaction(STORE_NAME, mode);
        } catch (err) {
            reject(err);
            return;
        }
        
        const store = transaction.objectStore(STORE_NAME);
        const request = callback(store);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });

    try {
        return await runRequest(db);
    } catch (error: any) {
        // Retry on connection closed or invalid state
        if (error && (
            error.name === 'InvalidStateError' || 
            (error.message && typeof error.message === 'string' && error.message.includes('closing'))
        )) {
             // console.warn('Database connection appears closed or invalid. Retrying...');
             dbPromise = null; 
             const newDb = await openDB();
             return await runRequest(newDb); 
        }
        throw error;
    }
}

export const get = async (key: string) => {
  try {
    return await performTransaction('readonly', (store) => store.get(key));
  } catch (e) {
    console.error(`IDB Get Error for ${key}:`, e);
    return undefined;
  }
};

export const set = async (key: string, value: any) => {
  try {
    await performTransaction('readwrite', (store) => store.put(value, key));
  } catch (e) {
     console.error(`IDB Set Error for ${key}:`, e);
  }
};
