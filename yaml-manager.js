var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import yaml from 'js-yaml';
import { buildDeck } from './deck.js';
import { AndCondition, Condition, OrCondition } from './condition.js';
import { parseCondition } from './parser.js';
import { convertYdkToYaml } from './ydk-to-yaml.js';
/** Manages YAML operations for the application */
export class YamlManager {
    constructor() {
        this._yaml = null;
        this._input = null;
    }
    /** Gets the singleton instance of YamlManager */
    static getInstance() {
        if (!YamlManager.instance) {
            YamlManager.instance = new YamlManager();
        }
        return YamlManager.instance;
    }
    /**
     * Loads a SimulationInput from a YAML string
     * @param yamlString - The YAML string to parse
     */
    loadFromYamlString(yamlString) {
        try {
            const input = yaml.load(yamlString);
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
                if (typeof cardDetails.qty !== 'number' || !Array.isArray(cardDetails.tags)) {
                    throw new Error(`Invalid card structure for ${cardName}`);
                }
            }
            const deck = buildDeck(input.deck);
            const conditions = input.conditions.map(parseCondition);
            return { deck, conditions };
        }
        catch (error) {
            throw new Error(`Failed to parse YAML: ${error.message}`);
        }
    }
    /**
     * Loads a SimulationInput from a YAML file
     * @param file - The File object containing YAML content
     */
    loadFromYamlFile(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const yamlContent = yield this.readFileContent(file);
            return this.loadFromYamlString(yamlContent);
        });
    }
    /**
     * Converts a YDK file to YAML format
     * @param file - The File object containing YDK content
     */
    convertYdkToYaml(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const ydkContent = yield this.readFileContent(file);
            return convertYdkToYaml(ydkContent);
        });
    }
    /**
     * Reads the content of a file
     * @param file - The File object to read
     */
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => { var _a; return resolve((_a = event.target) === null || _a === void 0 ? void 0 : _a.result); };
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }
    /**
     * Serializes a Deck to YAML format
     * @param deck - The Deck to serialize
     */
    serializeDeckToYaml(deck) {
        const deckObject = {};
        deck.deckList.forEach(card => {
            if (card.name !== 'Empty Card') {
                if (deckObject[card.name]) {
                    deckObject[card.name].qty = (deckObject[card.name].qty || 1) + 1;
                }
                else {
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
    serializeConditionsToYaml(conditions) {
        const conditionStrings = conditions.map(condition => this.conditionToString(condition));
        return yaml.dump({ conditions: conditionStrings });
    }
    /**
     * Converts a condition to a string representation
     * @param condition - The condition to convert
     */
    conditionToString(condition) {
        if (condition instanceof Condition) {
            let quantityText = "";
            if (condition.quantity > 1 || condition.operator !== '=') {
                quantityText = condition.operator === '>=' ? `${condition.quantity}+ ` : `${condition.quantity} `;
            }
            return `${quantityText}${condition.cardName}`;
        }
        else if (condition instanceof AndCondition) {
            return `(${condition.conditions.map(c => this.conditionToString(c)).join(' AND ')})`;
        }
        else if (condition instanceof OrCondition) {
            return `(${condition.conditions.map(c => this.conditionToString(c)).join(' OR ')})`;
        }
        throw new Error('Unknown condition type');
    }
    /**
     * Serializes a SimulationInput to YAML format
     * @param input - The SimulationInput to serialize
     */
    serializeSimulationInputToYaml(input) {
        const deckYaml = this.serializeDeckToYaml(input.deck);
        const conditionsYaml = this.serializeConditionsToYaml(input.conditions);
        return deckYaml + '\n' + conditionsYaml;
    }
    /** Gets the last loaded/saved YAML string */
    get yaml() {
        return this._yaml;
    }
    /** Gets the last loaded/saved SimulationInput */
    get input() {
        return this._input;
    }
}
