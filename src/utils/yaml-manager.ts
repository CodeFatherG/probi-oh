import yaml from 'js-yaml';
import { Deck, buildDeck } from './deck';
import { AndCondition, BaseCondition, Condition, OrCondition } from './condition';
import { parseCondition } from './parser';
import { convertYdkToYaml } from './ydk-to-yaml';
import { CardDetails } from './card-details';

/** Represents the input for a simulation */
export interface SimulationInput {
    deck: Map<string, CardDetails>;
    conditions: string[];
}

/** Manages YAML operations for the application */
export class YamlManager {
    private _yaml: string | null = null;
    private _input: SimulationInput | null = null;
    private static instance: YamlManager;

    private constructor() {}

    /** Gets the singleton instance of YamlManager */
    public static getInstance(): YamlManager {
        if (!YamlManager.instance) {
            YamlManager.instance = new YamlManager();
        }
        return YamlManager.instance;
    }

    /**
     * Loads a SimulationInput from a YAML string
     * @param yamlString - The YAML string to parse
     */
    public loadFromYamlString(yamlString: string): SimulationInput {
        try {
            const input = yaml.load(yamlString) as { deck: Record<string, CardDetails>, conditions: string[] };

            if (!input || typeof input !== 'object') {
                throw new Error('Invalid YAML structure: not an object');
            }

            if (!input.deck || typeof input.deck !== 'object' || Array.isArray(input.deck)) {
                throw new Error('Invalid YAML structure: deck must be an object');
            }

            if (!Array.isArray(input.conditions)) {
                throw new Error('Invalid YAML structure: conditions must be an array');
            }

            // Validate deck structure
            for (const [cardName, cardDetails] of Object.entries(input.deck)) {
                if (typeof cardDetails !== 'object' || Array.isArray(cardDetails)) {
                    throw new Error(`Invalid card details for ${cardName}`);
                }
                if (typeof cardDetails.qty !== 'number') {
                    throw new Error(`Invalid card structure for ${cardName}`);
                }
            }

            const deck = buildDeck(input.deck);
            const conditions = input.conditions.map(parseCondition);

            return { deck, conditions };
        } catch (error) {
            throw new Error(`Failed to parse YAML: ${(error as Error).message}`);
        }
    }

    /**
     * Builds a deck from a record of card details
     * @param deckList - Record of card names and their details
     * @returns A new Deck instance
     */
    private getCardList(deckList: Record<string, CardDetails>): Map<string, CardDetails> {
        const cards: Map<string, CardDetails> = new Map<string, CardDetails>();
        for (const [card, details] of Object.entries(deckList)) {
            const qty = details.qty ?? 1;

            details.qty = (details.qty ?? 0) + qty;

            // Add the card
            if (!cards.has(card)) {
                cards.set(card, details);
            } else {
                const cardDetails = cards.get(card);
                if (cardDetails) {
                    cardDetails.qty = (cardDetails.qty ?? 0) + qty;
                    cardDetails.tags = [...new Set([...(cardDetails.tags ?? []), ...(details.tags ?? [])])];
                }
            }
        }

        return cards;
    }

    /**
     * Loads a SimulationInput from a YAML file
     * @param file - The File object containing YAML content
     */
    async loadFromYamlFile(file: File): Promise<SimulationInput> {
        const yamlContent = await this.readFileContent(file);
        return this.loadFromYamlString(yamlContent);
    }

    /**
     * Converts a YDK file to YAML format
     * @param file - The File object containing YDK content
     */
    async convertYdkToYaml(file: File): Promise<string> {
        const ydkContent = await this.readFileContent(file);
        return convertYdkToYaml(ydkContent);
    }

    /**
     * Reads the content of a file
     * @param file - The File object to read
     */
    private readFileContent(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event: ProgressEvent<FileReader>) => resolve(event.target?.result as string);
            reader.onerror = (error: ProgressEvent<FileReader>) => reject(error);
            reader.readAsText(file);
        });
    }

    /**
     * Serializes a Deck to YAML format
     * @param deck - The Deck to serialize
     */
    public serializeDeckToYaml(deck: Deck): string {
        const deckObject: Record<string, CardDetails> = {};
        deck.deckList.forEach(card => {
            if (card.name !== 'Empty Card') {
                if (deckObject[card.name]) {
                    deckObject[card.name].qty = (deckObject[card.name].qty || 1) + 1;
                } else {
                    deckObject[card.name] = {
                        qty: 1,
                        tags: card.tags || [],
                        free: card.details.free
                    };
                }
            }
        });
        return yaml.dump({ deck: deckObject });
    }

    /**
     * Serializes conditions to YAML format
     * @param conditions - The conditions to serialize
     */
    public serializeConditionsToYaml(conditions: BaseCondition[]): string {
        const conditionStrings = conditions.map(condition => this.conditionToString(condition));
        return yaml.dump({ conditions: conditionStrings });
    }

    /**
     * Converts a condition to a string representation
     * @param condition - The condition to convert
     */
    private conditionToString(condition: BaseCondition): string {
        if (condition instanceof Condition) {
            let quantityText = "";
            if (condition.quantity > 1 || condition.operator !== '=') {
                quantityText = condition.operator === '>=' ? `${condition.quantity}+ ` : `${condition.quantity} `;
            }
            return `${quantityText}${condition.cardName}`;
        } else if (condition instanceof AndCondition) {
            return `(${condition.conditions.map(c => this.conditionToString(c)).join(' AND ')})`;
        } else if (condition instanceof OrCondition) {
            return `(${condition.conditions.map(c => this.conditionToString(c)).join(' OR ')})`;
        }
        throw new Error('Unknown condition type');
    }

    /**
     * Serializes a SimulationInput to YAML format
     * @param input - The SimulationInput to serialize
     */
    public serializeSimulationInputToYaml(input: SimulationInput): string {
        const deckYaml = this.serializeDeckToYaml(input.deck);
        const conditionsYaml = this.serializeConditionsToYaml(input.conditions);
        return deckYaml + '\n' + conditionsYaml;
    }

    /** Gets the last loaded/saved YAML string */
    get yaml(): string | null {
        return this._yaml;
    }

    /** Gets the last loaded/saved SimulationInput */
    get input(): SimulationInput | null {
        return this._input;
    }
}