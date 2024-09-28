import { Simulation } from "./simulation";
import { Card } from "../data/card";
import { GameState } from '../data/game-state';
import { AndCondition, BaseCondition, OrCondition } from "./condition";

/**
 * Represents the statistics for a card
 */
export interface CardStats {
    /**
     * The id of the card. This could be a name or a tag
     */
    id: string;

    /**
     * The number of times the card appeared in the hand.
     * This is a map of the number of times the card appeared 
     * in the hand to the number of times it appeared that many times.
     */
    seenCount: Record<number, number>;

    /**
     * The number of times the card was seen in a concurrent branch that 
     * is not the initial branch. Meaning that we drew it.
     */
    drawnCount: number;
}

/**
 * Represents the statistics for a free card
 * @interface
 */
export interface FreeCardStats {
    /**
     * The id of the free card. This is the name of the card
     */
    id: string;

    /**
     * The number of times the free card appeared in the played cards for a successful branch.
     * This is incremented when the free card is used in a successful branch. This means the
     * total times this count is evaluated is the number of iterations * the condition count as
     * if you have 1 iteration and 3 conditions, where 2 conditions used this card to succeed,
     * then this count will be 2, but techincally it was drawn 3 times (since the hand is the same).
     */
    usedToWinCount: number;

    /**
     * The number of times the free card was in the hand of a successful branch.
     * This is incremented when the free card is in the final hand of a successful branch. 
     * This means the card was not used to win the game.
     */
    unusedCount: number;
}

/**
 * Represents the statistics for a condition
 * @interface
 */
export interface ConditionStats {
    /**
     * The id of the condition
     */
    conditionId: string;

    /**
     * The number of successful evaluations of the condition
     * Whilst the simulation will branch to explore permutations of cards and free card usage, 
     * this is the number of times the condition was successful which is only counted once 
     * per simulation regardless of branches.
     */
    successCount: number;

    /**
     * The statistics for the conditions that build this condition
     */
    subConditionStats: Record<string, ConditionStats>;
}

/**
 * Represents the report generated from a set of simulations
 * @interface
 */
export interface Report {
    /**
     * The number of iterations that were run
     */
    iterations: number;

    /**
     * The number of successful simulations
     * A successful simulation is a where any condition passed for that simulation.
     */
    successfulSimulations: number;

    /**
     * The statistics for the cards drawn
     */
    cardNameStats: Record<string, CardStats>;

    /**
     * The statistics for the tags of the cards drawn
     */
    cardTagStats: Record<string, CardStats>;

    /**
     * The statistics for the free cards used
     */
    freeCardStats: Record<string, FreeCardStats>;

    /**
     * The statistics for the cards banished
     */
    banishedCardNameStats: Record<string, CardStats>;

    /**
     * The statistics for the tags of the cards banished
     */
    banishedCardTagStats: Record<string, CardStats>;

    /**
     * The statistics for the cards discarded
     */
    discardedCardNameStats: Record<string, CardStats>;

    /**
     * The statistics for the tags of the cards discarded
     */
    discardedCardTagStats: Record<string, CardStats>;

    /**
     * The number of successful simulations where free cards were not used
     * This is for all conditions tested of a simulation, how many of them were both successful and had free cards in hand.
     */
    successWithUnusedFreeCards: number;

    /**
     * The statistics for the conditions evaluated
     */
    conditionStats: Record<string, ConditionStats>;
}

function countCards(list: string[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const card of list) {
        const count = counts.get(card) || 0;
        counts.set(card, count + 1);
    }

    return counts;
}

function countCardsInList(store: Record<string, CardStats>, list: string[]): void {
    const cardCounts = countCards(list);
    
    // Process card counts
    for (const [id, count] of cardCounts) {
        if (!store[id]) {
            store[id] = {
                id: id,
                seenCount: {},
                drawnCount: 0,
            };
        }

        store[id].seenCount[count] = (store[id].seenCount[count] || 0) + 1;
    }
}

function processInitialHand(report: Report, gameState: GameState): void {
    countCardsInList(report.cardNameStats, gameState.hand.map(card => card.name));
    countCardsInList(report.cardTagStats, gameState.hand.map(card => card.tags ?? []).flat());
}

