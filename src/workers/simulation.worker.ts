import { SerialisedSimulation, Simulation } from '../utils/simulation';
import { GameState } from '../utils/game-state';
import { buildDeck } from '../utils/deck';
import { CardDetails } from '../utils/card-details';
import { parseCondition } from '../utils/parser';

export interface SimulationWorkerMessage {
    cards: Map<string, CardDetails>;
    conditions: string;
    handSize: number;
    batchSize: number;
}

self.onmessage = (event: MessageEvent) => {
    const { cards, conditions, handSize, batchSize } = event.data as SimulationWorkerMessage;
    const serialisedSimulations: SerialisedSimulation[] = [];

    console.log(`Running simulation with ${batchSize} batches of ${handSize} hands`);

    for (let i = 0; i < batchSize; i++) {
        const deck = buildDeck(new Map(cards));
        const parsedConditions = (JSON.parse(conditions) as string[]).map(parseCondition);

        const gamestate = new GameState(deck);
        gamestate.drawHand(handSize);

        const simulation = new Simulation(gamestate.deepCopy(), parsedConditions);
        simulation.iterate();

        serialisedSimulations.push(simulation.serialise());
    }

    self.postMessage(JSON.stringify(serialisedSimulations));
};