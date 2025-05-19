type SimulationAddedCallback = (simulationId: string) => void;

class SimulationEventManager {
    private static instance: SimulationEventManager;
    private callbacks: SimulationAddedCallback[] = [];

    private constructor() {}

    public static getInstance(): SimulationEventManager {
        if (!SimulationEventManager.instance) {
            SimulationEventManager.instance = new SimulationEventManager();
        }
        return SimulationEventManager.instance;
    }

    public registerCallback(callback: SimulationAddedCallback): void {
        this.callbacks.push(callback);
    }

    public unregisterCallback(callback: SimulationAddedCallback): void {
        this.callbacks = this.callbacks.filter(cb => cb !== callback);
    }

    public notifySimulationAdded(simulationId: string): void {
        this.callbacks.forEach(callback => callback(simulationId));
    }
}

export const simulationEventManager = SimulationEventManager.getInstance();