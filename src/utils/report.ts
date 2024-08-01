import { Simulation, SimulationBranch } from "./simulation";
import { Card } from "./card";
import { AndCondition, BaseCondition, OrCondition } from "./condition";

class CardStatistics {
    private _cardSeenCount: Map<number, number> = new Map<number, number>();
    private _cardDrawnCount: number = 0;

    constructor(public readonly id: string) {}

    cardSeen(count: number): void {
        if (!this._cardSeenCount.has(count)) {
            this._cardSeenCount.set(count, 0);
        }
        this._cardSeenCount.set(count, this._cardSeenCount.get(count)! + 1);
    }

    cardDrawn(): void {
        this._cardDrawnCount++;
    }

    get cardSeenCount(): number {
        return Array.from(this._cardSeenCount.values()).reduce((sum, value) => sum + value, 0);
    }

    get cardDrawnCount(): number {
        return this._cardDrawnCount;
    }
}

class FreeCardStatistics extends CardStatistics {
    private _activationCount: number = 0;
    private _unusedCount: number = 0;

    activated(): void {
        this._activationCount++;
    }

    unused(): void {
        this._unusedCount++;
    }

    get activationCount(): number {
        return this._activationCount;
    }

    get activationRate(): number {
        return this.activationCount / this.cardSeenCount;
    }

    get unusedCount(): number {
        return this._unusedCount;
    }

    get unusedRate(): number {
        return this.unusedCount / this.cardSeenCount;
    }
}

class ConditionStatistics {
    private _subConditionStats: Map<string, ConditionStatistics> = new Map();

    constructor(private readonly _condition: BaseCondition,
                private readonly _totalEvaluations: number
    ) {
        this.processConditionStats();
    }

    private processConditionStats(): void {
        const processCondition = (stats: ConditionStatistics | undefined, condition: BaseCondition) => {
            if (stats === undefined) {
                console.error(`Condition statistics not found for condition: ${condition.toString()}`);
                return;
            }
            
            if (condition instanceof AndCondition || condition instanceof OrCondition) {
                for (const subCondition of condition.conditions) {
                    stats.addSubConditionStats(subCondition);
                    processCondition(stats.subConditionStats.get(subCondition.toString()), subCondition);
                }
            }
        };

        processCondition(this, this._condition);
    }

    addSubConditionStats(subCondition: BaseCondition): void {
        const conditionKey = subCondition.toString();
        if (!this.subConditionStats.has(conditionKey)) {
            this.subConditionStats.set(conditionKey, new ConditionStatistics(subCondition, this._totalEvaluations));
        }
    }

    get successRate(): number {
        return this._condition.successes / this._totalEvaluations || 0;
    }

    public get condition(): BaseCondition {
        return this._condition;
    }

    public get totalEvaluations(): number {
        return this._totalEvaluations;
    }

    public get subConditionStats(): Map<string, ConditionStatistics> {
        return this._subConditionStats;
    }
}

class Report {
    private _cardNameStats: Map<string, CardStatistics> = new Map();
    private _cardTagStats: Map<string, CardStatistics> = new Map();
    private _banishedCardNameStats: Map<string, CardStatistics> = new Map();
    private _banishedCardTagStats: Map<string, CardStatistics> = new Map();
    private _discardedCardNameStats: Map<string, CardStatistics> = new Map();
    private _discardedCardTagStats: Map<string, CardStatistics> = new Map();
    private _successWithUnusedFreeCards: number = 0;
    private _condition: BaseCondition;
    private _conditionStats: ConditionStatistics;

    private constructor(readonly simulations: Simulation[]) {
        this._condition = simulations[0].condition;
        this._conditionStats = new ConditionStatistics(this._condition, simulations.length);
        this.processSimulations();
    }

    public static generateReports(simulations: Simulation[]): Report[] {
        const simulationMap = new Map<string, Simulation[]>();

        for (const simulation of simulations) {
            const conditionKey = simulation.condition.toString();
            if (!simulationMap.has(conditionKey)) {
                simulationMap.set(conditionKey, []);
            }
            simulationMap.get(conditionKey)!.push(simulation);
        }

        return Array.from(simulationMap.values()).map(sims => new Report(sims));
    }

    private processSimulations(): void {
        for (const simulation of this.simulations) {
            // Process the initial hand recording seen counts
            this.processInitialHand(simulation.branches[0]);

            // Process free card statistics
            this.processFreeCards(simulation);

            // Check game state statistics
            this.processBanishedCards(simulation);
            this.processDiscardedCards(simulation);

            // Check for unused free cards
            this.checkUnusedFreeCards(simulation);
        }
    }

    private processInitialHand(branch: SimulationBranch): void {
        const cardCounts = new Map<string, number>();
    
        // Count occurrences of each card
        for (const card of branch.gameState.hand) {
            const count = cardCounts.get(card.name) || 0;
            cardCounts.set(card.name, count + 1);
        }
    
        // Process card counts
        for (const [cardName, count] of cardCounts) {
            const card = branch.gameState.hand.find(c => c.name === cardName);
            if (card) {
                this.getCardStatistic(this._cardNameStats, cardName, card.isFree)!.cardSeen(count);
    
                for (const tag of card.tags || []) {
                    this.getCardStatistic(this._cardTagStats, tag)!.cardSeen(count);
                }
            }
        }
    }

