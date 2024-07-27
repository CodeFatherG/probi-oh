import { Simulation, SimulationBranch } from "./simulation";
import { Card, FreeCard } from "./card";
import { BaseCondition, AndCondition, OrCondition, Condition } from "./condition";

class CardStatistics {
    private countMap: Map<number, number> = new Map();

    constructor(public readonly name: string) {}

    addCount(count: number): void {
        this.countMap.set(count, (this.countMap.get(count) || 0) + 1);
    }

    get totalOccurrences(): number {
        return Array.from(this.countMap.values()).reduce((sum, count) => sum + count, 0);
    }

    get averageCount(): number {
        const totalCount = Array.from(this.countMap.entries()).reduce((sum, [count, occurrences]) => sum + count * occurrences, 0);
        return totalCount / this.totalOccurrences || 0;
    }

    getCountDistribution(): { count: number; occurrences: number }[] {
        return Array.from(this.countMap.entries()).map(([count, occurrences]) => ({ count, occurrences }));
    }
}

class FreeCardStatistics extends CardStatistics {
    private successfulActivations: number = 0;
    private failedToSuccessCount: number = 0;

    addSuccessfulActivation(): void {
        this.successfulActivations++;
    }

    addFailedToSuccess(): void {
        this.failedToSuccessCount++;
    }

    get activationRate(): number {
        return this.successfulActivations / this.totalOccurrences;
    }

    get failedToSuccessRate(): number {
        return this.failedToSuccessCount / this.totalOccurrences;
    }
}

class ConditionStatistics {
    private totalEvaluations: number = 0;
    private subConditionStats: Map<string, ConditionStatistics> = new Map();

    constructor(public readonly condition: BaseCondition) {}

    addEvaluation(): void {
        this.totalEvaluations++;
    }

    get successRate(): number {
        return this.condition.successes / this.totalEvaluations || 0;
    }

    addSubConditionStats(subCondition: BaseCondition): void {
        const conditionKey = this.getConditionKey(subCondition);
        if (!this.subConditionStats.has(conditionKey)) {
            this.subConditionStats.set(conditionKey, new ConditionStatistics(subCondition));
        }
    }

    getSubConditionStats(): Map<string, ConditionStatistics> {
        return this.subConditionStats;
    }

    private getConditionKey(condition: BaseCondition): string {
        if (condition instanceof Condition) {
            return `${condition.quantity}${condition.operator} ${condition.cardName}`;
        } else if (condition instanceof AndCondition) {
            return 'AND';
        } else if (condition instanceof OrCondition) {
            return 'OR';
        }
        return 'Unknown';
    }
}

class Report {
    private _cardNameStats: Map<string, CardStatistics> = new Map();
    private _cardTagStats: Map<string, CardStatistics> = new Map();
    private _freeCardStats: Map<string, FreeCardStatistics> = new Map();
    private _banishedCardNameStats: Map<string, CardStatistics> = new Map();
    private _banishedCardTagStats: Map<string, CardStatistics> = new Map();
    private _discardedCardNameStats: Map<string, CardStatistics> = new Map();
    private _discardedCardTagStats: Map<string, CardStatistics> = new Map();
    private _successWithUnusedFreeCards: number = 0;
    private _conditionStats: Map<string, ConditionStatistics> = new Map();

    constructor(readonly simulations: Simulation[]) {
        this.processSimulations();
    }

    private processSimulations(): void {
        for (const simulation of this.simulations) {
            this.processInitialHand(simulation.branches[0]);
            this.processFreeCards(simulation);
            this.processBanishedCards(simulation);
            this.processDiscardedCards(simulation);
            this.checkUnusedFreeCards(simulation);
            this.processConditionStats(simulation);
        }
    }

    private processInitialHand(branch: SimulationBranch): void {
        for (const card of branch.gameState.hand) {
            this.updateCardStats(this._cardNameStats, card.name);
            for (const tag of card.tags || []) {
                this.updateCardStats(this._cardTagStats, tag);
            }
            if (card.isFree) {
                this.updateFreeCardStats(card as FreeCard);
            }
        }
    }

