import { getImageIDB } from './image-idb';

export enum CardAttribute {
    DARK = 'dark',
    DIVINE = 'divine',
    EARTH = 'earth',
    FIRE = 'fire',
    LIGHT = 'light',
    WATER = 'water',
    WIND = 'wind'
}

export async function getAttributeImage(attribute: CardAttribute,
                                        fetcher = fetch,
                                        dbFactory = getImageIDB): Promise<Blob | null> {
    const db = await dbFactory();
   
    const gitLink = `https://raw.githubusercontent.com/CodeFatherG/yugioh-db/master/assets/${attribute}.svg`;
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