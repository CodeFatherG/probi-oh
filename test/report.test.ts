import { Report, CardStatistics, FreeCardStatistics, ConditionStatistics } from '../src/report';
import { Simulation, SimulationBranch } from '../src/simulation';
import { GameState } from '../src/game-state';
import { Deck } from '../src/deck';
import { AndCondition, BaseCondition, Condition, OrCondition } from '../src/condition';
import { CardDetails } from '../src/card-details';

// Define interfaces to match the structure of Card and FreeCard
interface IMockCard {
    name: string;
    nameLower: string;
    tags: readonly string[] | null;
    details: Readonly<CardDetails>;
    isFree: boolean;
}

interface IMockFreeCard extends IMockCard {
    count: number;
    oncePerTurn: boolean;
    restrictions: any[];
    cost: any;
    condition: any;
    excavate: any;
}

// Mock factories
const createMockCard = (name: string, tags: string[] = [], isFree: boolean = false): IMockCard => ({
    name,
    nameLower: name.toLowerCase(),
    tags,
    details: { tags },
    isFree,
});

const createMockFreeCard = (name: string, tags: string[] = []): IMockFreeCard => ({
    ...createMockCard(name, tags, true),
    count: 0,
    oncePerTurn: false,
    restrictions: [],
    cost: null,
    condition: null,
    excavate: null,
});

const createMockDeck = (cards: IMockCard[]): Deck => ({
    deckList: cards,
    deckCount: cards.length,
    drawCard: jest.fn(),
    shuffle: jest.fn(),
    deepCopy: jest.fn(),
    addToBottom: jest.fn(),
} as unknown as Deck);

const createMockGameState = (hand: IMockCard[], deck: IMockCard[], 
                            banishPile: IMockCard[] = [], graveyard: IMockCard[] = [],
                            freecardsUsed: IMockCard[] = []): GameState => ({
    hand,
    deck: createMockDeck(deck),
    banishPile,
    graveyard,
    freeCardsInHand: hand.filter(card => card.isFree) as IMockFreeCard[],
    cardsPlayedThisTurn: [],
    freeCardsPlayedThisTurn: freecardsUsed,
    drawHand: jest.fn(),
    playCard: jest.fn(),
    discardFromHand: jest.fn(),
    banishFromHand: jest.fn(),
    deepCopy: jest.fn(),
} as unknown as GameState);

const createMockSimulationBranch = (gameState: GameState, result: boolean): SimulationBranch => ({
    gameState,
    result,
    condition: {} as BaseCondition,
    run: jest.fn(),
} as unknown as SimulationBranch);

const createMockSimulation = (branches: SimulationBranch[], result: boolean): Simulation => ({
    branches,
    result,
    condition: {} as BaseCondition,
    gameState: branches[0].gameState,
    successfulBranch: result ? branches[branches.length - 1] : undefined,
    iterate: jest.fn(),
} as unknown as Simulation);

