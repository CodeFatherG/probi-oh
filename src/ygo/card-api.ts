// card-api.ts

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { CardInformation } from '@ygo/card-information';

/**
 * Represents the response from the Yu-Gi-Oh! API.
 * @interface
 */
interface ApiResponse {
    /**
     * The data returned from the api
     */
    data: CardInformation[];
}

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
async function initDB(): Promise<IDBPDatabase<CardDataSchema>> {
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
 * Fetches card information from the Yu-Gi-Oh! API.
 * @param url The URL to fetch the card information from.
 * @param db The database to store the card information in.
 * @param fetcher The fetch function to use.
 * @returns {Promise<CardInformation | null>} The card information.
 */
async function getCardInformation(
    url: URL,
    db: IDBPDatabase<CardDataSchema>,
    fetcher = fetch
): Promise<CardInformation | null> {
    try {
        const response = await fetcher(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const info: ApiResponse = await response.json();

        if (info && info.data.length > 0) {
            const card = info.data[0];
            return card;
        } else {
            console.error(`No card found at ${url}`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching card data:", error);
        return null;
    }
}




/**
 * Gets card information by ID.
 * @param id The ID of the card.
 * @param fetcher The fetch function to use.
 * @param dbFactory The database factory function.
 * @returns {Promise<CardInformation | null>} The card information.
 */
async function getCardById(id: number, fetcher = fetch, dbFactory = initDB): Promise<CardInformation | null> {
    const db = await dbFactory();
    
    const url = new URL('https://db.ygoprodeck.com/api/v7/cardinfo.php');
    url.searchParams.append('id', id.toString());

    return await getCardInformation(url, db, fetcher);
}

/**
 * Gets card information by name.
 * @param name The name of the card.
 * @param fetcher The fetch function to use.
 * @param dbFactory The database factory function.
 * @returns {Promise<CardInformation | null>} The card information.
 */
async function getCardByName(name: string, fetcher = fetch, dbFactory = initDB): Promise<CardInformation | null> {
    const db = await dbFactory();
    
    const url = new URL('https://db.ygoprodeck.com/api/v7/cardinfo.php');
    url.searchParams.append('name', name);

    return await getCardInformation(url, db, fetcher);
}

export async function getCard(idOrName: string | number, fetcher = fetch, dbFactory = initDB): Promise<CardInformation | null> {
    let card: CardInformation | null = null;

    if (typeof idOrName === 'number') {
        card = await getCardById(idOrName, fetcher, dbFactory);
    } else {
        card = await getCardByName(idOrName, fetcher, dbFactory);
    }

    console.log(card);
    
    return card;
}

/**
 * Searches for cards using a fuzzy search query.
 * @param query The query to search for.
 * @param fetcher The fetch function to use.
 * @returns {Promise<CardInformation[]>} The card information.
 */
export async function fuzzySearchCard(query: string, fetcher = fetch): Promise<CardInformation[]> {
    const url = new URL('https://db.ygoprodeck.com/api/v7/cardinfo.php');
    url.searchParams.append('fname', query);

    try {
        const response = await fetcher(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const info: ApiResponse = await response.json();

        if (info && info.data.length > 0) {
            return info.data;
        } else {
            console.error(`No cards found matching query ${query}`);
            return [];
        }
    } catch (error) {
        console.error('Error fetching card data:', error);
        return [];
    }
}

export async function getCardImage(idOrName: number | string, 
                                   imageType: 'full' | 'small' | 'cropped' = 'full', 
                                   fetcher = fetch, 
                                   dbFactory = initDB): Promise<Blob | null> {
    const db = await dbFactory();
    let card: CardInformation | null;

    if (typeof idOrName === 'number') {
        card = await getCardById(idOrName, fetcher, dbFactory);
    } else {
        card = await getCardByName(idOrName, fetcher, dbFactory);
    }

    if (!card) {
        console.error(`No card found for ${idOrName}`);
        return null;
    }

    const gitLink = `https://raw.githubusercontent.com/CodeFatherG/yugioh-db/master/cards/${card.id}/images/${imageType}.jpg`;

    const cachedImage = await db.get('images', gitLink);
    if (cachedImage) return cachedImage;

    try {
        const response = await fetcher(gitLink);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const imageBlob = await response.blob();
        await db.put('images', imageBlob, gitLink);
        return imageBlob;
    } catch (error) {
        console.error('Error fetching image:', error);
        return null;
    }
}

/**
 * Clears the card database.
 * @param dbFactory The database factory function.
 */
export async function clearCardDatabase(dbFactory = initDB): Promise<void> {
    const db = await dbFactory();
    await db.clear('images');
}

export async function getArchetypes(fetcher = fetch): Promise<string[]> {
    const url = new URL('https://db.ygoprodeck.com/api/v7/archetypes.php');

    try {
        const response = await fetcher(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: { archetype_name: string }[] = await response.json();
        const archetypes = data.map(item => item.archetype_name);
        return archetypes;
    } catch (error) {
        console.error('Error fetching archetypes:', error);
        return [];
    }
}
