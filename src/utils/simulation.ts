import { FreeCard } from "./card";
import { BaseCondition } from "./condition";
import { freeCardIsUsable, processFreeCard } from "./free-card-processor";
import { GameState } from "./game-state";

export class SimulationBranch {
    private readonly _gameState: GameState;
    private _result: boolean;

    constructor(gameState: GameState, readonly _condition: BaseCondition) {
        this._gameState = gameState.deepCopy();
        this._result = false;
    }

    run(): void {
        this._result = this._condition.evaluate(this._gameState);
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
    private _branches: SimulationBranch[] = [];

    /**
     * Creates a new Simulation
     * @param gameState - The initial game state
     * @param _condition - The condition to evaluate
     */
    public constructor(gameState: GameState, readonly _condition: BaseCondition) {
        this._gameState = gameState.deepCopy();
    }

    private runBranch(branch: SimulationBranch): void {
        branch.run();
        this._branches.push(branch);
    }

    /** Runs the simulation, evaluating the condition against the game state */
    iterate(): void {
        // Run a branch with the original game state
        const branch = new SimulationBranch(this._gameState, this._condition);
        this.runBranch(branch);
        if (this.result) return;    // return if branch succeeds, we won.

        // The gamestate doesn't work, so we need to try all possible branches
        this.generateFreeCardPermutations(this._gameState);
    }

    private generateFreeCardPermutations(gameState: GameState, usedCards: FreeCard[] = []): void {
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
            const branch = new SimulationBranch(newGameState, this._condition);
            processFreeCard(branch, freeCard);
            this.runBranch(branch);

            if (this.result) return;  // If we've found a winning combination, stop searching

            // Recursively generate permutations with the remaining free cards
            this.generateFreeCardPermutations(branch.gameState, [...usedCards, freeCard]);
        }
    }

    /** Gets the result of the simulation */
    public get result(): boolean {
        return this.branches.some(b => b.result);
    }

    /** Gets the condition being evaluated */
    public get condition(): BaseCondition {
        return this._condition;
    }

    /** Gets the game state used in the simulation */
    public get gameState(): GameState {
        return this._gameState;
    }

    /** Gets the branches of the simulation */
    public get branches(): SimulationBranch[] {
        return this._branches;
    }

    /** Get the branch that succeeded */
    public get successfulBranch(): SimulationBranch | undefined {
        return this._branches.find(b => b.result);
    }

    /** Get the branches that failed */
    public get failedBranches(): SimulationBranch[] {
        return this._branches.filter(b => !b.result);
    }
}

export function runSimulation(gameState: GameState, condition: BaseCondition): Simulation {
    const simulation = new Simulation(gameState, condition);
    simulation.iterate();
    return simulation;
}