describe('Report', () => {
    let mockSimulations: Simulation[];

    beforeEach(() => {
        // Set up mock simulations
        const mockHand = [
            createMockCard('Card A', ['Tag1']),
            createMockCard('Card B', ['Tag2']),
            createMockFreeCard('Free Card', ['Tag3']),
        ];
        const mockDeck = [createMockCard('Card C', ['Tag1'])];
        const mockGameState = createMockGameState(mockHand, mockDeck);
        const mockBranch = createMockSimulationBranch(mockGameState, true);
        mockSimulations = [createMockSimulation([mockBranch], true)];
    });

    it('should initialize correctly', () => {
        const report = new Report(mockSimulations);
        expect(report.iterations).toBe(1);
        expect(report.successfulSimulations.length).toBe(1);
        expect(report.successRate).toBe(1);
        expect(report.successRatePercentage).toBe('100.00%');
    });

    it('should calculate card name statistics correctly', () => {
        const report = new Report(mockSimulations);
        const cardNameStats = report.cardNameStats;
        
        expect(cardNameStats.size).toBe(3);
        expect(cardNameStats.get('Card A')?.totalOccurrences).toBe(1);
        expect(cardNameStats.get('Card B')?.totalOccurrences).toBe(1);
        expect(cardNameStats.get('Free Card')?.totalOccurrences).toBe(1);
    });

    it('should calculate card tag statistics correctly', () => {
        const report = new Report(mockSimulations);
        const cardTagStats = report.cardTagStats;
        
        expect(cardTagStats.size).toBe(3);
        expect(cardTagStats.get('Tag1')?.totalOccurrences).toBe(1);
        expect(cardTagStats.get('Tag2')?.totalOccurrences).toBe(1);
        expect(cardTagStats.get('Tag3')?.totalOccurrences).toBe(1);
    });

    it('should identify free cards correctly', () => {
        const report = new Report(mockSimulations);
        const freeCardStats = report.freeCardStats;
        
        expect(freeCardStats.size).toBe(1);
        expect(freeCardStats.get('Free Card')?.totalOccurrences).toBe(1);
    });

    it('should process free cards correctly', () => {
        const initialHand = [
            createMockCard('Card A', ['Tag1']),
            createMockFreeCard('Free Card 1', ['Tag3']),
            createMockFreeCard('Free Card 2', ['Tag4']),
        ];
        const finalHand = [
            createMockCard('Card A', ['Tag1']),
            createMockCard('Card B', ['Tag2']),
            createMockFreeCard('Free Card 2', ['Tag4']),
        ];
        const initialGameState = createMockGameState(initialHand, []);
        // final game state uses the free card 1 but not free card 2
        const finalGameState = createMockGameState(finalHand, [], [], [], [createMockFreeCard('Free Card 1', ['Tag3'])]);
        
        const initialBranch = createMockSimulationBranch(initialGameState, false);
        const successfulBranch = createMockSimulationBranch(finalGameState, true);
        const mockSimulation = createMockSimulation([initialBranch, successfulBranch], true);

        const report = new Report([mockSimulation]);

        const freeCardStats = report.freeCardStats;
        expect(freeCardStats.size).toBe(2);
        expect(freeCardStats.get('Free Card 1')?.totalOccurrences).toBe(1);
        expect(freeCardStats.get('Free Card 1')?.activationRate).toBe(1);
        expect(freeCardStats.get('Free Card 1')?.failedToSuccessRate).toBe(1);
        expect(freeCardStats.get('Free Card 2')?.totalOccurrences).toBe(1);
        expect(freeCardStats.get('Free Card 2')?.activationRate).toBe(0);
    });

    it('should process banished cards correctly', () => {
        const initialHand = [createMockCard('Card A', ['Tag1'])];
        const finalHand = [createMockCard('Card B', ['Tag2'])];
        const banishedCards = [createMockCard('Banished Card', ['Tag3'])];
        
        const initialGameState = createMockGameState(initialHand, []);
        const finalGameState = createMockGameState(finalHand, [], banishedCards);
        
        const initialBranch = createMockSimulationBranch(initialGameState, false);
        const successfulBranch = createMockSimulationBranch(finalGameState, true);
        const mockSimulation = createMockSimulation([initialBranch, successfulBranch], true);

        const report = new Report([mockSimulation]);

        const banishedCardNameStats = report.banishedCardNameStats;
        const banishedCardTagStats = report.banishedCardTagStats;
        
        expect(banishedCardNameStats.size).toBe(1);
        expect(banishedCardNameStats.get('Banished Card')?.totalOccurrences).toBe(1);
        expect(banishedCardTagStats.size).toBe(1);
        expect(banishedCardTagStats.get('Tag3')?.totalOccurrences).toBe(1);
    });

    it('should calculate success rate correctly', () => {
        const successfulSimulation = createMockSimulation([createMockSimulationBranch(createMockGameState([], []), true)], true);
        const failedSimulation = createMockSimulation([createMockSimulationBranch(createMockGameState([], []), false)], false);
        
        const report = new Report([successfulSimulation, failedSimulation]);

        expect(report.iterations).toBe(2);
        expect(report.successfulSimulations.length).toBe(1);
        expect(report.successRate).toBe(0.5);
        expect(report.successRatePercentage).toBe('50.00%');
    });
});

