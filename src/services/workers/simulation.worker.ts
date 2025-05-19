import { Condition, SimulationInput } from "@probi-oh/types";
import { buildDeck, Deck } from "@probi-oh/core/src/deck";
import { GameState } from "@probi-oh/core/src/game-state";
import { Simulation } from "@probi-oh/core/src/simulation";
import { generateReport } from "@probi-oh/core/src/report";

export interface SimulationWorkerMessage {
    input: SimulationInput;
    handSize: number;
    iterations: number;
}

const simulateDraw = (deck: Deck, 
                        conditions: Condition[], 
                        handSize: number, 
                        trials: number): Simulation[] => {
    const simulations: Simulation[] = [];

    for (let i = 0; i < trials; i++) {
        // Create the game state for this trial
        const gamestate = new GameState(deck.deepCopy());

        // draw the hand for this trial so it is common to all conditions   
        gamestate.drawHand(handSize);

        const simulation = new Simulation(gamestate.deepCopy(), conditions);
        simulations.push(simulation);

        // Run the simulation
        simulation.iterate();

        // post an update every 100 iterations
        if (i > 0 && i % 100 === 0) {
            const progress = ((i + 1) / trials) * 100;
            self.postMessage({ type: "progress", progress: progress });
        }
    }

    self.postMessage({ type: "progress", progress: 100 });

    return simulations
}

self.onmessage = (event: MessageEvent) => {
    const { input, handSize, iterations } = event.data as SimulationWorkerMessage;

    try {
        const deck = buildDeck(input.deck);
        const sims = simulateDraw(deck, input.conditions, handSize, iterations);
        const report = generateReport(sims);
        self.postMessage({ type: "result", simulations: report });
    } catch (error) {
        console.error('Error in simulation worker:', error);
        self.postMessage({ type: "error", error: (error as Error).message });
    }
};