// import { Report, CardStatistics, FreeCardStatistics, ConditionStatistics } from '../src/utils/report';
// import { Simulation, SimulationBranch } from '../src/utils/simulation';
// import { GameState } from '../src/utils/game-state';
// import { Card, FreeCard } from '../src/utils/card';
// import { Condition, BaseCondition, AndCondition, OrCondition } from '../src/utils/condition';
// import { Deck } from '../src/utils/deck';
// import { CardDetails } from '../src/utils/card-details';

// // Mock interfaces and factories
// interface IMockCard {
//     name: string;
//     nameLower: string;
//     tags: readonly string[] | null;
//     details: Readonly<CardDetails>;
//     isFree: boolean;
// }

// interface IMockFreeCard extends IMockCard {
//     count: number;
//     oncePerTurn: boolean;
//     restrictions: any[];
//     cost: any;
//     condition: any;
//     excavate: any;
// }

// const createMockCard = (name: string, tags: string[] = [], isFree: boolean = false): IMockCard => ({
//     name,
//     nameLower: name.toLowerCase(),
//     tags,
//     details: { tags },
//     isFree,
// });

// const createMockFreeCard = (name: string, tags: string[] = []): IMockFreeCard => ({
//     ...createMockCard(name, tags, true),
//     count: 0,
//     oncePerTurn: false,
//     restrictions: [],
//     cost: null,
//     condition: null,
//     excavate: null,
// });

// const createMockDeck = (cards: IMockCard[]): Deck => ({
//     deckList: cards,
//     deckCount: cards.length,
//     drawCard: jest.fn(),
//     shuffle: jest.fn(),
//     deepCopy: jest.fn(),
//     addToBottom: jest.fn(),
// } as unknown as Deck);

// const createMockGameState = (hand: IMockCard[], deck: IMockCard[],
//     banishPile: IMockCard[] = [], graveyard: IMockCard[] = [],
//     freecardsUsed: IMockCard[] = []): GameState => ({
//     hand,
//     deck: createMockDeck(deck),
//     banishPile,
//     graveyard,
//     freeCardsInHand: hand.filter(card => card.isFree) as IMockFreeCard[],
//     cardsPlayedThisTurn: [],
//     freeCardsPlayedThisTurn: freecardsUsed,
//     drawHand: jest.fn(),
//     playCard: jest.fn(),
//     discardFromHand: jest.fn(),
//     banishFromHand: jest.fn(),
//     deepCopy: jest.fn(),
// } as unknown as GameState);

// const createMockSimulationBranch = (gameState: GameState, result: boolean): SimulationBranch => ({
//     gameState,
//     result,
//     condition: {} as BaseCondition,
//     run: jest.fn(),
// } as unknown as SimulationBranch);

// const createMockSimulation = (branches: SimulationBranch[], result: boolean, condition: BaseCondition | undefined = undefined): Simulation => ({
//     branches,
//     result,
//     condition: condition ? condition : {} as BaseCondition,
//     gameState: branches[0].gameState,
//     successfulBranch: result ? branches[branches.length - 1] : undefined,
//     iterate: jest.fn(),
// } as unknown as Simulation);

// const createMockCondition = (conditionString: string, successRate: number = 0.5): BaseCondition => {
//     let evaluationCount = 0;
//     let successCount = 0;

//     const condition = {
//         evaluate: jest.fn().mockImplementation(() => {
//             evaluationCount++;
//             const success = Math.random() < successRate;
//             if (success) {
//                 successCount++;
//             }
//             return success;
//         }),
//         requiredCards: jest.fn(),
//         toString: jest.fn().mockReturnValue(conditionString),
//         get successes() { return successCount; },
//     } as BaseCondition;

//     // Add a method to get the evaluation count for testing purposes
//     (condition as any).getEvaluationCount = () => evaluationCount;

//     return condition;
// };

// describe('Report', () => {
//     let mockInitialHand: IMockCard[];
//     let mockFinalHand: IMockCard[];
//     let mockDeckCards: IMockCard[];
//     let mockBanishedCards: IMockCard[];
//     let mockDiscardedCards: IMockCard[];
//     let mockGameState: GameState;
//     let mockInitialBranch: SimulationBranch;
//     let mockSuccessfulBranch: SimulationBranch;
//     let mockSimulation: Simulation;
//     let mockComplexCondition: AndCondition;
//     let mockConditionA: BaseCondition;
//     let mockConditionB: BaseCondition;
//     let mockConditionC: BaseCondition;
//     let mockConditionD: BaseCondition;