describe('CardStatistics', () => {
    let cardStats: CardStatistics;

    beforeEach(() => {
        cardStats = new CardStatistics('Test Card');
    });

    it('should initialize with the correct name', () => {
        expect(cardStats.name).toBe('Test Card');
    });

    it('should correctly increment count when addCount is called', () => {
        cardStats.addCount(1);
        cardStats.addCount(2);
        cardStats.addCount(1);

        expect(cardStats.totalOccurrences).toBe(3);
    });

    it('should return the correct total occurrences', () => {
        cardStats.addCount(1);
        cardStats.addCount(2);
        cardStats.addCount(3);

        expect(cardStats.totalOccurrences).toBe(3);
    });

    it('should calculate the average count correctly', () => {
        cardStats.addCount(1);
        cardStats.addCount(2);
        cardStats.addCount(3);

        expect(cardStats.averageCount).toBe(2);
    });

    it('should return the correct count distribution', () => {
        cardStats.addCount(1);
        cardStats.addCount(2);
        cardStats.addCount(1);

        const distribution = cardStats.getCountDistribution();
        expect(distribution).toEqual([
            { count: 1, occurrences: 2 },
            { count: 2, occurrences: 1 }
        ]);
    });

    it('should handle empty statistics correctly', () => {
        expect(cardStats.totalOccurrences).toBe(0);
        expect(cardStats.averageCount).toBe(0);
        expect(cardStats.getCountDistribution()).toEqual([]);
    });
});

describe('FreeCardStatistics', () => {
    let freeCardStats: FreeCardStatistics;

    beforeEach(() => {
        freeCardStats = new FreeCardStatistics('Test Free Card');
    });

    it('should initialize with the correct name', () => {
        expect(freeCardStats.name).toBe('Test Free Card');
    });

    it('should correctly track successful activations', () => {
        freeCardStats.addCount(1);
        freeCardStats.addSuccessfulActivation();
        freeCardStats.addCount(1);
        freeCardStats.addSuccessfulActivation();

        expect(freeCardStats.totalOccurrences).toBe(2);
        expect(freeCardStats.activationRate).toBe(1);
    });

    it('should correctly track failed to success count', () => {
        freeCardStats.addCount(1);
        freeCardStats.addFailedToSuccess();
        freeCardStats.addCount(1);

        expect(freeCardStats.totalOccurrences).toBe(2);
        expect(freeCardStats.failedToSuccessRate).toBe(0.5);
    });

    it('should calculate activation rate correctly', () => {
        freeCardStats.addCount(1);
        freeCardStats.addSuccessfulActivation();
        freeCardStats.addCount(1);

        expect(freeCardStats.activationRate).toBe(0.5);
    });

    it('should calculate failed to success rate correctly', () => {
        freeCardStats.addCount(1);
        freeCardStats.addFailedToSuccess();
        freeCardStats.addCount(1);
        freeCardStats.addFailedToSuccess();
        freeCardStats.addCount(1);

        expect(freeCardStats.failedToSuccessRate).toBe(2/3);
    });

    it('should handle no activations correctly', () => {
        freeCardStats.addCount(1);
        freeCardStats.addCount(1);

        expect(freeCardStats.activationRate).toBe(0);
        expect(freeCardStats.failedToSuccessRate).toBe(0);
    });

    it('should inherit CardStatistics behavior', () => {
        freeCardStats.addCount(1);
        freeCardStats.addCount(2);
        freeCardStats.addCount(3);

        expect(freeCardStats.totalOccurrences).toBe(3);
        expect(freeCardStats.averageCount).toBe(2);
        expect(freeCardStats.getCountDistribution()).toEqual([
            { count: 1, occurrences: 1 },
            { count: 2, occurrences: 1 },
            { count: 3, occurrences: 1 }
        ]);
    });
});

