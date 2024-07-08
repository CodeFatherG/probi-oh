import { BaseCondition } from "./condition.js";
import { GameState } from "./game-state.js";

export class Simulation {
    private _gameState: GameState;
    private _condition: BaseCondition;
    private _result: boolean;

    constructor(gameState: GameState, condition: BaseCondition) {
        this._gameState = gameState.deepCopy();
        this._condition = condition;
        this._result = false;
    }

    run(): void {
        this._result = this._condition.evaluate(this._gameState.hand);
    }

    get result(): boolean {
        return this._result; 
    }

    get condition(): BaseCondition {
        return this._condition;
    }

    get gameState(): GameState {
        return this._gameState;
    }
}