//     beforeEach(() => {
//         // Set up mock data
//         mockInitialHand = [
//             createMockCard('Card A', ['Tag1', 'Tag2']),
//             createMockCard('Card B', ['Tag2']),
//             createMockFreeCard('Free Card', ['Free'])
//         ];

//         mockFinalHand = [
//             ...mockInitialHand,
//             createMockCard('Drawn Card', ['Tag3'])
//         ];

//         mockDeckCards = [
//             createMockCard('Deck Card 1'),
//             createMockCard('Deck Card 2')
//         ];

//         mockBanishedCards = [
//             createMockCard('Banished Card', ['Tag4', 'Tag5']),
//             createMockCard('Another Banished Card', ['Tag5'])
//         ];

//         mockDiscardedCards = [
//             createMockCard('Discarded Card', ['Tag6']),
//             createMockCard('Another Discarded Card', ['Tag6', 'Tag7'])
//         ];

//         mockGameState = createMockGameState(mockInitialHand, mockDeckCards);
        
//         mockInitialBranch = createMockSimulationBranch(mockGameState, false);
//         mockSuccessfulBranch = createMockSimulationBranch(
//             createMockGameState(mockFinalHand, mockDeckCards, mockBanishedCards, mockDiscardedCards, [mockInitialHand[2]]),
//             true
//         );

//         // Create mock conditions
//         mockConditionA = createMockCondition('Condition A', 0.7);
//         mockConditionB = createMockCondition('Condition B', 0.6);
//         mockConditionC = createMockCondition('Condition C', 0.5);
//         mockConditionD = createMockCondition('Condition D', 0.4);

//         mockComplexCondition = new AndCondition([
//             mockConditionA,
//             new OrCondition([
//                 mockConditionB,
//                 new AndCondition([mockConditionC, mockConditionD])
//             ])
//         ]);

//         // Evaluate the complex condition multiple times to simulate multiple simulations
//         for (let i = 0; i < 100; i++) {
//             mockComplexCondition.evaluate(mockGameState);
//         }

//         // Create mock simulation with the complex condition
//         mockSimulation = createMockSimulation([mockInitialBranch, mockSuccessfulBranch], true, mockComplexCondition);
//     });

//     it('should calculate correct success rate', () => {
//         const report = Report.generateReports([mockSimulation, mockSimulation]);
//         expect(report.successRate).toBe(1);
//         expect(report.successRatePercentage).toBe('100.00%');
//     });

//     it('should record correct card name statistics', () => {
//         const report = Report.generateReports([mockSimulation]);
//         expect(report.cardNameStats.size).toBe(4);
//         expect(report.cardNameStats.get('Card A')?.cardSeenCount).toBe(1);
//         expect(report.cardNameStats.get('Drawn Card')?.cardDrawnCount).toBe(1);
//     });

//     it('should record correct card tag statistics', () => {
//         const report = Report.generateReports([mockSimulation]);
//         expect(report.cardTagStats.size).toBe(4);
//         expect(report.cardTagStats.get('Tag1')?.cardSeenCount).toBe(1);
//         expect(report.cardTagStats.get('Tag2')?.cardSeenCount).toBe(2);
//         expect(report.cardTagStats.get('Tag3')?.cardDrawnCount).toBe(1);
//     });

//     it('should record correct free card statistics', () => {
//         const report = Report.generateReports([mockSimulation]);
//         expect(report.freeCardStats.size).toBe(1);
//         const freeCardStats = report.freeCardStats.get('Free Card') as FreeCardStatistics;
//         expect(freeCardStats.cardSeenCount).toBe(1);
//         expect(freeCardStats.usedToWinCount).toBe(1);
//         expect(freeCardStats.usedToWinRate).toBe(1);
//     });

//     it('should record correct banished card name statistics', () => {
//         const report = Report.generateReports([mockSimulation]);
//         expect(report.banishedCardNameStats.size).toBe(2);
//         expect(report.banishedCardNameStats.get('Banished Card')?.cardSeenCount).toBe(1);
//         expect(report.banishedCardNameStats.get('Another Banished Card')?.cardSeenCount).toBe(1);
//     });

