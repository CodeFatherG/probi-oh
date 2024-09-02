import { Simulation, SimulationBranch, runSimulation } from '../src/utils/simulation';
import { GameState } from '../src/utils/game-state';
import { BaseCondition, Condition, AndCondition, OrCondition, evaluateCondition } from '../src/utils/condition';
import { Card, CreateCard, FreeCard } from '../src/utils/card';
import { freeCardIsUsable, processFreeCard } from '../src/utils/free-card-processor';
import { Deck } from '../src/utils/deck';

// Mock dependencies
jest.mock('../src/utils/game-state');
jest.mock('../src/utils/condition');
jest.mock('../src/utils/card', () => ({
    CreateCard: jest.fn(),
    FreeCard: jest.fn()
}));
jest.mock('../src/utils/free-card-processor');
jest.mock('../src/utils/deck');

describe('Simulation', () => {
    let mockGameState: jest.Mocked<GameState>;
    let mockCondition: jest.Mocked<BaseCondition>;
    let mockDeck: jest.Mocked<Deck>;
    let mockHand: Card[] = [];
    let mockCardsPlayedThisTurn: Card[] = [];

    beforeEach(() => {
        mockDeck = new Deck([]) as jest.Mocked<Deck>;
        mockGameState = new GameState(mockDeck) as jest.Mocked<GameState>;
        mockCondition = {
            requiredCards: jest.fn(),
            toString: jest.fn(),
            recordSuccess: jest.fn(),
            successes: 0
        } as unknown as jest.Mocked<BaseCondition>;
        
        // Mock GameState properties and methods
        mockGameState.deepCopy.mockReturnValue(mockGameState);
        
        // Mock the hand getter
        Object.defineProperty(mockGameState, 'hand', {
            get: jest.fn().mockImplementation(() => { return mockHand; })
        });

        // Mock other properties
        Object.defineProperty(mockGameState, 'freeCardsInHand', {
            get: jest.fn().mockImplementation(() => { return mockHand.filter(card => (card as FreeCard).isFree); })
        });
        Object.defineProperty(mockGameState, 'cardsPlayedThisTurn', {
            get: jest.fn().mockImplementation(() => { return mockCardsPlayedThisTurn; })
        });
        Object.defineProperty(mockGameState, 'freeCardsPlayedThisTurn', {
            get: jest.fn().mockImplementation(() => { return mockCardsPlayedThisTurn.filter(card => (card as FreeCard).isFree)})
        });
        (mockGameState.playCard as jest.Mock).mockImplementation((card: Card) => {
            mockCardsPlayedThisTurn.push(card);
            // remove card from hand
            mockHand = mockHand.filter(c => c !== card);
        });
        
        // Mock CreateCard function
        (CreateCard as jest.Mock).mockImplementation((name, details) => ({
            name,
            details,
            isFree: !!details.free
        }));

        // Mock evaluateCondition function
        (evaluateCondition as jest.Mock).mockImplementation(() => false);
    });

    test('constructor initializes correctly', () => {
        const simulation = new Simulation(mockGameState, [mockCondition]);
        expect(simulation.gameState).toBe(mockGameState);
        expect(simulation.conditions).toContain(mockCondition);
    });

    test('iterate runs a single branch when condition is met', () => {
        (evaluateCondition as jest.Mock).mockReturnValue(true);
        const simulation = new Simulation(mockGameState, [mockCondition]);
        simulation.iterate();
        expect(simulation.result).toBe(true);
        expect(simulation.branches.get(mockCondition)?.length).toBe(1);
        expect(simulation.successfulBranches[0][1]).toBeDefined();
    });

    test('iterate generates free card permutations when condition is not met', () => {
        (evaluateCondition as jest.Mock).mockReturnValue(false);
        const mockFreeCard1 = CreateCard('FreeCard1', { free: { oncePerTurn: false } }) as FreeCard;
        const mockFreeCard2 = CreateCard('FreeCard2', { free: { oncePerTurn: false } }) as FreeCard;
        mockHand = [mockFreeCard1, mockFreeCard2];
        
        // Update the mock getters
        (freeCardIsUsable as jest.Mock).mockReturnValue(true);

        const simulation = new Simulation(mockGameState, [mockCondition]);
        simulation.iterate();

        expect(simulation.branches.get(mockCondition)?.length).toBeGreaterThan(1);
    });

    test('successfulBranch returns the first successful branch', () => {
        (evaluateCondition as jest.Mock)
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true);
        const mockFreeCard = CreateCard('FreeCard', { free: { oncePerTurn: false } }) as FreeCard;
        mockHand = [mockFreeCard];
        // Update the mock getters
        (freeCardIsUsable as jest.Mock).mockReturnValue(true);

        const simulation = new Simulation(mockGameState, [mockCondition]);
        simulation.iterate();

        expect(simulation.successfulBranches[0][1]).toBeDefined();
        expect(simulation.successfulBranches[0][1]?.result).toBe(true);
    });

    // test('failedBranches returns all failed branches', () => {
    //     (evaluateCondition as jest.Mock).mockReturnValue(false);
    //     const mockFreeCard = CreateCard('FreeCard', { free: { oncePerTurn: false } }) as FreeCard;
    //     mockHand = [mockFreeCard];
    //     // Update the mock getters
    //     (freeCardIsUsable as jest.Mock).mockReturnValue(true);

    //     const simulation = new Simulation(mockGameState, [mockCondition]);
    //     simulation.iterate();

    //     expect(simulation.failedBranches.length).toBe(1);
    //     expect(simulation.failedBranches[0][0]).toBe(mockCondition);
    //     expect(Array.isArray(simulation.failedBranches[0][1])).toBe(true);
    //     expect(simulation.failedBranches[0][1]?.every(branch => !branch.result)).toBe(true);
    // });
});