    private processFreeCards(simulation: Simulation): void {
        const initialBranch = simulation.branches[0];
        const successfulBranch = simulation.successfulBranch;

        // Check if we passed on the initial branch
        if (successfulBranch == initialBranch) {
            return;
        }

        if (successfulBranch && successfulBranch !== initialBranch) {
            const drawnCards = this.getDrawnCards(initialBranch, successfulBranch);
            
            for (const card of drawnCards) {
                this.getCardStatistic(this._cardNameStats, card.name, card.isFree)!.cardDrawn();
                
                for (const tag of card.tags || []) {
                    this.getCardStatistic(this._cardTagStats, tag)!.cardDrawn();
                }
            }

            const usedFreeCards = successfulBranch.gameState.freeCardsPlayedThisTurn;
            for (const freeCard of usedFreeCards) {
                (this.getCardStatistic(this._cardNameStats, freeCard.name, freeCard.isFree) as FreeCardStatistics)!.activated();
            }

            const unusedFreeCards = successfulBranch.gameState.freeCardsInHand;
            for (const freeCard of unusedFreeCards) {
                (this.getCardStatistic(this._cardNameStats, freeCard.name, freeCard.isFree) as FreeCardStatistics)!.unused();
            }
        }
    }

    private processBanishedCards(simulation: Simulation): void {
        if (!simulation.successfulBranch) {
            return; // Skip processing if there's no successful branch
        }

        const cardCounts = new Map<string, number>();
    
        // Count occurrences of each card
        for (const card of simulation.successfulBranch.gameState.banishPile) {
            const count = cardCounts.get(card.name) || 0;
            cardCounts.set(card.name, count + 1);
        }
    
        // Process card counts
        for (const [cardName, count] of cardCounts) {
            const card = simulation.successfulBranch.gameState.banishPile.find(c => c.name === cardName);
            if (card) {
                this.getCardStatistic(this._banishedCardNameStats, cardName, card.isFree)!.cardSeen(count);
    
                for (const tag of card.tags || []) {
                    this.getCardStatistic(this._banishedCardTagStats, tag)!.cardSeen(count);
                }
            }
        }
    }

    private processDiscardedCards(simulation: Simulation): void {
        if (!simulation.successfulBranch) {
            return; // Skip processing if there's no successful branch
        }

        const cardCounts = new Map<string, number>();
    
        // Count occurrences of each card
        for (const card of simulation.successfulBranch.gameState.graveyard) {
            const count = cardCounts.get(card.name) || 0;
            cardCounts.set(card.name, count + 1);
        }
    
        // Process card counts
        for (const [cardName, count] of cardCounts) {
            const card = simulation.successfulBranch.gameState.graveyard.find(c => c.name === cardName);
            if (card) {
                this.getCardStatistic(this._discardedCardNameStats, cardName, card.isFree)!.cardSeen(count);
    
                for (const tag of card.tags || []) {
                    this.getCardStatistic(this._discardedCardTagStats, tag)!.cardSeen(count);
                }
            }
        }
    }

    private checkUnusedFreeCards(simulation: Simulation): void {
        if (simulation.result) {
            const unusedFreeCards = simulation.successfulBranch?.gameState.freeCardsInHand || [];
            if (unusedFreeCards.length > 0) {
                this._successWithUnusedFreeCards++;
            }
        }
    }

    private getCardStatistic(statsMap: Map<string, CardStatistics>, key: string, isFree: boolean = false): CardStatistics | undefined {
        if (!statsMap.has(key)) {
            const stat = isFree ? new FreeCardStatistics(key) : new CardStatistics(key);
            statsMap.set(key, stat);
        }
        return statsMap.get(key);
    }

    private getDrawnCards(initialBranch: SimulationBranch, successfulBranch: SimulationBranch): Card[] {
        const initialHandSet = new Set(initialBranch.gameState.hand);
        return successfulBranch.gameState.hand.filter(card => !initialHandSet.has(card));
    }

    public get iterations(): number {
        return this.simulations.length;
    }

    public get successfulSimulations(): Simulation[] {
        return this.simulations.filter(sim => sim.result);
    }

    public get successRate(): number {
        return this.successfulSimulations.length / this.iterations;
    }

    public get successRatePercentage(): string {
        return `${(this.successRate * 100).toFixed(2)}%`;
    }

    public get cardNameStats(): Map<string, CardStatistics> {
        return this._cardNameStats;
    }

    public get cardTagStats(): Map<string, CardStatistics> {
        return this._cardTagStats;
    }

    public get freeCardStats(): Map<string, FreeCardStatistics> {
        return new Map(
            Array.from(this._cardNameStats.entries())
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                .filter(([_, stat]) => stat instanceof FreeCardStatistics)
        ) as Map<string, FreeCardStatistics>;
    }

    public get banishedCardNameStats(): Map<string, CardStatistics> {
        return this._banishedCardNameStats;
    }

    public get banishedCardTagStats(): Map<string, CardStatistics> {
        return this._banishedCardTagStats;
    }

    public get discardedCardNameStats(): Map<string, CardStatistics> {
        return this._discardedCardNameStats;
    }

    public get discardedCardTagStats(): Map<string, CardStatistics> {
        return this._discardedCardTagStats;
    }

    public get successWithUnusedFreeCardsRate(): number {
        return (this._successWithUnusedFreeCards / this.successfulSimulations.length) || 0;
    }

    public get conditionStats(): ConditionStatistics {
        return this._conditionStats;
    }
}

export { Report, CardStatistics, FreeCardStatistics, ConditionStatistics };