//     it('should record correct banished card tag statistics', () => {
//         const report = Report.generateReports([mockSimulation]);
//         expect(report.banishedCardTagStats.size).toBe(2);
//         expect(report.banishedCardTagStats.get('Tag4')?.cardSeenCount).toBe(1);
//         expect(report.banishedCardTagStats.get('Tag5')?.cardSeenCount).toBe(2);
//     });

//     it('should record correct discarded card name statistics', () => {
//         const report = Report.generateReports([mockSimulation]);
//         expect(report.discardedCardNameStats.size).toBe(2);
//         expect(report.discardedCardNameStats.get('Discarded Card')?.cardSeenCount).toBe(1);
//         expect(report.discardedCardNameStats.get('Another Discarded Card')?.cardSeenCount).toBe(1);
//     });

//     it('should record correct discarded card tag statistics', () => {
//         const report = Report.generateReports([mockSimulation]);
//         expect(report.discardedCardTagStats.size).toBe(2);
//         expect(report.discardedCardTagStats.get('Tag6')?.cardSeenCount).toBe(2);
//         expect(report.discardedCardTagStats.get('Tag7')?.cardSeenCount).toBe(1);
//     });

//     it('should correctly calculate overall success rate', () => {
//         const successfulSimulation = createMockSimulation([mockInitialBranch, mockSuccessfulBranch], true, mockComplexCondition);
//         const failedSimulation = createMockSimulation([mockInitialBranch], false, mockComplexCondition);
        
//         const report = Report.generateReports([successfulSimulation, failedSimulation, successfulSimulation]);
//         expect(report.successRate).toBeCloseTo(2/3, 2);
//         expect(report.successRatePercentage).toBe('66.67%');
//     });

//     it('should correctly process free cards', () => {
//         const freeCard = createMockFreeCard('Free Card');
//         const initialBranch = createMockSimulationBranch(createMockGameState([freeCard], []), false);
//         const successfulBranch = createMockSimulationBranch(createMockGameState([], [], [], [], [freeCard]), true);
//         const simulation = createMockSimulation([initialBranch, successfulBranch], true, mockComplexCondition);

//         const report = Report.generateReports([simulation]);
//         const freeCardStats = report.freeCardStats.get('Free Card');
//         expect(freeCardStats).toBeDefined();
//         expect(freeCardStats?.cardSeenCount).toBe(1);
//         expect(freeCardStats?.usedToWinCount).toBe(1);
//         expect(freeCardStats?.usedToWinRate).toBe(1);
//     });

//     it('should correctly process banished cards', () => {
//         const banishedCard = createMockCard('Banished Card', ['BanishedTag']);
//         const successfulBranch = createMockSimulationBranch(createMockGameState([], [], [banishedCard], []), true);
//         const simulation = createMockSimulation([mockInitialBranch, successfulBranch], true, mockComplexCondition);

//         const report = Report.generateReports([simulation]);
//         expect(report.banishedCardNameStats.get('Banished Card')?.cardSeenCount).toBe(1);
//         expect(report.banishedCardTagStats.get('BanishedTag')?.cardSeenCount).toBe(1);
//     });

//     it('should correctly process discarded cards', () => {
//         const discardedCard = createMockCard('Discarded Card', ['DiscardedTag']);
//         const successfulBranch = createMockSimulationBranch(createMockGameState([], [], [], [discardedCard]), true);
//         const simulation = createMockSimulation([mockInitialBranch, successfulBranch], true, mockComplexCondition);

//         const report = Report.generateReports([simulation]);
//         expect(report.discardedCardNameStats.get('Discarded Card')?.cardSeenCount).toBe(1);
//         expect(report.discardedCardTagStats.get('DiscardedTag')?.cardSeenCount).toBe(1);
//     });

//     it('should correctly handle condition statistics', () => {
//         const report = Report.generateReports([mockSimulation]);
//         expect(report.conditionStats).toBeDefined();
//         expect(report.conditionStats).toContain(mockComplexCondition);
//         expect(report.conditionStats.get(mockComplexCondition)?.totalEvaluations).toBe(1);
//         expect(report.conditionStats.get(mockComplexCondition)?.subConditionStats.size).toBeGreaterThan(0);
//     });

//     it('should calculate correct success with unused free cards rate', () => {
//         // Simulation with no unused free cards in the successful branch
//         const successfulBranchNoUnused = createMockSimulationBranch(
//             createMockGameState(
//                 [createMockCard('Regular Card')],
//                 mockDeckCards,
//                 mockBanishedCards,
//                 mockDiscardedCards,
//                 [createMockFreeCard('Used Free Card')] // This free card is in freeCardsPlayedThisTurn
//             ),
//             true
//         );
//         const simulationNoUnused = createMockSimulation([mockInitialBranch, successfulBranchNoUnused], true, mockComplexCondition);

