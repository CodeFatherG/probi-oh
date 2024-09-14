import { AndCondition, Condition, OrCondition } from "../../src/core/sim/condition";
import { GameState } from "../../src/core/data/game-state";
import { SimulationBranch } from "../../src/core/sim/simulation";

export class MockSimulationBranch extends SimulationBranch {
    constructor(
        gameState: GameState,
        condition: Condition | AndCondition | OrCondition
    ) { super(gameState, condition); }
    run(): void {
        throw new Error("Method not implemented.");
    }
    get result(): boolean {
        throw new Error("Method not implemented.");
    }
}