// useSimulationRepository.ts

import { useState, useEffect, useCallback } from 'react';
import { SimulationRecord } from "../../core/data/simulation-record";

class LimitedSizeMap<K, V> extends Map<K, V> {
    private hashes: K[] = [];
    private readonly maxSize: number;

    constructor(maxSize: number = 10, entries?: readonly (readonly [K, V])[] | null) {
        super(entries);
        this.maxSize = maxSize;
        if (entries) {
            for (const [key] of entries) {
                this.hashes.push(key);
            }
        }
    }

    set(key: K, value: V): this {
        if (super.has(key)) {
            this.hashes = this.hashes.filter(k => k !== key);
        } else if (this.hashes.length >= this.maxSize) {
            const oldestKey = this.hashes.shift();
            if (oldestKey !== undefined) {
                super.delete(oldestKey);
            }
        }
        this.hashes.push(key);
        super.set(key, value);
        return this;
    }

    delete(key: K): boolean {
        const deleted = super.delete(key);
        if (deleted) {
            this.hashes = this.hashes.filter(k => k !== key);
        }
        return deleted;
    }

    clear(): void {
        super.clear();
        this.hashes = [];
    }
}

let globalStoredValue: LimitedSizeMap<string, SimulationRecord> | null = null;

export function useSimulationRepository(size: number = 10): [
    SimulationRecord[],
    (value: SimulationRecord) => void,
    (id: string) => SimulationRecord | undefined,
    () => void
] {
    const readValue = useCallback((): LimitedSizeMap<string, SimulationRecord> => {
        if (globalStoredValue) {
            return globalStoredValue;
        }
        if (typeof window === 'undefined') {
            return new LimitedSizeMap(size);
        }
        try {
            const item = window.localStorage.getItem('simulationRecords');
            const parsedItem: [string, SimulationRecord][] = item ? JSON.parse(item) : [];
            globalStoredValue = new LimitedSizeMap(size, parsedItem);
            return globalStoredValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "simulationRecords":`, error);
            return new LimitedSizeMap(size);
        }
    }, [size]);

    const [storedValue, setStoredValue] = useState<LimitedSizeMap<string, SimulationRecord>>(readValue);

    const saveValue = useCallback((newValue: LimitedSizeMap<string, SimulationRecord>) => {
        setStoredValue(newValue);
        globalStoredValue = newValue;
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('simulationRecords', JSON.stringify(Array.from(newValue.entries())));
        }
    }, []);

    const addRecord = useCallback((value: SimulationRecord) => {
        try {
            const newStoredValue = new LimitedSizeMap(size, Array.from(storedValue.entries()));
            newStoredValue.set(value.hash, value);
            saveValue(newStoredValue);
        } catch (error) {
            console.warn(`Error setting localStorage key "simulationRecords":`, error);
        }
    }, [storedValue, size, saveValue]);

    const retrieveRecord = useCallback((id: string): SimulationRecord | undefined => {
        const records: SimulationRecord[] = [...storedValue.values()];
        return records.find(record => record.id === id);
    }, [storedValue]);

    const clearAllRecords = useCallback(() => {
        const newStoredValue = new LimitedSizeMap<string, SimulationRecord>(size);
        saveValue(newStoredValue);
    }, [size, saveValue]);

    useEffect(() => {
        setStoredValue(readValue());
    }, [readValue]);

    return [Array.from(storedValue.values()), addRecord, retrieveRecord, clearAllRecords];
}

export default useSimulationRepository;