//         // Simulation with unused free cards in the successful branch
//         const successfulBranchWithUnused = createMockSimulationBranch(
//             createMockGameState(
//                 [createMockCard('Regular Card'), createMockFreeCard('Unused Free Card')],
//                 mockDeckCards,
//                 mockBanishedCards,
//                 mockDiscardedCards,
//                 [] // No free cards played this turn
//             ),
//             true
//         );
//         const simulationWithUnused = createMockSimulation([mockInitialBranch, successfulBranchWithUnused], true, mockComplexCondition);

//         const report = Report.generateReports([simulationNoUnused, simulationWithUnused]);
        
//         console.log('Unused Free Cards Rate:', report.successWithUnusedFreeCardsRate);
//         console.log('Successful Simulations:', report.successfulSimulations.length);
//         console.log('Total Simulations:', report.iterations);
        
//         // We expect 1 out of 2 successful simulations to have unused free cards
//         expect(report.successWithUnusedFreeCardsRate).toBeCloseTo(0.5, 2);
//     });

//     it('should correctly process drawn cards', () => {
//         const hand = [createMockCard('Initial Card')];
//         const initialBranch = createMockSimulationBranch(createMockGameState(hand.slice(), []), false);
//         hand.push(createMockCard('Drawn Card'));
//         const successfulBranch = createMockSimulationBranch(createMockGameState(hand.slice(), []), true);
//         const simulation = createMockSimulation([initialBranch, successfulBranch], true, mockComplexCondition);

//         const report = Report.generateReports([simulation]);
//         console.log('Drawn Card Stats:', report.cardNameStats.get('Drawn Card'));
//         console.log('Initial Card Stats:', report.cardNameStats.get('Initial Card'));
//         expect(report.cardNameStats.get('Drawn Card')?.cardDrawnCount).toBe(1);
//         expect(report.cardNameStats.get('Initial Card')?.cardDrawnCount).toBe(0);
//         expect(report.cardNameStats.get('Initial Card')?.cardSeenCount).toBe(1);
//     });

//     it('should handle simulations with no successful branches', () => {
//         const failedSimulation = createMockSimulation([mockInitialBranch], false, mockComplexCondition);
        
//         const report = Report.generateReports([failedSimulation]);
//         console.log('Success Rate:', report.successRate);
//         console.log('Success Rate Percentage:', report.successRatePercentage);
//         console.log('Success With Unused Free Cards Rate:', report.successWithUnusedFreeCardsRate);
//         expect(report.successRate).toBe(0);
//         expect(report.successRatePercentage).toBe('0.00%');
//         expect(report.successWithUnusedFreeCardsRate).toBe(0);
//     });
// });

// describe('CardStatistics', () => {
//     it('should correctly track card seen and drawn counts', () => {
//         const stats = new CardStatistics('Test Card');
//         stats.cardSeen(1);
//         stats.cardSeen(1);
//         stats.cardDrawn();

//         expect(stats.cardSeenCount).toBe(2);
//         expect(stats.cardDrawnCount).toBe(1);
//     });
// });

// describe('FreeCardStatistics', () => {
//     it('should correctly track activation and unused counts', () => {
//         const stats = new FreeCardStatistics('Free Card');
//         stats.cardSeen(1);
//         stats.cardSeen(1);
//         stats.usedToWin();
//         stats.unused();

//         expect(stats.cardSeenCount).toBe(2);
//         expect(stats.usedToWinCount).toBe(1);
//         expect(stats.unusedCount).toBe(1);
//         expect(stats.usedToWinRate).toBe(0.5);
//         expect(stats.unusedRate).toBe(0.5);
//     });
// });

// describe('createMockCondition Framework', () => {
//     it('should create a condition that properly tracks evaluations and successes', () => {
//         const condition = createMockCondition('Test Condition', 0.7);
//         const evaluations = 1000;

//         for (let i = 0; i < evaluations; i++) {
//             condition.evaluate({} as GameState);
//         }

//         expect((condition as any).getEvaluationCount()).toBe(evaluations);
//         expect(condition.successes).toBeGreaterThan(0);
//         expect(condition.successes).toBeLessThanOrEqual(evaluations);
//         expect(condition.successes / evaluations).toBeCloseTo(0.7, 1);
//     });

