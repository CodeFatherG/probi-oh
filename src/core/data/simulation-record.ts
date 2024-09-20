import { SimulationInput } from './simulation-input';
import { v4 as uuidv4 } from 'uuid';
import { serialiseSimulationInputToYaml } from './yaml-manager';

export interface SimulationRecord {
    id: string;
    timestamp: number;
    hash: string;
    yaml: string;
    result: number;
}

function hashString(input: string): string {
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) + hash) + input.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
}

export function createSimulationRecord(input: SimulationInput, result: number): SimulationRecord {
    const id = uuidv4();
    const yaml = serialiseSimulationInputToYaml(input);
    const hash = hashString(yaml);
    const timestamp = Date.now();
    
    return { id, timestamp, hash, yaml, result };
}
