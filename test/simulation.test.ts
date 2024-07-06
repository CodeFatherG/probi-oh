import { Simulation } from '../src/simulation';
import { Card } from '../src/card';
import { Deck } from '../src/deck';
import { Condition, AndCondition, OrCondition } from '../src/condition';

describe('Simulation', () => {
    let testDeck: Deck;
    let testHand: Card[];
    
    beforeEach(() => {
        // Create a test deck
        testDeck = new Deck([
        new Card('Card A', { tags: ['Tag1'] }),
        new Card('Card B', { tags: ['Tag2'] }),
        new Card('Card C', { tags: ['Tag3'] }),
        new Card('Card D', { tags: ['Tag1', 'Tag2'] }),
        new Card('Card E', { tags: ['Tag2', 'Tag3'] }),
        ]);

        // Create a test hand
        testHand = [
        new Card('Card A', { tags: ['Tag1'] }),
        new Card('Card B', { tags: ['Tag2'] }),
        new Card('Card C', { tags: ['Tag3'] }),
        ];
    });

    test('should create a simulation with deep copies', () => {
        const condition = new Condition('Card A');
        const simulation = new Simulation(testDeck, testHand, condition);

        expect(simulation.deck).not.toBe(testDeck);
        expect(simulation.deck.deckCount).toBe(testDeck.deckCount);
        expect(simulation.result).toBe(false); // Result should be false before running
    });

    test('should evaluate a simple condition correctly', () => {
        const condition = new Condition('Card A');
        const simulation = new Simulation(testDeck, testHand, condition);

        simulation.run();

        expect(simulation.result).toBe(true);
    });

    test('should evaluate an AND condition correctly', () => {
        const condition1 = new Condition('Card A');
        const condition2 = new Condition('Card B');
        const andCondition = new AndCondition([condition1, condition2]);
        const simulation = new Simulation(testDeck, testHand, andCondition);

        simulation.run();

        expect(simulation.result).toBe(true);
    });

    test('should evaluate an OR condition correctly', () => {
        const condition1 = new Condition('Card A');
        const condition2 = new Condition('Card X'); // Not in hand
        const orCondition = new OrCondition([condition1, condition2]);
        const simulation = new Simulation(testDeck, testHand, orCondition);

        simulation.run();

        expect(simulation.result).toBe(true);
    });

    test('should evaluate a complex condition correctly', () => {
        const condition1 = new Condition('Card A');
        const condition2 = new Condition('Tag2');
        const condition3 = new Condition('Card X'); // Not in hand
        const complexCondition = new AndCondition([
        condition1,
        new OrCondition([condition2, condition3])
        ]);
        const simulation = new Simulation(testDeck, testHand, complexCondition);

        simulation.run();

        expect(simulation.result).toBe(true);
    });

    test('should fail when condition is not met', () => {
        const condition = new Condition('Card X'); // Not in hand
        const simulation = new Simulation(testDeck, testHand, condition);

        simulation.run();

        expect(simulation.result).toBe(false);
    });

    test('should not modify original deck or hand', () => {
        const originalDeckCount = testDeck.deckCount;
        const originalHandLength = testHand.length;
        const condition = new Condition('Card A');
        const simulation = new Simulation(testDeck, testHand, condition);

        simulation.run();

        expect(testDeck.deckCount).toBe(originalDeckCount);
        expect(testHand.length).toBe(originalHandLength);
    });
});