//     it('should maintain consistent success rate across multiple evaluations', () => {
//         const condition = createMockCondition('Test Condition', 0.5);
//         const evaluations = 10000;

//         for (let i = 0; i < evaluations; i++) {
//             condition.evaluate({} as GameState);
//         }

//         const actualSuccessRate = condition.successes / evaluations;
//         expect(actualSuccessRate).toBeCloseTo(0.5, 1);
//     });

//     it('should return the correct condition string', () => {
//         const condition = createMockCondition('Test Condition');
//         expect(condition.toString()).toBe('Test Condition');
//     });
// });

// describe('ConditionStatistics', () => {
//     const createMockCondition = (conditionString: string, successRate: number = 0.5): BaseCondition => {
//         let evaluationCount = 0;
//         let successCount = 0;

//         const condition = {
//             evaluate: jest.fn().mockImplementation(() => {
//                 evaluationCount++;
//                 const success = Math.random() < successRate;
//                 if (success) {
//                     successCount++;
//                 }
//                 return success;
//             }),
//             requiredCards: jest.fn(),
//             toString: jest.fn().mockReturnValue(conditionString),
//             get successes() { return successCount; },
//         } as BaseCondition;

//         (condition as any).getEvaluationCount = () => evaluationCount;

//         return condition;
//     };

//     it('should correctly initialize with a simple condition', () => {
//         const mockCondition = createMockCondition('Simple Condition', 0.6);
//         const totalEvaluations = 100;
//         const stats = new ConditionStatistics(mockCondition, totalEvaluations);

//         expect(stats.condition).toBe(mockCondition);
//         expect(stats.totalEvaluations).toBe(totalEvaluations);
//         expect(stats.subConditionStats.size).toBe(0);
//     });

//     it('should correctly calculate success rate for a simple condition', () => {
//         const mockCondition = createMockCondition('Simple Condition', 0.7);
//         const totalEvaluations = 1000;

//         for (let i = 0; i < totalEvaluations; i++) {
//             mockCondition.evaluate({} as GameState);
//         }

//         const stats = new ConditionStatistics(mockCondition, totalEvaluations);
//         expect(stats.successRate).toBeCloseTo(0.7, 1);
//     });

//     it('should handle zero evaluations gracefully', () => {
//         const mockCondition = createMockCondition('Zero Eval Condition');
//         const stats = new ConditionStatistics(mockCondition, 0);
//         expect(stats.successRate).toBe(0);
//     });

//     it('should correctly build subcondition hierarchy for AND condition', () => {
//         const conditionA = createMockCondition('Condition A', 0.8);
//         const conditionB = createMockCondition('Condition B', 0.6);
//         const andCondition = new AndCondition([conditionA, conditionB]);
//         const totalEvaluations = 100;

//         const stats = new ConditionStatistics(andCondition, totalEvaluations);

//         expect(stats.subConditionStats.size).toBe(2);
//         expect(stats.subConditionStats.get('Condition A')).toBeDefined();
//         expect(stats.subConditionStats.get('Condition B')).toBeDefined();
//     });

//     it('should correctly build subcondition hierarchy for OR condition', () => {
//         const conditionA = createMockCondition('Condition A', 0.7);
//         const conditionB = createMockCondition('Condition B', 0.5);
//         const orCondition = new OrCondition([conditionA, conditionB]);
//         const totalEvaluations = 100;

//         const stats = new ConditionStatistics(orCondition, totalEvaluations);

//         expect(stats.subConditionStats.size).toBe(2);
//         expect(stats.subConditionStats.get('Condition A')).toBeDefined();
//         expect(stats.subConditionStats.get('Condition B')).toBeDefined();
//     });

//     it('should correctly calculate success rates for nested conditions', () => {
//         const conditionA = createMockCondition('Condition A', 0.8);
//         const conditionB = createMockCondition('Condition B', 0.6);
//         const conditionC = createMockCondition('Condition C', 0.7);
//         const nestedCondition = new AndCondition([
//             conditionA,
//             new OrCondition([conditionB, conditionC])
//         ]);
//         const totalEvaluations = 1000;

//         for (let i = 0; i < totalEvaluations; i++) {
//             nestedCondition.evaluate({} as GameState);
//         }

//         const stats = new ConditionStatistics(nestedCondition, totalEvaluations);

