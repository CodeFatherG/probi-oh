import { CardDetails, Condition } from "@probi-oh/types";
import { SimulationInput } from "@probi-oh/types";
import { getSimulationData, SimulationData } from "./GET-simulations";
import { parseCondition } from "core/src/parser";

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

        const simulationInput: SimulationInput = {
            deck: {},
            conditions: []
        };

        // Check if the data is a string or an object
        let json;
        if (typeof data.data !== 'string') {
            // If it's an object, we assume it's already in the correct format
            json = data.data;
        }else {
            json = JSON.parse(data.data as string);
        }
        
        // detect if the conditions are an array of strings or objects
        if (Array.isArray(json.conditions)) {
            for (const condition of json.conditions) {
                if (typeof condition === 'string') {
                    try {
                        simulationInput.conditions.push(parseCondition(condition));
                    } catch (e) {
                        console.error('Error parsing condition:', condition, e);
                    }
                } else {
                    simulationInput.conditions.push(condition as Condition);
                }
            }
        }

        simulationInput.deck = json.deck as Record<string, CardDetails>;

        return simulationInput;
    }

    private load(): void {
        const cache = window.localStorage.getItem('simulationCache');
        
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