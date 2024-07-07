// ydk-to-yaml.ts

import * as yaml from 'js-yaml';
import { getCardById } from './card-api.js';

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

    const mainDeckIds = lines.slice(mainDeckStart, mainDeckEnd)
        .filter(line => line.trim() !== '' && !isNaN(parseInt(line.trim())))
        .map(line => parseInt(line.trim()));

    const deck: Record<string, { qty: number, tags: string[] }> = {};

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

    const yamlObject = { 
        deck: deck,
        conditions: []
    };

    return yaml.dump(yamlObject);
}