//         expect(stats.successRate).toBeGreaterThan(0);
//         expect(stats.successRate).toBeLessThanOrEqual(0.8); // Cannot exceed success rate of conditionA
//         expect(stats.subConditionStats.get('Condition A')!.successRate).toBeGreaterThan(0);
//         expect(stats.subConditionStats.get('Condition A')!.successRate).toBeLessThanOrEqual(1);
        
//         const orStats = stats.subConditionStats.get('(Condition B OR Condition C)');
//         expect(orStats).toBeDefined();
//         expect(orStats!.successRate).toBeGreaterThan(0);
//         expect(orStats!.successRate).toBeLessThanOrEqual(1);
        
//         expect(orStats!.subConditionStats.get('Condition B')!.successRate).toBeGreaterThan(0);
//         expect(orStats!.subConditionStats.get('Condition B')!.successRate).toBeLessThanOrEqual(1);
//         expect(orStats!.subConditionStats.get('Condition C')!.successRate).toBeGreaterThan(0);
//         expect(orStats!.subConditionStats.get('Condition C')!.successRate).toBeLessThanOrEqual(1);
//     });

//     it('should handle deeply nested conditions', () => {
//         const conditionA = createMockCondition('Condition A', 0.9);
//         const conditionB = createMockCondition('Condition B', 0.8);
//         const conditionC = createMockCondition('Condition C', 0.7);
//         const conditionD = createMockCondition('Condition D', 0.6);
//         const deeplyNestedCondition = new AndCondition([
//             conditionA,
//             new OrCondition([
//                 conditionB,
//                 new AndCondition([conditionC, conditionD])
//             ])
//         ]);
//         const totalEvaluations = 1000;

//         for (let i = 0; i < totalEvaluations; i++) {
//             deeplyNestedCondition.evaluate({} as GameState);
//         }

//         const stats = new ConditionStatistics(deeplyNestedCondition, totalEvaluations);

//         expect(stats.subConditionStats.size).toBe(2);
//         expect(stats.subConditionStats.get('Condition A')!.successRate).toBeGreaterThan(0);
//         expect(stats.subConditionStats.get('Condition A')!.successRate).toBeLessThanOrEqual(1);

//         const orStats = stats.subConditionStats.get('(Condition B OR (Condition C AND Condition D))');
//         expect(orStats).toBeDefined();
//         expect(orStats!.subConditionStats.size).toBe(2);
//         expect(orStats!.subConditionStats.get('Condition B')!.successRate).toBeGreaterThan(0);
//         expect(orStats!.subConditionStats.get('Condition B')!.successRate).toBeLessThanOrEqual(1);

//         const nestedAndStats = orStats!.subConditionStats.get('(Condition C AND Condition D)');
//         expect(nestedAndStats).toBeDefined();
//         expect(nestedAndStats!.subConditionStats.size).toBe(2);
        
//         expect(nestedAndStats!.subConditionStats.get('Condition C')!.successRate).toBeGreaterThan(0);
//         expect(nestedAndStats!.subConditionStats.get('Condition C')!.successRate).toBeLessThanOrEqual(1);
//         expect(nestedAndStats!.subConditionStats.get('Condition D')!.successRate).toBeGreaterThan(0);
//         expect(nestedAndStats!.subConditionStats.get('Condition D')!.successRate).toBeLessThanOrEqual(1);
//     });

//     it('should calculate success rates for OR conditions', () => {
//         const conditionA = createMockCondition('Condition A', 0.6);
//         const conditionB = createMockCondition('Condition B', 0.7);
//         const orCondition = new OrCondition([conditionA, conditionB]);
//         const totalEvaluations = 1000;

//         for (let i = 0; i < totalEvaluations; i++) {
//             orCondition.evaluate({} as GameState);
//         }

//         const stats = new ConditionStatistics(orCondition, totalEvaluations);

//         expect(stats.successRate).toBeGreaterThan(0);
//         expect(stats.successRate).toBeLessThanOrEqual(1);
//         expect(stats.subConditionStats.get('Condition A')!.successRate).toBeGreaterThan(0);
//         expect(stats.subConditionStats.get('Condition A')!.successRate).toBeLessThanOrEqual(1);
//         expect(stats.subConditionStats.get('Condition B')!.successRate).toBeGreaterThan(0);
//         expect(stats.subConditionStats.get('Condition B')!.successRate).toBeLessThanOrEqual(1);
//     });
// });