function processFreeCards(report: Report, simulation: Simulation): void {
    simulation.branches.forEach(conditionBranch => {

        // Count cards drawn. We can did this by going through each branch and checking if the card is in the last hand
        let lastHand: Card[] = conditionBranch[0].gameState.hand;
        conditionBranch.slice(1).forEach(b => {
            const drawnCards = b.gameState.hand.filter(card => !lastHand.includes(card));
            lastHand = b.gameState.hand;

            for (const card of drawnCards) {
                // check if card is in the report
                if (!report.cardNameStats[card.name]) {
                    report.cardNameStats[card.name] = {
                        id: card.name,
                        seenCount: {},
                        drawnCount: 0,
                    };
                }

                const cardNameStats = report.cardNameStats[card.name];
                cardNameStats.drawnCount += 1;

                // check if tag is in the report
                for (const tag of card.tags || []) {
                    if (!report.cardTagStats[tag]) {
                        report.cardTagStats[tag] = {
                            id: tag,
                            seenCount: {},
                            drawnCount: 0,
                        };
                    }

                    const tagStats = report.cardTagStats[tag];
                    tagStats.drawnCount += 1;
                }
            }
        });

        
        const successfulBranch = conditionBranch.find(b => b.result);
        if (successfulBranch) {
            // If there is a successful branch, then the free cards played helped us win
            const usedFreeCards = successfulBranch.gameState.freeCardsPlayedThisTurn;
            for (const freeCard of usedFreeCards) {
                // check if card is in the report
                if (!report.freeCardStats[freeCard.name]) {
                    report.freeCardStats[freeCard.name] = {
                        id: freeCard.name,
                        usedToWinCount: 0,
                        unusedCount: 0,
                    };
                }

                const freeCardStats = report.freeCardStats[freeCard.name];
                freeCardStats.usedToWinCount += 1;
            }

            // If there are free cards in the successful branch, Then you have won without using them
            const unusedFreeCards = successfulBranch.gameState.freeCardsInHand;
            for (const freeCard of unusedFreeCards) {
                // check if card is in the report
                if (!report.freeCardStats[freeCard.name]) {
                    report.freeCardStats[freeCard.name] = {
                        id: freeCard.name,
                        usedToWinCount: 0,
                        unusedCount: 0,
                    };
                }

                const freeCardStats = report.freeCardStats[freeCard.name];
                freeCardStats.unusedCount += 1;
            }
        }
    });
}

function processBanishedCards(report: Report, simulation: Simulation): void {
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
                // check if card is in the report
                if (!report.banishedCardNameStats[cardName]) {
                    report.banishedCardNameStats[cardName] = {
                        id: cardName,
                        seenCount: {},
                        drawnCount: 0,
                    };
                }

                const cardNameStats = report.banishedCardNameStats[cardName];
                cardNameStats.seenCount[count] = (cardNameStats.seenCount[count] || 0) + 1;

                // check if tag is in the report
                for (const tag of card.tags || []) {
                    if (!report.banishedCardTagStats[tag]) {
                        report.banishedCardTagStats[tag] = {
                            id: tag,
                            seenCount: {},
                            drawnCount: 0,
                        };
                    }

                    const tagStats = report.banishedCardTagStats[tag];
                    tagStats.seenCount[count] = (tagStats.seenCount[count] || 0) + 1;
                }
            }
        }
    });
}

function processDiscardedCards(report: Report, simulation: Simulation): void {
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
                // check if card is in the report
                if (!report.discardedCardNameStats[cardName]) {
                    report.discardedCardNameStats[cardName] = {
                        id: cardName,
                        seenCount: {},
                        drawnCount: 0,
                    };
                }

                const cardNameStats = report.discardedCardNameStats[cardName];
                cardNameStats.seenCount[count] = (cardNameStats.seenCount[count] || 0) + 1;

                // check if tag is in the report
                for (const tag of card.tags || []) {
                    if (!report.discardedCardTagStats[tag]) {
                        report.discardedCardTagStats[tag] = {
                            id: tag,
                            seenCount: {},
                            drawnCount: 0,
                        };
                    }

                    const tagStats = report.discardedCardTagStats[tag];
                    tagStats.seenCount[count] = (tagStats.seenCount[count] || 0) + 1;
                }
            }
        }
    });
}

function checkUnusedFreeCards(report: Report, simulation: Simulation): void {
    if (simulation.result) {
        report.successWithUnusedFreeCards += simulation.successfulBranches.filter(b => b[1] && b[1]?.gameState.freeCardsInHand.length !== 0).length;
    }
}

function processConditionStats(report: Report, condition: BaseCondition): void {
    const processCondition = (stats: ConditionStats | undefined, condition: BaseCondition) => {
        if (stats === undefined) {
            console.error(`Condition statistics not found for condition: ${condition.toString()}`);
            return;
        }
        
        if (condition instanceof AndCondition || condition instanceof OrCondition) {
            for (const subCondition of condition.conditions) {
                stats.subConditionStats[subCondition.toString()] = {
                    conditionId: subCondition.toString(),
                    successCount: subCondition.successes,
                    subConditionStats: {},
                };
                processCondition(stats.subConditionStats[subCondition.toString()], subCondition);
            }
        }
    };

    report.conditionStats[condition.toString()] = {
        conditionId: condition.toString(),
        successCount: condition.successes,
        subConditionStats: {},
    }
    processCondition(report.conditionStats[condition.toString()], condition);
}

function processSimulations(simulations: Simulation[]): Report {
    const report: Report = {
        iterations: simulations.length,
        successfulSimulations: simulations.filter(s => s.result).length,
        cardNameStats: {},
        cardTagStats: {},
        freeCardStats: {},
        banishedCardNameStats: {},
        banishedCardTagStats: {},
        discardedCardNameStats: {},
        discardedCardTagStats: {},
        successWithUnusedFreeCards: 0,
        conditionStats: {},
    };

    for (const simulation of simulations) {
        // Process the initial hand recording seen counts
        processInitialHand(report, simulation.gameState);

        // Process free card statistics
        processFreeCards(report, simulation);

        // Check game state statistics
        processBanishedCards(report, simulation);
        processDiscardedCards(report, simulation);

        // Check for unused free cards
        checkUnusedFreeCards(report, simulation);
    }

    // Process condition statistics. Condition objects are constant so we can use the first simulation
    if (simulations.length > 0) {
        simulations[0].conditions.forEach(condition => processConditionStats(report, condition));
    }

    return report;
}

export function generateReport(simulations: Simulation[]): Report {
    return processSimulations(simulations);
}
