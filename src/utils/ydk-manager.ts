import { getCardById, getCardByName } from './card-api';
import { CardDetails } from './card-details';
import { getCardDetails } from './details-provider';

export async function loadFromYdkString(ydkString: string): Promise<Map<string, CardDetails>> {
    // Split content into lines, handling both \n and \r\n
    const lines = ydkString.split(/\r?\n/);
    
    // Find the start and end indices for the main deck
    const mainDeckStart = lines.findIndex(line => line.trim() === '#main') + 1;
    const extraDeckStart = lines.findIndex(line => line.trim() === '#extra');
    const mainDeckEnd = extraDeckStart !== -1 ? extraDeckStart : lines.length;
    
    if (mainDeckStart === 0) {
        throw new Error("Invalid YDK file: #main section not found");
    }

    // Extract and parse main deck card IDs
    const mainDeckIds = lines.slice(mainDeckStart, mainDeckEnd)
        .filter(line => line.trim() !== '' && !isNaN(parseInt(line.trim())))
        .map(line => parseInt(line.trim()));

    const cards: Map<string, CardDetails> = new Map<string, CardDetails>();

    // Fetch card details and build the deck object
    for (const id of mainDeckIds) {
        try {
            const cardInfo = await getCardById(id);

            if (!cardInfo) {
                console.error(`No card found for ID ${id}`);
                continue;
            }

            cards.set(cardInfo.name, await getCardDetails(cardInfo));
        } catch (error) {
            console.error(`Error fetching card with ID ${id}:`, error);
        }
    }

    return cards;
}

export async function serialiseCardsToYdk(cards: Map<string, CardDetails>): Promise<string> {
    let ydkString = "#Created by Probi-Oh\n#tags=\n#main\n";

    for (const [cardName] of cards) {
        const info = await getCardByName(cardName);

        if (!info) {
            console.error(`No card found for ${cardName}`);
            continue;
        }

        ydkString += `${info.id}\n`;
    }

    ydkString += "#extra\n!side\n";

    return ydkString;
}
