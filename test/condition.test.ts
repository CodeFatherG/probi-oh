import { Card, CreateCard } from '../src/card';
import { Condition, AndCondition, OrCondition } from '../src/condition';
import { Deck } from '../src/deck';
import { GameState } from '../src/game-state';

describe('Condition', () => {
    let testCards: Card[];
    let testDeck: Card[];
    let mockGameState: jest.Mocked<GameState>;
    let mockDeck: jest.Mocked<Deck>;

    beforeEach(() => {
        mockDeck = new Deck([]) as jest.Mocked<Deck>;
        mockGameState = new GameState(mockDeck) as jest.Mocked<GameState>;
        testCards = [
        CreateCard('Card A', { tags: ['Tag1'] }),
        CreateCard('Card B', { tags: ['Tag2'] }),
        CreateCard('Card C', { tags: ['Tag1', 'Tag3'] }),
        ];
        testDeck = [...Array(40 - testCards.length)].map(i => CreateCard(`Deck Card ${i}`, {}));
    
        // Mock GameState properties and methods
        mockGameState.deepCopy = jest.fn().mockReturnValue(mockGameState);
        
        // Mock the hand getter
        Object.defineProperty(mockGameState, 'hand', {
            get: jest.fn().mockImplementation(() => { return testCards; })
        });
    
        Object.defineProperty(mockDeck, 'deckList', {
            get: jest.fn().mockImplementation(() => { return testDeck; })
        });
    });

    test('should evaluate correctly for card name', () => {
        const condition = new Condition('Card A');
        expect(condition.evaluate(mockGameState)).toBe(true);
        expect(condition.successes).toBe(1);
    });

    test('should evaluate correctly for tag', () => {
        const condition = new Condition('Tag2');
        expect(condition.evaluate(mockGameState)).toBe(true);
        expect(condition.successes).toBe(1);
    });

    test('should evaluate correctly with quantity', () => {
        const condition = new Condition('Tag1', 2, '>=');
        expect(condition.evaluate(mockGameState)).toBe(true);
        expect(condition.successes).toBe(1);
    });

    test('should evaluate correctly with different operators', () => {
        const equalCondition = new Condition('Tag1', 2, '=');
        expect(equalCondition.evaluate(mockGameState)).toBe(true);

        const lessEqualCondition = new Condition('Tag3', 1, '<=');
        expect(lessEqualCondition.evaluate(mockGameState)).toBe(true);
    });

    test('should throw error for unknown operator', () => {
        const invalidCondition = new Condition('Card A', 1, '>' as any);
        expect(() => invalidCondition.evaluate(mockGameState)).toThrow('Unknown operator: >');
    });
    
    test('should evaluate correctly with quantity and <= operator', () => {
        const condition = new Condition('Tag1', 2, '<=');
        testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag1'] }),
            CreateCard('Card C', { tags: ['Tag1'] }),
        ];
        expect(condition.evaluate(mockGameState)).toBe(false);
        expect(condition.successes).toBe(0);
    });

    test('should evaluate correctly with exact quantity', () => {
        const condition = new Condition('Tag2', 2, '=');
        testCards = [
            CreateCard('Card A', { tags: ['Tag2'] }),
            CreateCard('Card B', { tags: ['Tag2'] }),
        ];
        expect(condition.evaluate(mockGameState)).toBe(true);
        expect(condition.successes).toBe(1);
    });

    test('should handle cards with multiple tags', () => {
        const condition = new Condition('Tag3', 2, '>=');
        testCards = [
            CreateCard('Card A', { tags: ['Tag1', 'Tag3'] }),
            CreateCard('Card B', { tags: ['Tag2', 'Tag3'] }),
            CreateCard('Card C', { tags: ['Tag3', 'Tag4'] }),
        ];
        expect(condition.evaluate(mockGameState)).toBe(true);
        expect(condition.successes).toBe(1);
    });

    it('should evaluate greater than or equal correctly', () => {
        const condition = new Condition('Test Card', 2, '>=');
        testCards = [CreateCard('Test Card', {}), CreateCard('Test Card', {})];
        expect(condition.evaluate(mockGameState)).toBe(true);
        testCards = [CreateCard('Test Card', {})];
        expect(condition.evaluate(mockGameState)).toBe(false);
    });

    it('should evaluate less than or equal correctly', () => {
        const condition = new Condition('Test Card', 2, '<=');
        testCards = [CreateCard('Test Card', {})];
        expect(condition.evaluate(mockGameState)).toBe(true);
        testCards = [CreateCard('Test Card', {}), CreateCard('Test Card', {}), CreateCard('Test Card', {})];
        expect(condition.evaluate(mockGameState)).toBe(false);
    });

    it('should evaluate equal correctly', () => {
        const condition = new Condition('Test Card', 2, '=');
        testCards = [CreateCard('Test Card', {}), CreateCard('Test Card', {})];
        expect(condition.evaluate(mockGameState)).toBe(true);
        testCards = [CreateCard('Test Card', {})];
        expect(condition.evaluate(mockGameState)).toBe(false);
        testCards = [CreateCard('Test Card', {}), CreateCard('Test Card', {}), CreateCard('Test Card', {})];
        expect(condition.evaluate(mockGameState)).toBe(false);
    });

    it('should handle card tags', () => {
        const condition = new Condition('TestTag', 1, '>=');
        testCards = [CreateCard('Different Card', { tags: ['TestTag'] })];
        expect(condition.evaluate(mockGameState)).toBe(true);
        testCards = [CreateCard('Different Card', { tags: ['OtherTag'] })];
        expect(condition.evaluate(mockGameState)).toBe(false);
    });

    it ('should only pick one required card', () => {
        const condition = new Condition('TestTag', 1, '>=');
        const requiredCards = condition.requiredCards([CreateCard('Different Card', { tags: ['TestTag'] }), CreateCard('Different Card', { tags: ['TestTag'] })]);

        expect(requiredCards.length).toBe(1);
    });

    it ('should pick all required card', () => {
        const condition = new Condition('TestTag', 2, '=');
        const requiredCards = condition.requiredCards([CreateCard('Different Card', { tags: ['TestTag'] }), CreateCard('Different Card', { tags: ['TestTag'] })]);

        expect(requiredCards.length).toBe(2);
    });
});