describe('SimulationBranch', () => {
    let mockGameState: jest.Mocked<GameState>;
    let mockCondition: jest.Mocked<BaseCondition>;
    let mockDeck: jest.Mocked<Deck>;
    let mockHand: Card[] = [];
    let mockCardsPlayedThisTurn: Card[] = [];

    beforeEach(() => {
        mockDeck = new Deck([]) as jest.Mocked<Deck>;
        mockGameState = new GameState(mockDeck) as jest.Mocked<GameState>;
        mockCondition = {
            requiredCards: jest.fn(),
            toString: jest.fn(),
            recordSuccess: jest.fn(),
            successes: 0
        } as unknown as jest.Mocked<BaseCondition>;
        mockGameState.deepCopy.mockReturnValue(mockGameState);
        
        // Mock other properties
        Object.defineProperty(mockGameState, 'freeCardsInHand', {
            get: jest.fn().mockImplementation(() => { return mockHand.filter(card => (card as FreeCard).isFree); })
        });
        Object.defineProperty(mockGameState, 'cardsPlayedThisTurn', {
            get: jest.fn().mockImplementation(() => { return mockCardsPlayedThisTurn; })
        });
        Object.defineProperty(mockGameState, 'freeCardsPlayedThisTurn', {
            get: jest.fn().mockImplementation(() => { return mockCardsPlayedThisTurn.filter(card => (card as FreeCard).isFree)})
        });
        (mockGameState.playCard as jest.Mock).mockImplementation((card: Card) => {
            mockCardsPlayedThisTurn.push(card);
            // remove card from hand
            mockHand = mockHand.filter(c => c !== card);
        });

        // Mock evaluateCondition function
        (evaluateCondition as jest.Mock).mockImplementation(() => false);
    });

    test('constructor initializes correctly', () => {
        const branch = new SimulationBranch(mockGameState, mockCondition);
        expect(branch.gameState).toBe(mockGameState);
        expect(branch.condition).toBe(mockCondition);
        expect(branch.result).toBe(false);
    });

    test('run evaluates condition and updates result', () => {
        (evaluateCondition as jest.Mock).mockReturnValue(true);
        const branch = new SimulationBranch(mockGameState, mockCondition);
        branch.run();
        expect(branch.result).toBe(true);
        expect(evaluateCondition).toHaveBeenCalledWith(mockCondition, mockGameState);
    });
});

describe('runSimulation', () => {
    let mockHand: Card[] = [];
    let mockCardsPlayedThisTurn: Card[] = [];
    
    test('creates and runs a simulation', () => {
        const mockDeck = new Deck([]) as jest.Mocked<Deck>;
        const mockGameState = new GameState(mockDeck) as jest.Mocked<GameState>;
        const mockCondition = {
            requiredCards: jest.fn(),
            toString: jest.fn(),
            recordSuccess: jest.fn(),
            successes: 0
        } as unknown as jest.Mocked<BaseCondition>;
        mockGameState.deepCopy.mockReturnValue(mockGameState);
        
        // Mock other properties
        Object.defineProperty(mockGameState, 'freeCardsInHand', {
            get: jest.fn().mockImplementation(() => { return mockHand.filter(card => (card as FreeCard).isFree); })
        });
        Object.defineProperty(mockGameState, 'cardsPlayedThisTurn', {
            get: jest.fn().mockImplementation(() => { return mockCardsPlayedThisTurn; })
        });
        Object.defineProperty(mockGameState, 'freeCardsPlayedThisTurn', {
            get: jest.fn().mockImplementation(() => { return mockCardsPlayedThisTurn.filter(card => (card as FreeCard).isFree)})
        });
        (mockGameState.playCard as jest.Mock).mockImplementation((card: Card) => {
            mockCardsPlayedThisTurn.push(card);
            // remove card from hand
            mockHand = mockHand.filter(c => c !== card);
        });

        // Mock evaluateCondition function
        (evaluateCondition as jest.Mock).mockReturnValue(true);

        const result = runSimulation(mockGameState, [mockCondition]);

        expect(result).toBeInstanceOf(Simulation);
        expect(result.result).toBe(true);
        expect(result.branches.get(mockCondition)?.length).toBe(1);
    });
});