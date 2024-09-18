import { SimulationInput } from './simulation-input';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { serialiseSimulationInputToYaml } from './yaml-manager';

export interface SimulationRecord {
    id: string;
    hash: string;
    yaml: string;
    result: number;
}

function hashString(input: string): string {
    const hash = createHash('sha256');
    hash.update(input);
    return hash.digest('hex');
}

export function createSimulationRecord(input: SimulationInput, result: number): SimulationRecord {
    const id = uuidv4();
    const yaml = serialiseSimulationInputToYaml(input);
    const hash = hashString(yaml);
    
    return { id, hash, yaml, result };
}