describe('ConditionStatistics', () => {
    let mockCondition: BaseCondition;

    beforeEach(() => {
        mockCondition = {
            evaluate: jest.fn(),
            requiredCards: jest.fn(),
            successes: 0
        };
    });

    it('should initialize correctly', () => {
        const stats = new ConditionStatistics(mockCondition);
        expect(stats.condition).toBe(mockCondition);
        expect(stats.successRate).toBe(0);
    });

    it('should update evaluations correctly', () => {
        const stats = new ConditionStatistics(mockCondition);
        stats.addEvaluation();
        stats.addEvaluation();
        expect(stats.successRate).toBe(0);

        Object.defineProperty(mockCondition, 'successes', { value: 1 });
        expect(stats.successRate).toBe(0.5);
    });

    it('should handle sub-conditions', () => {
        const stats = new ConditionStatistics(mockCondition);
        const subCondition1 = new Condition('Card A', 2, '>=');
        const subCondition2 = new Condition('Card B', 1, '=');

        stats.addSubConditionStats(subCondition1);
        stats.addSubConditionStats(subCondition2);

        const subStats = stats.getSubConditionStats();
        expect(subStats.size).toBe(2);
        expect(subStats.get('2>= Card A')).toBeDefined();
        expect(subStats.get('1= Card B')).toBeDefined();
    });
});

describe('ConditionStatistics', () => {
    let mockCondition: BaseCondition;

    beforeEach(() => {
        mockCondition = {
            evaluate: jest.fn(),
            requiredCards: jest.fn(),
            successes: 0
        };
    });

    it('should initialize correctly', () => {
        const stats = new ConditionStatistics(mockCondition);
        expect(stats.condition).toBe(mockCondition);
        expect(stats.successRate).toBe(0);
    });

    it('should update evaluations correctly', () => {
        const stats = new ConditionStatistics(mockCondition);
        stats.addEvaluation();
        stats.addEvaluation();
        expect(stats.successRate).toBe(0);

        Object.defineProperty(mockCondition, 'successes', { value: 1 });
        expect(stats.successRate).toBe(0.5);
    });

    it('should handle sub-conditions', () => {
        const stats = new ConditionStatistics(mockCondition);
        const subCondition1 = new Condition('Card A', 2, '>=');
        const subCondition2 = new Condition('Card B', 1, '=');

        stats.addSubConditionStats(subCondition1);
        stats.addSubConditionStats(subCondition2);

        const subStats = stats.getSubConditionStats();
        expect(subStats.size).toBe(2);
        expect(subStats.get('2>= Card A')).toBeDefined();
        expect(subStats.get('1= Card B')).toBeDefined();
    });
});

