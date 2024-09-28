
export interface SimulationData {
    sim_id: string;
    user_id: string;
    env_id: string;
    data_hash: string;
    data: string;
    result: number;
    summary: string;
    created_at: string;
}

export async function getSimulationData(simulationId: string): Promise<SimulationData> {
    if (!simulationId) {
        throw new Error('Invalid simulation id');
    }
    
    const apiUrl = `${process.env.API_URL}/api/simulations?id=${simulationId}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error(`Failed to get simulation data: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
}