describe('AndCondition', () => {
    let testCards: Card[];
    let testDeck: Card[];
    let mockGameState: jest.Mocked<GameState>;
    let mockDeck: jest.Mocked<Deck>;

    beforeEach(() => {
        mockDeck = new Deck([]) as jest.Mocked<Deck>;
        mockGameState = new GameState(mockDeck) as jest.Mocked<GameState>;
        testCards = [];
        testDeck = [...Array(40 - testCards.length)].map(i => CreateCard(`Deck Card ${i}`, {}));

        // Mock GameState properties and methods
        mockGameState.deepCopy = jest.fn().mockReturnValue(mockGameState);
        
        // Mock the hand getter
        Object.defineProperty(mockGameState, 'hand', {
            get: jest.fn().mockImplementation(() => { return testCards; })
        });

        Object.defineProperty(mockDeck, 'deckList', {
            get: jest.fn().mockImplementation(() => { return testDeck; })
        });
    });

    test('should evaluate correctly', () => {
        const condition1 = new Condition('Card A');
        const condition2 = new Condition('Tag2');
        const andCondition = new AndCondition([condition1, condition2]);

        testCards = [
        CreateCard('Card A', { tags: ['Tag1'] }),
        CreateCard('Card B', { tags: ['Tag2'] }),
        ];

        expect(andCondition.evaluate(mockGameState)).toBe(true);
        expect(andCondition.successes).toBe(1);
    });

    test('should fail if one condition fails', () => {
        const condition1 = new Condition('Card A');
        const condition2 = new Condition('Card C');
        const andCondition = new AndCondition([condition1, condition2]);

        testCards = [
        CreateCard('Card A', { tags: ['Tag1'] }),
        CreateCard('Card B', { tags: ['Tag2'] }),
        ];

        expect(andCondition.evaluate(mockGameState)).toBe(false);
        expect(andCondition.successes).toBe(0);
    });

    test('should evaluate correctly with multiple conditions', () => {
        const condition1 = new Condition('Tag1', 2, '>=');
        const condition2 = new Condition('Tag2', 1, '=');
        const condition3 = new Condition('Card C');
        const andCondition = new AndCondition([condition1, condition2, condition3]);

        testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag1', 'Tag2'] }),
            CreateCard('Card C', { tags: ['Tag3'] }),
        ];

        expect(andCondition.evaluate(mockGameState)).toBe(true);
        expect(andCondition.successes).toBe(1);
    });

    test('should fail if any condition fails', () => {
        const condition1 = new Condition('Tag1', 2, '>=');
        const condition2 = new Condition('Tag2', 2, '=');
        const andCondition = new AndCondition([condition1, condition2]);

        testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag1', 'Tag2'] }),
        ];

        expect(andCondition.evaluate(mockGameState)).toBe(false);
        expect(andCondition.successes).toBe(0);
    });

    test('should log error for undefined condition in AndCondition', () => {
        const condition1 = new Condition('Tag1');
        const condition2 = undefined;
        console.error = jest.fn(); // Mock console.error
        new AndCondition([condition1, condition2 as any]);
        expect(console.error).toHaveBeenCalledWith('Found a dead condition');
    });
});

