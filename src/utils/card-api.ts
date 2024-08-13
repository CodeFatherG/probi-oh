// card-api.ts

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { CardInformation } from './card-information';

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
     * The cards stored in the database.
     */
    cards: {
        /**
         * The key of the card.
         */
        key: string;
        /**
         * The Card Information.
         */
        value: CardInformation;
    };

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
        dbInstance = await openDB<CardDataSchema>('YuGiOhDB', 1, {
            upgrade(db) {
                db.createObjectStore('cards');
                db.createObjectStore('images');
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
async function getCardInformation(url: URL, db: IDBPDatabase<CardDataSchema>, fetcher = fetch): Promise<CardInformation | null> {
    try {
        const response = await fetcher(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ApiResponse = await response.json();

        if (data.data && data.data.length > 0) {
            const card = data.data[0];
            await db.put('cards', card, card.id.toString());
            await db.put('cards', card, card.name);
            return card;
        } else {
            console.error(`No card found at ${url}`);
            return null;
        }
    } catch (error) {
        console.error('Error fetching card data:', error);
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
export async function getCardById(id: number, fetcher = fetch, dbFactory = initDB): Promise<CardInformation | null> {
    const db = await dbFactory();
    
    const cachedCard = await db.get('cards', id.toString()) ?? null;
    if (cachedCard) return cachedCard;

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
export async function getCardByName(name: string, fetcher = fetch, dbFactory = initDB): Promise<CardInformation | null> {
    const db = await dbFactory();
    
    const cachedCard = await db.get('cards', name) ?? null;
    if (cachedCard) return cachedCard;

    const url = new URL('https://db.ygoprodeck.com/api/v7/cardinfo.php');
    url.searchParams.append('name', name);

    return await getCardInformation(url, db, fetcher);
}

/**
 * Searches for cards using a fuzzy search query.
 * @param query The query to search for.
 * @param fetcher The fetch function to use.
 * @param dbFactory The database factory function.
 * @returns {Promise<CardInformation[]>} The card information.
 */
export async function fuzzySearchCard(query: string, fetcher = fetch, dbFactory = initDB): Promise<CardInformation[]> {
    const db = await dbFactory();

    const url = new URL('https://db.ygoprodeck.com/api/v7/cardinfo.php');
    url.searchParams.append('fname', query);

    try {
        const response = await fetcher(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ApiResponse = await response.json();

        if (data.data && data.data.length > 0) {
            await Promise.all(data.data.map(async (card) => {
                await db.put('cards', card, card.id.toString());
                await db.put('cards', card, card.name);
            }));
            return data.data;
        } else {
            console.error(`No cards found matching query ${query}`);
            return [];
        }
    } catch (error) {
        console.error('Error fetching card data:', error);
        return [];
    }
}

/**
 * Gets the image of a card by ID or name.
 * @param idOrName The ID or name of the card.
 * @param fetcher The fetch function to use.
 * @param dbFactory The database factory function.
 * @returns {Promise<Blob | null>} The card image.
 */
export async function getCardImage(idOrName: number | string, fetcher = fetch, dbFactory = initDB): Promise<Blob | null> {
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

    const imageUrl = card.card_images[0].image_url;

    const cachedImage = await db.get('images', imageUrl);
    if (cachedImage) return cachedImage;

    try {
        const response = await fetcher(imageUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const imageBlob = await response.blob();
        await db.put('images', imageBlob, imageUrl);
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
    await db.clear('cards');
    await db.clear('images');
}
