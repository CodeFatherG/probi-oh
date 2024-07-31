var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as yaml from 'js-yaml';
import { getCardById } from './card-api.js';
/**
 * Converts YDK content to YAML format
 * @param ydkContent - The content of the YDK file
 * @returns A promise that resolves to the YAML string
 */
export function convertYdkToYaml(ydkContent) {
    return __awaiter(this, void 0, void 0, function* () {
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
        const deck = {};
        // Fetch card details and build the deck object
        for (const id of mainDeckIds) {
            try {
                const card = yield getCardById(id);
                if (card) {
                    if (deck[card.name]) {
                        deck[card.name].qty++;
                    }
                    else {
                        deck[card.name] = {
                            qty: 1,
                            tags: [card.type, card.race].filter(tag => tag) // Remove empty tags
                        };
                    }
                }
            }
            catch (error) {
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
    });
}
