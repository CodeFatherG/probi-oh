import yaml from 'js-yaml';
import { BaseCondition } from '../sim/condition';
import { CardDetails } from './card-details';
import { SimulationInput } from './simulation-input';

/**
 * Loads a SimulationInput from a YAML string
 * @param yamlString - The YAML string to parse
 */
export function loadFromYamlString(yamlString: string): SimulationInput {
    try {
        const input = yaml.load(yamlString) as { deck: Map<string, CardDetails>, conditions: string[] };

        // Validate deck structure
        for (const [cardName, cardDetails] of Object.entries(input.deck)) {
            if (typeof cardDetails !== 'object' || Array.isArray(cardDetails)) {
                throw new Error(`Invalid card details for ${cardName}`);
            }
            if (typeof cardDetails.qty !== 'number') {
                throw new Error(`Invalid card structure for ${cardName}`);
            }
        }

        input.deck = getCardList(input.deck);

        return input;
    } catch (error) {
        throw new Error(`Failed to parse YAML: ${(error as Error).message}`);
    }
}

/**
 * Builds a deck from a record of card details
 * @param deckList - Record of card names and their details
 * @returns A new Deck instance
 */
function getCardList(deckList: Map<string, CardDetails> | Record<string, CardDetails>): Map<string, CardDetails> {
    const cards: Map<string, CardDetails> = new Map<string, CardDetails>();
    for (const [card, details] of Object.entries(deckList)) {
        const qty = details.qty ?? 1;

        details.qty = qty;

        // Add the card
        cards.set(card, details);
    }

    return cards;
}

/**
 * Loads a SimulationInput from a YAML file
 * @param file - The File object containing YAML content
 */
export async function loadFromYamlFile(file: File): Promise<SimulationInput> {
    const yamlContent = await readFileContent(file);
    return loadFromYamlString(yamlContent);
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

export function serialiseCardsToYaml(cards: Map<string, CardDetails>): string {
    const deckObject: Record<string, CardDetails> = {};
    Array.from(cards.entries()).forEach(([card, details]) => {
        if (card !== 'Empty Card') {
            if (deckObject[card]) {
                const cardDetails = deckObject[card];
                if (cardDetails) {
                    cardDetails.qty = (cardDetails.qty || 1) + 1;
                }
            } else {
                deckObject[card] = details;
            }
        }
    });
    return yaml.dump({ deck: deckObject });
}

/**
 * serialises conditions to YAML format
 * @param conditions - The conditions to serialise
 */
export function serialiseConditionsToYaml(conditions: BaseCondition[]): string {
    const conditionStrings = conditions.map(condition => condition.toString());
    return yaml.dump({ conditions: conditionStrings });
}

/**
 * serialises a SimulationInput to YAML format
 * @param input - The SimulationInput to serialise
 */
export function serialiseSimulationInputToYaml(input: SimulationInput): string {
    const deck: Record<string, CardDetails> = {};

    for (const [card, details] of input.deck) {
        deck[card] = details;
    }

    const deckYaml = serialiseCardsToYaml(input.deck);
    const conditionsYaml = yaml.dump({ conditions: input.conditions });
    return deckYaml + '\n' + conditionsYaml;
}