import { openDB, DBSchema, IDBPDatabase } from 'idb';

/**
 * Represents the schema of the card database.
 * @interface
 */
interface CardDataSchema extends DBSchema {
    /**
     * The images stored in the database.
     */
    images: {
        /**
         * The key of the image.
         */
        key: string;
        
        /**
         * The image blob.
         */
        value: Blob;
    };
}

let dbInstance: IDBPDatabase<CardDataSchema> | null = null;

/**
 * Initializes the card database.
 * @returns {Promise<IDBPDatabase<CardDataSchema>>} The database instance.
 */
export async function getImageIDB(): Promise<IDBPDatabase<CardDataSchema>> {
    if (!dbInstance) {
        dbInstance = await openDB<CardDataSchema>('YuGiOhDB', 3, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('images')) {
                    db.createObjectStore('images');
                }
            },
        });
    }
    return dbInstance;
}

/**
 * Clears the card database.
 * @param dbFactory The database factory function.
 */
export async function clearCardDatabase(dbFactory = getImageIDB): Promise<void> {
    const db = await dbFactory();
    await db.clear('images');
}
