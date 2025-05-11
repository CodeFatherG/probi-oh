import { AndCondition, Condition, OrCondition } from "@probi-oh/core/src/condition";
import { GameState } from "@probi-oh/core/src/game-state";
import { SimulationBranch } from "@probi-oh/core/src/simulation";

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