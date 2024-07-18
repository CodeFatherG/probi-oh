import { Simulation } from '../src/simulation';
import { Card, CreateCard } from '../src/card';
import { Deck } from '../src/deck';
import { Condition, AndCondition, OrCondition } from '../src/condition';
import { GameState } from '../src/game-state';

describe('Simulation', () => {
    let gameState: GameState;
    let testCondition: Condition;

    beforeEach(() => {
        const testDeck = new Deck([
            CreateCard('Card A', { qty: 10, tags: ['Tag1'] }),
            CreateCard('Card B', { qty: 10, tags: ['Tag2'] }),
            CreateCard('Card C', { qty: 10, tags: ['Tag3'] }),
            CreateCard('Card D', { qty: 10, tags: ['Tag4'] }),
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
                new Deck(Array.from({ length: 40 }, () => CreateCard("Card A", {})))
            ), testCondition);
        simulation.run();
        expect(simulation.result).toBe(true);
    });

    test('should return the correct condition', () => {
        const simulation = new Simulation(gameState, testCondition);
        expect(simulation.condition).toBe(testCondition);
    });

    test('should handle complex conditions', () => {
        const complexCondition = new OrCondition([
            new Condition('Card A'),
            new Condition('Card B'),
        ]);
        const simulation = new Simulation(new GameState(
            new Deck([
                ...Array.from({ length: 20 }, () => CreateCard("Card A", {})),
                ...Array.from({ length: 20 }, () => CreateCard("Card B", {}))
            ])
        ), complexCondition);
        simulation.run();
        expect(simulation.result).toBe(true);
    });
});