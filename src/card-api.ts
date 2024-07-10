// card-api.ts

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define the structure of a card
export interface CardInformation {
    id: number;
    name: string;
    type: string;
    desc: string;
    atk?: number;
    def?: number;
    level?: number;
    race: string;
    attribute?: string;
    card_images: {
        id: number;
        image_url: string;
        image_url_small: string;
    }[];
}

// Define the structure of the API response
interface ApiResponse {
    data: CardInformation[];
}

// Define the database schema
interface CardDataSchema extends DBSchema {
    cards: {
        key: string;
        value: CardInformation;
    };
    images: {
        key: string;
        value: Blob;
    };
}

let db: IDBPDatabase<CardDataSchema>;

// Initialize the database
async function initDB(): Promise<IDBPDatabase<CardDataSchema>> {
    if (!db) {
        db = await openDB<CardDataSchema>('YuGiOhDB', 1, {
            upgrade(db) {
                db.createObjectStore('cards');
                db.createObjectStore('images');
            },
        });
    }
    return db;
}

export async function getCardById(id: number, fetcher = fetch, dbFactory = initDB): Promise<CardInformation | null> {
    const db = await dbFactory();
    
    const cachedCard = await db.get('cards', id.toString());
    if (cachedCard) return cachedCard;

    const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${id}`;

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
            console.error(`No card found with ID ${id}`);
            return null;
        }
    } catch (error) {
        console.error('Error fetching card data:', error);
        return null;
    }
}

export async function getCardByName(name: string, fetcher = fetch, dbFactory = initDB): Promise<CardInformation | null> {
    const db = await dbFactory();
    
    const cachedCard = await db.get('cards', name);
    if (cachedCard) return cachedCard;

    const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(name)}`;

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
            console.error(`No card found with name ${name}`);
            return null;
        }
    } catch (error) {
        console.error('Error fetching card data:', error);
        return null;
    }
}

export async function fuzzySearchCard(query: string, fetcher = fetch, dbFactory = initDB): Promise<CardInformation[]> {
    const db = await dbFactory();

    const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(query)}`;

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

export async function clearCardDatabase(dbFactory = initDB): Promise<void> {
    const db = await dbFactory();
    await db.clear('cards');
    await db.clear('images');
}