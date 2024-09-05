import { Simulation, SimulationBranch } from "./simulation";
import { Card } from "./card";
import { AndCondition, BaseCondition, OrCondition } from "./condition";
import { GameState } from './game-state';

export class CardStatistics {
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

export class FreeCardStatistics extends CardStatistics {
    private _usedToWinCount: number = 0;
    private _unusedCount: number = 0;

    usedToWin(): void {
        this._usedToWinCount++;
    }

    unused(): void {
        this._unusedCount++;
    }

    get usedToWinCount(): number {
        return this._usedToWinCount;
    }

    get usedToWinRate(): number {
        return this.usedToWinCount / this.cardSeenCount;
    }

    get unusedCount(): number {
        return this._unusedCount;
    }

    get unusedRate(): number {
        return this.unusedCount / this.cardSeenCount;
    }
}

export class ConditionStatistics {
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

export class Report {
    private _cardNameStats: Map<string, CardStatistics> = new Map();
    private _cardTagStats: Map<string, CardStatistics> = new Map();
    private _banishedCardNameStats: Map<string, CardStatistics> = new Map();
    private _banishedCardTagStats: Map<string, CardStatistics> = new Map();
    private _discardedCardNameStats: Map<string, CardStatistics> = new Map();
    private _discardedCardTagStats: Map<string, CardStatistics> = new Map();
    private _successWithUnusedFreeCards: number = 0;
    private _conditions: BaseCondition[];
    private _conditionStats: Map<BaseCondition, ConditionStatistics> = new Map();

    private constructor(readonly simulations: Simulation[]) {
        this._conditions = simulations[0].conditions;
        this._conditions.forEach(condition => {
            if (!this._conditionStats.has(condition)) {
                this._conditionStats.set(condition, new ConditionStatistics(condition, simulations.length));
            }
        });
        this.processSimulations();

        this._cardNameStats = this.sortMapByKey(this._cardNameStats);
        this._cardTagStats = this.sortMapByKey(this._cardTagStats);
        this._banishedCardNameStats = this.sortMapByKey(this._banishedCardNameStats);
        this._banishedCardTagStats = this.sortMapByKey(this._banishedCardTagStats);
        this._discardedCardNameStats = this.sortMapByKey(this._discardedCardNameStats);
        this._discardedCardTagStats = this.sortMapByKey(this._discardedCardTagStats);
    }

    private sortMapByKey<T>(map: Map<string, T>): Map<string, T> {
        return new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])));
    }

    public static generateReports(simulations: Simulation[]): Report {
        return new Report(simulations);
    }

    private processSimulations(): void {
        for (const simulation of this.simulations) {
            // Process the initial hand recording seen counts
            this.processInitialHand(simulation.gameState);

            // Process free card statistics
            this.processFreeCards(simulation);

            // Check game state statistics
            this.processBanishedCards(simulation);
            this.processDiscardedCards(simulation);

            // Check for unused free cards
            this.checkUnusedFreeCards(simulation);
        }
    }

    private processInitialHand(gameState: GameState): void {
        const cardCounts = new Map<string, number>();
    
        // Count occurrences of each card
        for (const card of gameState.hand) {
            const count = cardCounts.get(card.name) || 0;
            cardCounts.set(card.name, count + 1);
        }
    
        // Process card counts
        for (const [cardName, count] of cardCounts) {
            const card = gameState.hand.find(c => c.name === cardName);
            if (card) {
                this.getCardStatistic(this._cardNameStats, cardName, card.isFree)!.cardSeen(count);
    
                for (const tag of card.tags || []) {
                    this.getCardStatistic(this._cardTagStats, tag)!.cardSeen(count);
                }
            }
        }
    }

    private processFreeCards(simulation: Simulation): void {
        simulation.branches.forEach(branch => {
            const successfulBranch = branch.find(b => b.result);
            const initialBranch = branch[0];

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
                    (this.getCardStatistic(this._cardNameStats, freeCard.name, freeCard.isFree) as FreeCardStatistics)!.usedToWin();
                }

                const unusedFreeCards = successfulBranch.gameState.freeCardsInHand;
                for (const freeCard of unusedFreeCards) {
                    (this.getCardStatistic(this._cardNameStats, freeCard.name, freeCard.isFree) as FreeCardStatistics)!.unused();
                }
            }
        });
    }

    private processBanishedCards(simulation: Simulation): void {
        const cardCounts = new Map<string, number>();

        simulation.successfulBranches.filter(b => b[1]).forEach(branch => {
            const banishPile = branch[1]?.gameState.banishPile || [];
            // Count occurrences of each card
            for (const card of banishPile) {
                const count = cardCounts.get(card.name) || 0;
                cardCounts.set(card.name, count + 1);
            }

            // Process card counts
            for (const [cardName, count] of cardCounts) {
                const card = branch[1]?.gameState.banishPile.find(c => c.name === cardName);
                if (card) {
                    this.getCardStatistic(this._banishedCardNameStats, cardName, card.isFree)!.cardSeen(count);
        
                    for (const tag of card.tags || []) {
                        this.getCardStatistic(this._banishedCardTagStats, tag)!.cardSeen(count);
                    }
                }
            }
        });
    }

    private processDiscardedCards(simulation: Simulation): void {
        const cardCounts = new Map<string, number>();
    
        simulation.successfulBranches.filter(b => b[1]).forEach(branch => {
            const graveyard = branch[1]?.gameState.graveyard || [];
            // Count occurrences of each card
            for (const card of graveyard) {
                const count = cardCounts.get(card.name) || 0;
                cardCounts.set(card.name, count + 1);
            }

            // Process card counts
            for (const [cardName, count] of cardCounts) {
                const card = branch[1]?.gameState.graveyard.find(c => c.name === cardName);
                if (card) {
                    this.getCardStatistic(this._discardedCardNameStats, cardName, card.isFree)!.cardSeen(count);
        
                    for (const tag of card.tags || []) {
                        this.getCardStatistic(this._banishedCardTagStats, tag)!.cardSeen(count);
                    }
                }
            }
        });
    }

    private checkUnusedFreeCards(simulation: Simulation): void {
        if (simulation.result) {
            this._successWithUnusedFreeCards += simulation.successfulBranches.filter(b => b[1] && b[1]?.gameState.freeCardsInHand.length !== 0).length;
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

    public get conditionStats(): Map<BaseCondition, ConditionStatistics> {
        return this._conditionStats;
    }
}
