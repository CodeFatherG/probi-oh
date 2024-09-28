import { CardDetails } from "../../core/data/card-details";
import { SimulationInput } from "../../core/data/simulation-input";
import { getSimulationData, SimulationData } from "./get";

class SimulationCache {
    private static instance: SimulationCache;
    private cache: Map<string, SimulationData> = new Map();
    private readonly maxCacheSize: number = 100;

    private constructor() {
        this.load();
    }

    public static getInstance(): SimulationCache {
        if (!SimulationCache.instance) {
            SimulationCache.instance = new SimulationCache();
        }
        return SimulationCache.instance;
    }

    public getCachedSimulations(): SimulationData[] {
        return Array.from(this.cache).map(([, data]) => data);
    }

    public async getSimulationById(id: string): Promise<SimulationData | undefined> {
        if (!this.cache.has(id)) {
            const storedData = await getSimulationData(id);
            this.cache.set(id, storedData);
            this.save();
        }

        return this.cache.get(id);
    }

    public async getSimulationInputById(id: string): Promise<SimulationInput | undefined> {
        const data = await this.getSimulationById(id);
        if (!data) {
            return undefined;
        }

        const json = JSON.parse(data.data);
        const deck = new Map<string, CardDetails>();
        for (const [cardName, details] of Object.entries(json.deck)) {
            deck.set(cardName, details as CardDetails);
        }

        return {
            deck,
            conditions: json.conditions
        };
    }

    public clear(): void {
        this.cache = new Map();
        this.save();
    }

    private load(): void {
        const cache = window.localStorage.getItem('simulationCache');
        console.log('Loading cache:', cache);
        if (cache) {
            this.cache = new Map(JSON.parse(cache));
        } 
    }

    private save(): void {
        const valueToStore = Array.from(this.cache);
        localStorage.setItem('simulationCache', JSON.stringify(valueToStore));
    }
}

export const simulationCache = SimulationCache.getInstance();