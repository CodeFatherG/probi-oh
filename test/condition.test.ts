import { Card, CreateCard } from '../src/utils/card';
import { Condition, AndCondition, OrCondition, LocationConditionTarget as LocationTarget, evaluateCondition } from '../src/utils/condition';
import { Deck } from '../src/utils/deck';
import { GameState } from '../src/utils/game-state';

describe('Condition', () => {
    let testCards: Card[];
    let testDeck: Card[];
    let mockGameState: jest.Mocked<GameState>;
    let mockDeck: jest.Mocked<Deck>;

    beforeEach(() => {
        testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag2'] }),
            CreateCard('Card C', { tags: ['Tag1', 'Tag3'] }),
        ];
        testDeck = [...Array(40)].map((_, i) => CreateCard(`Deck Card ${i}`, {}));
        
        mockDeck = new Deck([]) as jest.Mocked<Deck>;
        Object.defineProperty(mockDeck, 'deckList', {
            get: jest.fn().mockImplementation(() => { return testDeck; })
        });
        mockDeck.deepCopy = jest.fn().mockReturnValue(mockDeck);
        mockDeck.shuffle = jest.fn();

        mockGameState = new GameState(mockDeck) as jest.Mocked<GameState>;
        Object.defineProperty(mockGameState, 'hand', {
            get: jest.fn().mockImplementation(() => { return testCards; })
        });
        Object.defineProperty(mockGameState, 'deck', {
            get: jest.fn().mockImplementation(() => { return mockDeck; })
        });
        mockGameState.deepCopy = jest.fn().mockReturnValue(mockGameState);
    });

    test('should evaluate correctly for card name', () => {
        const condition = new Condition('Card A');
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        expect(condition.successes).toBe(1);
    });

    test('should evaluate correctly for tag', () => {
        const condition = new Condition('Tag2');
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        expect(condition.successes).toBe(1);
    });

    test('should evaluate correctly with quantity', () => {
        const condition = new Condition('Tag1', 2, '>=');
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        expect(condition.successes).toBe(1);
    });

    test('should evaluate correctly with different operators', () => {
        const equalCondition = new Condition('Tag1', 2, '=');
        expect(evaluateCondition(equalCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);

        const lessEqualCondition = new Condition('Tag3', 1, '<=');
        expect(evaluateCondition(lessEqualCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
    });

    test('should throw error for unknown operator', () => {
        const invalidCondition = new Condition('Card A', 1, '>' as any);
        expect(() => evaluateCondition(invalidCondition, mockGameState.hand, mockGameState.deck.deckList)).toThrow('Unknown operator: >');
    });
    
    test('should evaluate correctly with quantity and <= operator', () => {
        const condition = new Condition('Tag1', 2, '<=');
        testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag1'] }),
            CreateCard('Card C', { tags: ['Tag1'] }),
        ];
        
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
        expect(condition.successes).toBe(0);
    });

    test('should evaluate correctly with exact quantity', () => {
        const condition = new Condition('Tag2', 2, '=');
        testCards = [
            CreateCard('Card A', { tags: ['Tag2'] }),
            CreateCard('Card B', { tags: ['Tag2'] }),
        ];
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        expect(condition.successes).toBe(1);
    });

    test('should handle cards with multiple tags', () => {
        const condition = new Condition('Tag3', 2, '>=');
        testCards = [
            CreateCard('Card A', { tags: ['Tag1', 'Tag3'] }),
            CreateCard('Card B', { tags: ['Tag2', 'Tag3'] }),
            CreateCard('Card C', { tags: ['Tag3', 'Tag4'] }),
        ];
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        expect(condition.successes).toBe(1);
    });

    it('should evaluate greater than or equal correctly', () => {
        const condition = new Condition('Test Card', 2, '>=');
        testCards = [CreateCard('Test Card', {}), CreateCard('Test Card', {})];
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        testCards = [CreateCard('Test Card', {})];
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
    });

    it('should evaluate less than or equal correctly', () => {
        const condition = new Condition('Test Card', 2, '<=');
        testCards = [CreateCard('Test Card', {})];
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        testCards = [CreateCard('Test Card', {}), CreateCard('Test Card', {}), CreateCard('Test Card', {})];
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
    });

    it('should evaluate equal correctly', () => {
        const condition = new Condition('Test Card', 2, '=');
        testCards = [CreateCard('Test Card', {}), CreateCard('Test Card', {})];
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        testCards = [CreateCard('Test Card', {})];
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
        testCards = [CreateCard('Test Card', {}), CreateCard('Test Card', {}), CreateCard('Test Card', {})];
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
    });

    it('should handle card tags', () => {
        const condition = new Condition('TestTag', 1, '>=');
        testCards = [CreateCard('Different Card', { tags: ['TestTag'] })];
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        testCards = [CreateCard('Different Card', { tags: ['OtherTag'] })];
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
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

    describe('Location targets', () => {
        it ('should evaluate correctly for deck', () => {
            const condition = new Condition('Test Card', 1, '=', LocationTarget.Deck);
            testDeck = [CreateCard('Test Card', {})];
            expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
            testDeck = [CreateCard('Different Card', {})];
            expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
        });

        it ('should evaluate correctly for hand', () => {
            const condition = new Condition('Test Card', 1, '=', LocationTarget.Hand);
            testCards = [CreateCard('Test Card', {})];
            expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
            testCards = [CreateCard('Different Card', {})];
            expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
        });
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

        expect(evaluateCondition(andCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
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

        expect(evaluateCondition(andCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
        expect(andCondition.successes).toBe(0);
    });

    test('should evaluate correctly with multiple conditions', () => {
        const condition1 = new Condition('Tag1', 2, '>=');
        const condition2 = new Condition('Card C');
        const andCondition = new AndCondition([condition1, condition2]);

        testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag1', 'Tag2'] }),
            CreateCard('Card C', { tags: ['Tag3'] }),
        ];

        expect(evaluateCondition(andCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
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

        expect(evaluateCondition(andCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
        expect(andCondition.successes).toBe(0);
    });

    test('should log error for undefined condition in AndCondition', () => {
        const condition1 = new Condition('Tag1');
        const condition2 = undefined;
        console.error = jest.fn(); // Mock console.error
        new AndCondition([condition1, condition2 as any]);
        expect(console.error).toHaveBeenCalledWith('Found a dead condition');
    });

    test('should fail when a single card fulfills multiple conditions', () => {
        const condition1 = new Condition('Tag1');
        const condition2 = new Condition('Tag2');
        const andCondition = new AndCondition([condition1, condition2]);
    
        testCards = [
            CreateCard('Multi-Tag Card', { tags: ['Tag1', 'Tag2'] })
        ];
    
        expect(evaluateCondition(andCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
        expect(andCondition.successes).toBe(0);
        expect(condition1.successes).toBe(1);
        expect(condition2.successes).toBe(0);
    });
    
    test('should handle satisfying the condition non linearly', () => {
        const condition1 = new Condition('Tag1', 2, '>=');
        const condition2 = new Condition('Tag2');
        const andCondition = new AndCondition([condition1, condition2]);
    
        testCards = [
            CreateCard('Card 1', { tags: ['Tag1'] }),
            CreateCard('Multi tag Card', { tags: ['Tag1', 'Tag2'] }),
            CreateCard('Another Card 1', { tags: ['Tag1'] }),
        ];
    
        expect(evaluateCondition(andCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        expect(andCondition.successes).toBe(1);
    });
    
    test('should handle complex nested AND conditions (A AND B AND C)', () => {
        const conditionA = new Condition('TagA');
        const conditionB = new Condition('TagB');
        const conditionC = new Condition('TagC');
        const complexAnd = new AndCondition([conditionA, conditionB, conditionC]);
    
        testCards = [
            CreateCard('Card A', { tags: ['TagA'] }),
            CreateCard('Card B', { tags: ['TagB'] }),
            CreateCard('Card C', { tags: ['TagC'] })
        ];
    
        expect(evaluateCondition(complexAnd, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        expect(complexAnd.successes).toBe(1);
    
        // Test with a multi-tag card that shouldn't satisfy all conditions
        testCards = [
            CreateCard('Multi-Tag Card', { tags: ['TagA', 'TagB'] }),
            CreateCard('Card C', { tags: ['TagC'] })
        ];
    
        expect(evaluateCondition(complexAnd, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
        expect(complexAnd.successes).toBe(1);
    
        // Test failure case with not enough unique cards
        testCards = [
            CreateCard('Multi-Tag Card', { tags: ['TagA', 'TagB', 'TagC'] })
        ];
    
        expect(evaluateCondition(complexAnd, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
        expect(complexAnd.successes).toBe(1); // Successes should not increment
    });
    
    test('should pass when different cards fulfill each condition', () => {
        const condition1 = new Condition('Tag1');
        const condition2 = new Condition('Tag2');
        const andCondition = new AndCondition([condition1, condition2]);
    
        testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag2'] })
        ];
    
        expect(evaluateCondition(andCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        expect(andCondition.successes).toBe(1);
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

        expect(evaluateCondition(orCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
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

        expect(evaluateCondition(orCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
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

        expect(evaluateCondition(orCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
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

        expect(evaluateCondition(orCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
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
    
    describe('Grob Tests', () => {

        test('OR with AND', () => {
            // Tag1
            // Tag1, Tag2
            // Tag3
            // Tag3, Tag2
            // Tag1
    
            // (2+ Tag1 OR Tag2) AND 2+ Tag3
            const condition1 = new Condition('Tag1', 2, '>=');
            const condition2 = new Condition('Tag2', 1, '>=');
            const condition3 = new Condition('Tag3', 2, '>=');
            const nestedOr = new OrCondition([condition1, condition2]);
            const complexCondition = new AndCondition([nestedOr, condition3]);
    
            testCards = [
                CreateCard('Card A', { tags: ['Tag1'] }),
                CreateCard('Card B', { tags: ['Tag1', 'Tag2'] }),
                CreateCard('Card C', { tags: ['Tag3'] }),
                CreateCard('Card D', { tags: ['Tag3', 'Tag2'] }),
                CreateCard('Card E', { tags: ['Tag1'] }),
            ];
    
            expect(evaluateCondition(complexCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
            expect(complexCondition.successes).toBe(1);
        });

        test('OR with AND', () => {
            // Tag1
            // Tag1, Tag2
            // Tag3
            // Tag3, Tag2
            // Tag1
    
            // (2+ Tag1 AND Tag2) AND 2+ Tag3
            const condition1 = new Condition('Tag1', 2, '>=');
            const condition2 = new Condition('Tag2', 1, '>=');
            const condition3 = new Condition('Tag3', 2, '>=');
            const nestedAnd = new AndCondition([condition1, condition2]);
            const complexCondition = new AndCondition([nestedAnd, condition3]);
    
            testCards = [
                CreateCard('Card A', { tags: ['Tag1'] }),
                CreateCard('Card B', { tags: ['Tag1', 'Tag2'] }),
                CreateCard('Card C', { tags: ['Tag3'] }),
                CreateCard('Card D', { tags: ['Tag3', 'Tag2'] }),
                CreateCard('Card E', { tags: ['Tag1'] }),
            ];
    
            expect(evaluateCondition(complexCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
            expect(complexCondition.successes).toBe(1);
        });

        test('OR with AND', () => {
            // Tag1
            // Tag1, Tag2
            // Tag3
            // Tag3, Tag2
            // Tag1
    
            // (2+ Tag1 AND 2 Tag2) AND 2+ Tag3
            const condition1 = new Condition('Tag1', 2, '>=');
            const condition2 = new Condition('Tag2', 2, '=');
            const condition3 = new Condition('Tag3', 2, '>=');
            const nestedAnd = new AndCondition([condition1, condition2]);
            const complexCondition = new AndCondition([nestedAnd, condition3]);
    
            testCards = [
                CreateCard('Card A', { tags: ['Tag1'] }),
                CreateCard('Card B', { tags: ['Tag1', 'Tag2'] }),
                CreateCard('Card C', { tags: ['Tag3'] }),
                CreateCard('Card D', { tags: ['Tag3', 'Tag2'] }),
                CreateCard('Card E', { tags: ['Tag1'] }),
            ];
    
            expect(evaluateCondition(complexCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
            expect(complexCondition.successes).toBe(0);
        });
    });
});
