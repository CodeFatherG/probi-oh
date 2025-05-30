import { Condition } from "@probi-oh/core/src/condition";
import { Simulation } from "@probi-oh/core/src/simulation";
import { MockGameState } from "./game-state.mock";
import { BaseCondition } from '@probi-oh/core/src/condition';
import { SimulationBranch } from "@probi-oh/core/src/simulation";

export class MockSimulation extends Simulation {
    private mockBranches: Map<BaseCondition, SimulationBranch[]> = new Map();

    constructor(
        gameState: MockGameState,
        conditions: BaseCondition[]
    ) { 
        super(gameState, conditions);
    }

    public addMockBranch(condition: BaseCondition, branch: SimulationBranch): void {
        if (!this.mockBranches.has(condition)) {
            this.mockBranches.set(condition, []);
        }

        const branches = this.mockBranches.get(condition) || [];
        branches.push(branch);
    }

    override iterate(): void {
        // Implement mock iteration logic if needed
    }

    // Override the getter to return mock branches
    override get branches(): Map<BaseCondition, SimulationBranch[]> {
        return this.mockBranches;
    }

    // You may need to override other methods that use _branches internally
    // For example:
    override get result(): boolean {
        return Array.from(this.mockBranches.values())
            .some(branches => branches.some(branch => branch.result));
    }
}