import { SimulationRecord } from './simulation-record';

const STORAGE_KEY = 'simulationRecords';

export class SimulationRepository {
    private records: Map<string, SimulationRecord>;
    private maxRecords: number;

    constructor(maxRecords: number) {
        this.maxRecords = maxRecords;
        this.records = new Map<string, SimulationRecord>();
        this.loadFromStorage();
    }

    private loadFromStorage(): void {
        const storedRecords = localStorage.getItem(STORAGE_KEY);
        if (storedRecords) {
            const parsedRecords = JSON.parse(storedRecords) as SimulationRecord[];
            this.records = new Map(parsedRecords.map(record => [record.hash, record]));
        }
    }

    private saveToStorage(): void {
        const recordsArray = Array.from(this.records.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recordsArray));
    }

    addRecord(record: SimulationRecord): void {
        if (this.records.size >= this.maxRecords) {
            const oldestKey = this.records.keys().next().value;
            if (oldestKey) {
                this.records.delete(oldestKey);
            }
        }
        this.records.set(record.hash, record);
        this.saveToStorage();
    }

    getRecord(id: string): SimulationRecord | undefined {
        for (const record of this.records.values()) {
            if (record.id === id) {
                return record;
            }
        }

        return undefined;
    }

    getAllRecords(): SimulationRecord[] {
        return Array.from(this.records.values());
    }

    clear(): void {
        this.records.clear();
        localStorage.removeItem(STORAGE_KEY);
    }
}

export const simulationRepository = new SimulationRepository(10); // Configure max records here