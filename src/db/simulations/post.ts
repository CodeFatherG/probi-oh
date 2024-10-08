import { getUserId } from "../../analytics/user-id";
import { SimulationInput } from "../../../core/data/simulation-input";
import { Report } from "../../../core/sim/report";
import { v4 as uuid } from 'uuid';
import { simulationEventManager } from './simulation-event-manager';

interface PostData {
    id: string;
    user_id: string;
    env_id: string;
    data: string;
    result: number;
    summary: string;
}

async function postSimulationData(input: SimulationInput, report: Report): Promise<string> {
    const apiUrl = `${process.env.API_URL}/api/simulations`;
  
    try {
        const data: PostData = {
            id: uuid(),
            user_id: getUserId(),
            env_id: process.env.DEVELOPMENT ? 'development' : process.env.PREVIEW ? 'preview' : process.env.PRODUCTION ? 'production' : 'unknown',
            data: JSON.stringify({
                deck: Object.fromEntries(input.deck), 
                conditions: input.conditions
            }),
            result: report.successfulSimulations / report.iterations,
            summary: JSON.stringify(report),
        }
        // Make the API call
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    
        if (!response.ok) {
            console.error('Failed to post simulation data:', response);
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to post simulation data');
        }
    
        const result = await response.json();
        return result.id;
  
    } catch (error) {
        console.error('Error posting simulation data:', error);
        throw error;
    }
}

export async function recordSimulation(input: SimulationInput, report: Report): Promise<void> {
    try {
        const id = await postSimulationData(input, report);
        simulationEventManager.notifySimulationAdded(id);
    } catch (error) {
        console.error('Error recording simulation:', error);
    }
}