    private processFreeCards(simulation: Simulation): void {
        const initialBranch = simulation.branches[0];
        const successfulBranch = simulation.successfulBranch;

        if (successfulBranch && successfulBranch !== initialBranch) {
            const drawnCards = this.getDrawnCards(initialBranch, successfulBranch);
            for (const card of drawnCards) {
                this.updateCardStats(this._cardNameStats, card.name);
                for (const tag of card.tags || []) {
                    this.updateCardStats(this._cardTagStats, tag);
                }
            }

            const usedFreeCards = successfulBranch.gameState.freeCardsPlayedThisTurn;
            for (const freeCard of usedFreeCards) {
                const stats = this._freeCardStats.get(freeCard.name);
                if (stats) {
                    stats.addSuccessfulActivation();
                    if (!simulation.branches[0].result) {
                        stats.addFailedToSuccess();
                    }
                }
            }
        }
    }

    private processBanishedCards(simulation: Simulation): void {
        const banishedCards = simulation.successfulBranch?.gameState.banishPile || [];
        for (const card of banishedCards) {
            this.updateCardStats(this._banishedCardNameStats, card.name);
            for (const tag of card.tags || []) {
                this.updateCardStats(this._banishedCardTagStats, tag);
            }
        }
    }

    private processDiscardedCards(simulation: Simulation): void {
        const discardedCards = simulation.successfulBranch?.gameState.graveyard || [];
        for (const card of discardedCards) {
            this.updateCardStats(this._discardedCardNameStats, card.name);
            for (const tag of card.tags || []) {
                this.updateCardStats(this._discardedCardTagStats, tag);
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

    private processConditionStats(simulation: Simulation): void {
        const processCondition = (condition: BaseCondition) => {
            const conditionKey = this.getConditionKey(condition);
            if (!this._conditionStats.has(conditionKey)) {
                this._conditionStats.set(conditionKey, new ConditionStatistics(condition));
            }
            const stats = this._conditionStats.get(conditionKey)!;
            stats.addEvaluation();

            if (condition instanceof AndCondition || condition instanceof OrCondition) {
                for (const subCondition of condition.conditions) {
                    stats.addSubConditionStats(subCondition);
                    processCondition(subCondition);
                }
            }
        };

        processCondition(simulation.condition);
    }

    private updateCardStats(statsMap: Map<string, CardStatistics>, key: string): void {
        if (!statsMap.has(key)) {
            statsMap.set(key, new CardStatistics(key));
        }
        statsMap.get(key)!.addCount(1);
    }

    private updateFreeCardStats(freeCard: FreeCard): void {
        if (!this._freeCardStats.has(freeCard.name)) {
            this._freeCardStats.set(freeCard.name, new FreeCardStatistics(freeCard.name));
        }
        this._freeCardStats.get(freeCard.name)!.addCount(1);
    }

    private getDrawnCards(initialBranch: SimulationBranch, successfulBranch: SimulationBranch): Card[] {
        const initialHandSet = new Set(initialBranch.gameState.hand);
        return successfulBranch.gameState.hand.filter(card => !initialHandSet.has(card));
    }

    private getConditionKey(condition: BaseCondition): string {
        if (condition instanceof Condition) {
            return `${condition.quantity}${condition.operator} ${condition.cardName}`;
        } else if (condition instanceof AndCondition) {
            return 'AND';
        } else if (condition instanceof OrCondition) {
            return 'OR';
        }
        return 'Unknown';
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
        return this._freeCardStats;
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
        return this._successWithUnusedFreeCards / this.successfulSimulations.length;
    }

    public get conditionStats(): Map<string, ConditionStatistics> {
        return this._conditionStats;
    }
}

export { Report, CardStatistics, FreeCardStatistics, ConditionStatistics };