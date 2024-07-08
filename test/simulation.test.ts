import { Simulation } from '../src/simulation';
import { Card } from '../src/card';
import { Deck } from '../src/deck';
import { Condition, AndCondition } from '../src/condition';
import { GameState } from '../src/game-state';

describe('Simulation', () => {
    let gameState: GameState;
    let testCondition: Condition;

    beforeEach(() => {
        const testDeck = new Deck([
            new Card('Card A', { qty: 10, tags: ['Tag1'] }),
            new Card('Card B', { qty: 10, tags: ['Tag2'] }),
            new Card('Card C', { qty: 10, tags: ['Tag3'] }),
            new Card('Card D', { qty: 10, tags: ['Tag4'] }),
        ]);
        gameState = new GameState(testDeck);
        testCondition = new Condition('Card A');
    });

    test('should create a simulation with the correct properties', () => {
        const simulation = new Simulation(gameState, testCondition);
        expect(simulation.gameState).toBeInstanceOf(GameState);
        expect(simulation.gameState).not.toBe(gameState); // Should be a deep copy
        expect(simulation.result).toBe(false); // Initial result should be false
    });

    test('should run the simulation and update the result', () => {
        const simulation = new Simulation(
            new GameState(
                new Deck(Array.from({ length: 40 }, () => new Card("Card A", {})))
            ), testCondition);
        simulation.run();
        expect(simulation.result).toBe(true);
    });

    test('should return the correct condition', () => {
        const simulation = new Simulation(gameState, testCondition);
        expect(simulation.condition).toBe(testCondition);
    });

    test('should handle complex conditions', () => {
        const complexCondition = new AndCondition([
            new Condition('Card A'),
            new Condition('Card B'),
        ]);
        const simulation = new Simulation(new GameState(
            new Deck([
                ...Array.from({ length: 20 }, () => new Card("Card A", {})),
                ...Array.from({ length: 20 }, () => new Card("Card B", {}))
            ])
        ), complexCondition);
        simulation.run();
        expect(simulation.result).toBe(true);
    });
});