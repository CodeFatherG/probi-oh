import { CardDetails } from "../../../core/data/card-details";
import { SimulationInput } from "../../../core/data/simulation-input";
import { getSimulationData, SimulationData } from "./get";

interface CacheEntry {
    data: SimulationData;
    timestamp: number;
}

const STALE_DATE = new Date().setDate(new Date().getDate() - 30);

class SimulationCache {
    private static instance: SimulationCache;
    private cache: Map<string, CacheEntry> = new Map();
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

    private cleanupCache(): void {
        // Cleanup stale entries
        {
            const keys = Array.from(this.cache.keys());
            for (const key of keys) {
                const entry = this.cache.get(key);
                if (entry && entry.timestamp < STALE_DATE) {
                    this.cache.delete(key);
                }
            }
        }

        // Cleanup size
        if (this.cache.size > this.maxCacheSize) {
            const keys = Array.from(this.cache.keys());
            for (let i = 0; i < keys.length - this.maxCacheSize; i++) {
                this.cache.delete(keys[i]);
            }
        }

        this.save();
    }

    public getCachedSimulations(): SimulationData[] {
        return Array.from(this.cache).map(([, entry]) => entry.data);
    }

    public async getSimulationById(id: string): Promise<SimulationData | undefined> {
        if (!this.cache.has(id)) {
            const storedData = await getSimulationData(id);
            this.cache.set(id, {
                data: storedData,
                timestamp: Date.now()
            });
            this.cleanupCache();
        }

        return this.cache.get(id)?.data;
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