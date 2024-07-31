export class SimulationBranch {
    constructor(gameState, _condition) {
        this._condition = _condition;
        this._gameState = gameState.deepCopy();
        this._result = false;
    }
    run() {
        this._result = this._condition.evaluate(this._gameState.hand);
    }
    get result() {
        return this._result;
    }
    get condition() {
        return this._condition;
    }
    get gameState() {
        return this._gameState;
    }
}
/** Represents a single simulation run */
export class Simulation {
    /**
     * Creates a new Simulation
     * @param gameState - The initial game state
     * @param _condition - The condition to evaluate
     */
    constructor(gameState, _condition) {
        this._condition = _condition;
        this._branches = [];
        this._gameState = gameState.deepCopy();
    }
    runBranch(branch) {
        branch.run();
        this._branches.push(branch);
    }
    /** Runs the simulation, evaluating the condition against the game state */
    iterate() {
        // Run a branch with the original game state
        const branch = new SimulationBranch(this._gameState, this._condition);
        this.runBranch(branch);
        if (this.result)
            return; // return if branch succeeds, we won.
    }
    /** Gets the result of the simulation */
    get result() {
        return this.branches.some(b => b.result);
    }
    /** Gets the condition being evaluated */
    get condition() {
        return this._condition;
    }
    /** Gets the game state used in the simulation */
    get gameState() {
        return this._gameState;
    }
    /** Gets the branches of the simulation */
    get branches() {
        return this._branches;
    }
    /** Get the branch that succeeded */
    get successfulBranch() {
        return this._branches.find(b => b.result);
    }
    /** Get the branches that failed */
    get failedBranches() {
        return this._branches.filter(b => !b.result);
    }
}
export function runSimulation(gameState, condition) {
    const simulation = new Simulation(gameState, condition);
    simulation.iterate();
    return simulation;
}
