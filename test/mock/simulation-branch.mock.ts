import { AndCondition, Condition, OrCondition } from "@server/condition";
import { GameState } from "@server/game-state";
import { SimulationBranch } from "@server/simulation";

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