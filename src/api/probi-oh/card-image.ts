import { getCard } from '@api/ygopro/card-api';
import { getImageIDB } from './image-idb';



export async function getCardImage(idOrName: number | string, 
                                   imageType: 'full' | 'small' | 'cropped' = 'full', 
                                   fetcher = fetch, 
                                   dbFactory = getImageIDB): Promise<Blob | null> {
    const db = await dbFactory();
    const card = await getCard(idOrName, fetcher);

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
