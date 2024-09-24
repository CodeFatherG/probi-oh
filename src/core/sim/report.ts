import { Simulation, SimulationBranch } from "./simulation";
import { Card } from "../data/card";
import { GameState } from '../data/game-state';

export interface CardStats {
    id: string;
    seenCount: Record<number, number>;
    drawnCount: number;
}

export interface FreeCardStats {
    id: string;
    usedToWinCount: number;
    unusedCount: number;
}

export interface ConditionStats {
    conditionId: string;
    successCount: number;
    totalEvaluations: number;
    subConditionStats: Record<string, ConditionStats>;
}

export interface Report {
    iterations: number;
    successfulSimulations: number;
    cardNameStats: Record<string, CardStats>;
    cardTagStats: Record<string, CardStats>;
    freeCardStats: Record<string, FreeCardStats>;
    banishedCardNameStats: Record<string, CardStats>;
    banishedCardTagStats: Record<string, CardStats>;
    discardedCardNameStats: Record<string, CardStats>;
    discardedCardTagStats: Record<string, CardStats>;
    successWithUnusedFreeCards: number;
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
    const getDrawnCards = (initialBranch: SimulationBranch, successfulBranch: SimulationBranch): Card[] => {
        const initialHandSet = new Set(initialBranch.gameState.hand);
        return successfulBranch.gameState.hand.filter(card => !initialHandSet.has(card));
    }

    simulation.branches.forEach(branch => {
        const successfulBranch = branch.find(b => b.result);
        const initialBranch = branch[0];

        // Check if we passed on the initial branch
        if (successfulBranch == initialBranch) {
            return;
        }

        if (successfulBranch && successfulBranch !== initialBranch) {
            const drawnCards = getDrawnCards(initialBranch, successfulBranch);
            
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

    return report;
}

export function generateReport(simulations: Simulation[]): Report {
    return processSimulations(simulations);
}
