import { Simulation } from '../src/simulation';
import { Card } from '../src/card';
import { Deck } from '../src/deck';
import { Condition, AndCondition } from '../src/condition';

describe('Simulation', () => {
    let testDeck: Deck;
    let testHand: Card[];
    let testCondition: Condition;

    beforeEach(() => {
        testDeck = new Deck([
            new Card('Card A', { tags: ['Tag1'] }),
            new Card('Card B', { tags: ['Tag2'] }),
            new Card('Card C', { tags: ['Tag3'] }),
        ]);
        testHand = [
            new Card('Card A', { tags: ['Tag1'] }),
            new Card('Card B', { tags: ['Tag2'] }),
        ];
        testCondition = new Condition('Card A');
    });

    test('should create a simulation with the correct properties', () => {
        const simulation = new Simulation(testDeck, testHand, testCondition);
        expect(simulation.deck).toBeInstanceOf(Deck);
        expect(simulation.deck).not.toBe(testDeck); // Should be a deep copy
        expect(simulation.result).toBe(false); // Initial result should be false
    });

    test('should run the simulation and update the result', () => {
        const simulation = new Simulation(testDeck, testHand, testCondition);
        simulation.run();
        expect(simulation.result).toBe(true);
    });

    test('should return the correct condition', () => {
        const simulation = new Simulation(testDeck, testHand, testCondition);
        expect(simulation.condition).toBe(testCondition);
    });

    test('should handle complex conditions', () => {
        const complexCondition = new AndCondition([
            new Condition('Card A'),
            new Condition('Card B'),
        ]);
        const simulation = new Simulation(testDeck, testHand, complexCondition);
        simulation.run();
        expect(simulation.result).toBe(true);
    });

    test('should handle empty hand', () => {
        const simulation = new Simulation(testDeck, [], testCondition);
        simulation.run();
        expect(simulation.result).toBe(false);
    });
});