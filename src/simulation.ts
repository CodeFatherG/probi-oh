import { BaseCondition } from "./condition.js";
import { GameState } from "./game-state.js";

/** Represents a single simulation run */
export class Simulation {
    private readonly _gameState: GameState;
    private _result: boolean;

    /**
     * Creates a new Simulation
     * @param gameState - The initial game state
     * @param _condition - The condition to evaluate
     */
    constructor(gameState: GameState, readonly _condition: BaseCondition) {
        this._gameState = gameState.deepCopy();
        this._result = false;
    }

    /** Runs the simulation, evaluating the condition against the game state */
    run(): void {
        this._result = this._condition.evaluate(this._gameState.hand);
    }

    /** Gets the result of the simulation */
    get result(): boolean {
        return this._result; 
    }

    /** Gets the condition being evaluated */
    get condition(): Readonly<BaseCondition> {
        return this._condition;
    }

    /** Gets the game state used in the simulation */
    get gameState(): GameState {
        return this._gameState;
    }
}