describe('Report with Condition Statistics', () => {
    let mockSimulations: Simulation[];
    let mockCondition: AndCondition;

    beforeEach(() => {
        mockCondition = new AndCondition([
            new Condition('Card A', 2, '>='),
            new OrCondition([
                new Condition('Card B', 1, '='),
                new Condition('Card C', 3, '<=')
            ])
        ]);

        const mockHand = [
            createMockCard('Card A', ['Tag1']),
            createMockCard('Card B', ['Tag2']),
            createMockFreeCard('Free Card', ['Tag3']),
        ];
        const mockDeck = [createMockCard('Card C', ['Tag1'])];
        const mockGameState = createMockGameState(mockHand, mockDeck);
        const mockBranch = createMockSimulationBranch(mockGameState, true);
        mockSimulations = [createMockSimulation([mockBranch], true)];

        // Set up mock successes
        Object.defineProperty(mockCondition, 'successes', { value: 1 });
        Object.defineProperty(mockCondition.conditions[0], 'successes', { value: 1 });
        Object.defineProperty(mockCondition.conditions[1], 'successes', { value: 1 });
        Object.defineProperty((mockCondition.conditions[1] as OrCondition).conditions[0], 'successes', { value: 1 });
        Object.defineProperty((mockCondition.conditions[1] as OrCondition).conditions[1], 'successes', { value: 0 });

        // Assign the mock condition to the simulation
        Object.defineProperty(mockSimulations[0], 'condition', { value: mockCondition, writable: true });
    });

    it('should process condition statistics correctly', () => {
        const report = new Report(mockSimulations);
        const conditionStats = report.conditionStats;

        expect(conditionStats.size).toBe(5); // AND, OR, and 3 individual conditions
        expect(conditionStats.get('AND')).toBeDefined();
        expect(conditionStats.get('OR')).toBeDefined();
        expect(conditionStats.get('2>= Card A')).toBeDefined();
        expect(conditionStats.get('1= Card B')).toBeDefined();
        expect(conditionStats.get('3<= Card C')).toBeDefined();
    });

    it('should calculate success rates correctly', () => {
        const report = new Report(mockSimulations);
        const conditionStats = report.conditionStats;

        expect(conditionStats.get('AND')?.successRate).toBe(1);
        expect(conditionStats.get('OR')?.successRate).toBe(1);
        expect(conditionStats.get('2>= Card A')?.successRate).toBe(1);
        expect(conditionStats.get('1= Card B')?.successRate).toBe(1);
        expect(conditionStats.get('3<= Card C')?.successRate).toBe(0);
    });

    it('should handle nested conditions correctly', () => {
        const report = new Report(mockSimulations);
        const conditionStats = report.conditionStats;

        const andStats = conditionStats.get('AND');
        expect(andStats).toBeDefined();
        expect(andStats?.getSubConditionStats().size).toBe(2);

        const orStats = conditionStats.get('OR');
        expect(orStats).toBeDefined();
        expect(orStats?.getSubConditionStats().size).toBe(2);
    });
});

describe('Report Integration', () => {
    it('should integrate condition statistics with other report features', () => {
        const mockCondition = new AndCondition([
            new Condition('Card A', 2, '>='),
            new OrCondition([
                new Condition('Card B', 1, '='),
                new Condition('Free Card', 1, '>=')
            ])
        ]);

        const mockHand = [
            createMockCard('Card A', ['Tag1']),
            createMockCard('Card A', ['Tag1']),
            createMockCard('Card B', ['Tag2']),
            createMockFreeCard('Free Card', ['Tag3']),
        ];
        const mockDeck = [createMockCard('Card C', ['Tag1'])];
        const mockGameState = createMockGameState(mockHand, mockDeck);
        const mockBranch = createMockSimulationBranch(mockGameState, true);
        const mockSimulation = createMockSimulation([mockBranch], true);
        Object.defineProperty(mockSimulation, 'condition', { value: mockCondition, writable: true });

        // Set up mock successes
        Object.defineProperty(mockCondition, 'successes', { value: 1 });
        Object.defineProperty(mockCondition.conditions[0], 'successes', { value: 1 });
        Object.defineProperty(mockCondition.conditions[1], 'successes', { value: 1 });
        Object.defineProperty((mockCondition.conditions[1] as OrCondition).conditions[0], 'successes', { value: 1 });
        Object.defineProperty((mockCondition.conditions[1] as OrCondition).conditions[1], 'successes', { value: 1 });

        const report = new Report([mockSimulation]);

        // Check condition statistics
        expect(report.conditionStats.size).toBe(5);
        expect(report.conditionStats.get('AND')?.successRate).toBe(1);
        expect(report.conditionStats.get('OR')?.successRate).toBe(1);
        expect(report.conditionStats.get('2>= Card A')?.successRate).toBe(1);
        expect(report.conditionStats.get('1= Card B')?.successRate).toBe(1);
        expect(report.conditionStats.get('1>= Free Card')?.successRate).toBe(1);

        // Check other report features
        expect(report.cardNameStats.get('Card A')?.totalOccurrences).toBe(2);
        expect(report.cardNameStats.get('Card B')?.totalOccurrences).toBe(1);
        expect(report.cardNameStats.get('Free Card')?.totalOccurrences).toBe(1);
        expect(report.freeCardStats.get('Free Card')).toBeDefined();
        expect(report.successRate).toBe(1);
    });
});

