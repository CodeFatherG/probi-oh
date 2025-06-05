import { getImageIDB } from './image-idb';

export enum SpellType {
    'normal',
    'field',
    'equip',
    'continuous',
    'quick-play',
    'ritual'
}

export async function getSpellImage(spellType: SpellType, 
                                    fetcher = fetch, 
                                    dbFactory = getImageIDB): Promise<Blob | null> {
    const db = await dbFactory();
    
    const gitLink = `https://raw.githubusercontent.com/CodeFatherG/yugioh-db/master/assets/${spellType}.svg`;

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
