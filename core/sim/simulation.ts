import { FreeCard } from "../data/card";
import { BaseCondition, evaluateCondition } from "./condition";
import { freeCardIsUsable, processFreeCard } from "./free-card-processor";
import { GameState } from "../data/game-state";

export class SimulationBranch {
    private readonly _gameState: GameState;
    private _result: boolean;

    constructor(gameState: GameState, readonly _condition: BaseCondition) {
        this._gameState = gameState.deepCopy();
        this._result = false;
    }

    run(): void {
        this._result = evaluateCondition(this._condition, this._gameState.hand, this._gameState.deck.deckList);
    }

    get result(): boolean {
        return this._result; 
    }

    get condition(): Readonly<BaseCondition> {
        return this._condition;
    }

    get gameState(): GameState {
        return this._gameState;
    }

}

/** Represents a single simulation run */
export class Simulation {
    private readonly _gameState: GameState;
    private _branches: Map<BaseCondition, SimulationBranch[]> = new Map();

    /**
     * Creates a new Simulation
     * @param gameState - The initial game state
     * @param _condition - The condition to evaluate
     */
    public constructor(gameState: GameState, readonly _conditions: BaseCondition[]) {
        this._gameState = gameState.deepCopy();
    }

    private runBranch(branch: SimulationBranch): void {
        branch.run();
        
        if (!this._branches.has(branch.condition)) {
            this._branches.set(branch.condition, []);
        }

        const branches = this._branches.get(branch.condition) || [];
        branches.push(branch);
    }

    /** Runs the simulation, evaluating the condition against the game state */
    iterate(): void {
        this._conditions.forEach(condition => {
           // Run a branch with the original game state
            const branch = new SimulationBranch(this._gameState, condition);
            this.runBranch(branch);
            if (this.result) return;    // return if branch succeeds, we won.

            // The gamestate doesn't work, so we need to try all possible branches
            this.generateFreeCardPermutations(this._gameState, condition); 
        });
    }

    private generateFreeCardPermutations(gameState: GameState, condition: BaseCondition, usedCards: FreeCard[] = []): void {
        const freeCards = gameState.freeCardsInHand.filter(card => 
            freeCardIsUsable(gameState, card) && !usedCards.includes(card)
        );

        if (freeCards.length === 0) {
            return;
        }

        for (const freeCard of freeCards) {
            if (!freeCardIsUsable(gameState, freeCard)) {
                continue;
            }

            // Create a new branch with the updated game state
            const newGameState = gameState.deepCopy();
            const branch = new SimulationBranch(newGameState, condition);
            processFreeCard(branch, freeCard);
            this.runBranch(branch);

            if (this.result) return;  // If we've found a winning combination, stop searching

            // Recursively generate permutations with the remaining free cards
            this.generateFreeCardPermutations(branch.gameState, condition, [...usedCards, freeCard]);
        }
    }

    /** Gets the result of the simulation */
    public get result(): boolean {
        return this.successfulBranches.some(([, branch]) => branch !== undefined);
    }

    /** Gets the conditions being evaluated */
    public get conditions(): BaseCondition[] {
        return this._conditions;
    }

    /** Gets the game state used in the simulation */
    public get gameState(): GameState {
        return this._gameState;
    }

    /** Gets the branches of the simulation */
    public get branches(): Map<BaseCondition, SimulationBranch[]> {
        return this._branches;
    }

    /** Get the branch that succeeded */
    public get successfulBranches(): [BaseCondition, SimulationBranch | undefined][] {
        return Array.from(this._branches).map(([condition, branches]) => [condition, branches.find(branch => branch.result)]) as [BaseCondition, SimulationBranch | undefined][];
    }

    /** Get the branches that failed */
    public get failedBranches(): [BaseCondition, SimulationBranch[] | undefined][] {
        return Array.from(this._branches).map(([condition, branches]) => [condition, branches.find(branch => !branch.result)]) as [BaseCondition, SimulationBranch[] | undefined][];
    }
}

export function runSimulation(gameState: GameState, conditions: BaseCondition[]): Simulation {
    const simulation = new Simulation(gameState, conditions);
    simulation.iterate();
    return simulation;
}