describe('OrCondition', () => {
    let testCards: Card[];
    let testDeck: Card[];
    let mockGameState: jest.Mocked<GameState>;
    let mockDeck: jest.Mocked<Deck>;

    beforeEach(() => {
        mockDeck = new Deck([]) as jest.Mocked<Deck>;
        mockGameState = new GameState(mockDeck) as jest.Mocked<GameState>;
        testCards = [];
        testDeck = [...Array(40 - testCards.length)].map(i => CreateCard(`Deck Card ${i}`, {}));

        // Mock GameState properties and methods
        mockGameState.deepCopy = jest.fn().mockReturnValue(mockGameState);
        
        // Mock the hand getter
        Object.defineProperty(mockGameState, 'hand', {
            get: jest.fn().mockImplementation(() => { return testCards; })
        });

        Object.defineProperty(mockDeck, 'deckList', {
            get: jest.fn().mockImplementation(() => { return testDeck; })
        });
    });

    test('should evaluate correctly', () => {
        const condition1 = new Condition('Card A');
        const condition2 = new Condition('Card C');
        const orCondition = new OrCondition([condition1, condition2]);

        testCards = [
        CreateCard('Card A', { tags: ['Tag1'] }),
        CreateCard('Card B', { tags: ['Tag2'] }),
        ];

        expect(orCondition.evaluate(mockGameState)).toBe(true);
        expect(orCondition.successes).toBe(1);
    });

    test('should fail if all conditions fail', () => {
        const condition1 = new Condition('Card C');
        const condition2 = new Condition('Card D');
        const orCondition = new OrCondition([condition1, condition2]);

        testCards = [
        CreateCard('Card A', { tags: ['Tag1'] }),
        CreateCard('Card B', { tags: ['Tag2'] }),
        ];

        expect(orCondition.evaluate(mockGameState)).toBe(false);
        expect(orCondition.successes).toBe(0);
    });

    test('should evaluate correctly with multiple conditions', () => {
        const condition1 = new Condition('Tag1', 3, '>=');
        const condition2 = new Condition('Tag2', 1, '=');
        const condition3 = new Condition('Card D');
        const orCondition = new OrCondition([condition1, condition2, condition3]);

        testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag2'] }),
        ];

        expect(orCondition.evaluate(mockGameState)).toBe(true);
        expect(orCondition.successes).toBe(1);
    });

    test('should pass if any condition passes', () => {
        const condition1 = new Condition('Tag1', 3, '>=');
        const condition2 = new Condition('Tag2', 1, '=');
        const condition3 = new Condition('Card C');
        const orCondition = new OrCondition([condition1, condition2, condition3]);

        testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag1'] }),
            CreateCard('Card C', { tags: ['Tag3'] }),
        ];

        expect(orCondition.evaluate(mockGameState)).toBe(true);
        expect(orCondition.successes).toBe(1);
    });

    test('should log error for undefined condition in AndCondition', () => {
        const condition1 = new Condition('Tag1');
        const condition2 = undefined;
        console.error = jest.fn(); // Mock console.error
        new OrCondition([condition1, condition2 as any]);
        expect(console.error).toHaveBeenCalledWith('Found a dead condition');
    });
});

describe('Complex nested conditions', () => {
    let testCards: Card[];
    let testDeck: Card[];
    let mockGameState: jest.Mocked<GameState>;
    let mockDeck: jest.Mocked<Deck>;

    beforeEach(() => {
        mockDeck = new Deck([]) as jest.Mocked<Deck>;
        mockGameState = new GameState(mockDeck) as jest.Mocked<GameState>;
        testCards = [];
        testDeck = [...Array(40 - testCards.length)].map(i => CreateCard(`Deck Card ${i}`, {}));

        // Mock GameState properties and methods
        mockGameState.deepCopy = jest.fn().mockReturnValue(mockGameState);
        
        // Mock the hand getter
        Object.defineProperty(mockGameState, 'hand', {
            get: jest.fn().mockImplementation(() => { return testCards; })
        });

        Object.defineProperty(mockDeck, 'deckList', {
            get: jest.fn().mockImplementation(() => { return testDeck; })
        });
    });
    
    test('should evaluate a complex nested condition correctly', () => {
        const condition1 = new Condition('Tag1', 2, '>=');
        const condition2 = new Condition('Tag2', 1, '=');
        const condition3 = new Condition('Card C');
        const condition4 = new Condition('Tag3', 1, '>=');

        const nestedAnd = new AndCondition([condition1, condition2]);
        const nestedOr = new OrCondition([condition3, condition4]);
        const complexCondition = new AndCondition([nestedAnd, nestedOr]);

        testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag1', 'Tag2'] }),
            CreateCard('Card D', { tags: ['Tag3'] }),
        ];

        expect(complexCondition.evaluate(mockGameState)).toBe(true);
        expect(complexCondition.successes).toBe(1);
    });

    test('should fail a complex nested condition if any part fails', () => {
        const condition1 = new Condition('Tag1', 2, '>=');
        const condition2 = new Condition('Tag2', 2, '=');
        const condition3 = new Condition('Card C');
        const condition4 = new Condition('Tag3', 2, '>=');

        const nestedAnd = new AndCondition([condition1, condition2]);
        const nestedOr = new OrCondition([condition3, condition4]);
        const complexCondition = new AndCondition([nestedAnd, nestedOr]);

        testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag1', 'Tag2'] }),
            CreateCard('Card D', { tags: ['Tag3'] }),
        ];

        expect(complexCondition.evaluate(mockGameState)).toBe(false);
        expect(complexCondition.successes).toBe(0);
    });
});
