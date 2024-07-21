import * as yaml from 'js-yaml';
import { getCardById } from './card-api';

/**
 * Converts YDK content to YAML format
 * @param ydkContent - The content of the YDK file
 * @returns A promise that resolves to the YAML string
 */
export async function convertYdkToYaml(ydkContent: string): Promise<string> {
    // Split content into lines, handling both \n and \r\n
    const lines = ydkContent.split(/\r?\n/);
    
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

    const deck: Record<string, { qty: number, tags: string[] }> = {};

    // Fetch card details and build the deck object
    for (const id of mainDeckIds) {
        try {
            const card = await getCardById(id);
            if (card) {
                if (deck[card.name]) {
                    deck[card.name].qty++;
                } else {
                    deck[card.name] = {
                        qty: 1,
                        tags: [card.type, card.race].filter(tag => tag) // Remove empty tags
                    };
                }
            }
        } catch (error) {
            console.error(`Error fetching card with ID ${id}:`, error);
        }
    }

    // Create the YAML object
    const yamlObject = { 
        deck: deck,
        conditions: []
    };

    // Convert to YAML string and return
    return yaml.dump(yamlObject);
}