import { getCardById, getCardByName } from '@ygo/card-api';
import { CardDetails } from '@server/card-details';
import { getCardDetails } from '@ygo/details-provider';

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

            if (!cards.has(cardInfo.name)) {
                cards.set(cardInfo.name, await getCardDetails(cardInfo));
            }

            const details = cards.get(cardInfo.name);
            if (details) {
                details.qty = (details.qty || 0) + 1;
            }
        } catch (error) {
            console.error(`Error fetching card with ID ${id}:`, error);
        }
    }

    return cards;
}

/**
 * Loads a SimulationInput from a YAML file
 * @param file - The File object containing YAML content
 */
export async function loadFromYdkFile(file: File): Promise<Map<string, CardDetails>> {
    const yamlContent = await readFileContent(file);
    return loadFromYdkString(yamlContent);
}

/**
 * Reads the content of a file
 * @param file - The File object to read
 */
function readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => resolve(event.target?.result as string);
        reader.onerror = (error: ProgressEvent<FileReader>) => reject(error);
        reader.readAsText(file);
    });
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
