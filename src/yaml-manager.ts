import yaml from 'js-yaml';
import { Deck, buildDeck } from './deck.js';
import { BaseCondition } from './condition.js';
import { parseCondition } from './parser.js';
import { convertYdkToYaml } from './ydk-to-yaml.js';
import { CardDetails } from './card.js';

export interface SimulationInput {
    deck: Deck;
    conditions: BaseCondition[];
}

export class YamlManager {
    private _yaml: string | null = null;
    private _input: SimulationInput | null = null;
    private static instance: YamlManager;

    private constructor() {}

    public static getInstance(): YamlManager {
        if (!YamlManager.instance) {
            YamlManager.instance = new YamlManager();
        }
        return YamlManager.instance;
    }

    loadFromYamlString(yamlString: string): SimulationInput {
        try {
            const input = yaml.load(yamlString) as { deck: Record<string, CardDetails>, conditions: string[] };
            const deck = buildDeck(input.deck);
            const conditions = input.conditions.map(parseCondition);
            this._yaml = yamlString;
            this._input = { deck, conditions };
            return this._input;
        } catch (error) {
            console.error('Error parsing YAML string:', error);
            throw new Error(`Failed to parse YAML: ${(error as Error).message}`);
        }
    }

    async loadFromYamlFile(file: File): Promise<SimulationInput> {
        const yamlContent = await this.readFileContent(file);
        return this.loadFromYamlString(yamlContent);
    }

    async convertYdkToYaml(file: File): Promise<string> {
        const ydkContent = await this.readFileContent(file);
        return convertYdkToYaml(ydkContent);
    }

    private readFileContent(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event: ProgressEvent<FileReader>) => resolve(event.target?.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }

    get yaml(): string | null {
        return this._yaml;
    }

    get input(): SimulationInput | null {
        return this._input;
    }
}