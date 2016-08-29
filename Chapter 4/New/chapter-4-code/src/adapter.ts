namespace Adapter {
    interface Storage {
        get<T>(key: string): Promise<T>;
        set<T>(key: string, value: T): Promise<void>;
    }

    class IndexedDBStorage implements Storage {
        constructor(
            public db: IDBDatabase,
            public storeName = 'default'
        ) { }

        open(name: string): Promise<IndexedDBStorage> {
            return new Promise<IndexedDBStorage>((resolve, reject) => {
                let request = indexedDB.open(name);

                request.onsuccess = event => {
                    let db = request.result as IDBDatabase;
                    let storage = new IndexedDBStorage(db);
                    resolve(storage);
                };

                request.onerror = event => {
                    reject(request.error);
                };
            });
        }

        get<T>(key: string): Promise<T> {
            return new Promise<T>((resolve, reject) => {
                let transaction = this.db.transaction(this.storeName);
                let store = transaction.objectStore(this.storeName);

                let request = store.get(key);

                request.onsuccess = event => {
                    resolve(request.result);
                };

                request.onerror = event => {
                    reject(request.error);
                };
            });
        }

        set<T>(key: string, value: T): Promise<void> {
            return new Promise<void>((resolve, reject) => {
                let transaction = this.db.transaction(this.storeName, 'readwrite');
                let store = transaction.objectStore(this.storeName);

                let request = store.put(value, key);

                request.onsuccess = event => {
                    resolve();
                };

                request.onerror = event => {
                    reject(request.error);
                };
            });
        }
    }
}
