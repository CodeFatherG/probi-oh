import { SimulationInput } from "@probi-oh/types";
import { buildDeck, Deck } from "@probi-oh/core/src/deck";
import { BaseCondition } from "@probi-oh/core/src/condition";
import { GameState } from "@probi-oh/core/src/game-state";
import { parseCondition } from "@probi-oh/core/src/parser";
import { Simulation } from "@probi-oh/core/src/simulation";
import { generateReport } from "@probi-oh/core/src/report";

export interface SimulationWorkerMessage {
    input: SimulationInput;
    handSize: number;
    iterations: number;
}

const simulateDraw = (deck: Deck, 
                        conditions: BaseCondition[], 
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
            self.postMessage({ progress: progress });
        }
    }

    self.postMessage({ progress: 100 });

    return simulations
}

self.onmessage = (event: MessageEvent) => {
    const { input, handSize, iterations } = event.data as SimulationWorkerMessage;

    const deck = buildDeck(input.deck);
    const sims = simulateDraw(deck, input.conditions.map(parseCondition), handSize, iterations);
    const report = generateReport(sims);

    self.postMessage({ simulations: report });
};