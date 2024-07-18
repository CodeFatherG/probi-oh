import { Card, CreateCard } from '../src/card';
import { Condition, AndCondition, OrCondition } from '../src/condition';

describe('Condition', () => {
    let testCards: Card[];

    beforeEach(() => {
        testCards = [
        CreateCard('Card A', { tags: ['Tag1'] }),
        CreateCard('Card B', { tags: ['Tag2'] }),
        CreateCard('Card C', { tags: ['Tag1', 'Tag3'] }),
        ];
    });

    test('should evaluate correctly for card name', () => {
        const condition = new Condition('Card A');
        expect(condition.evaluate(testCards)).toBe(true);
        expect(condition.successes).toBe(1);
    });

    test('should evaluate correctly for tag', () => {
        const condition = new Condition('Tag2');
        expect(condition.evaluate(testCards)).toBe(true);
        expect(condition.successes).toBe(1);
    });

    test('should evaluate correctly with quantity', () => {
        const condition = new Condition('Tag1', 2, '>=');
        expect(condition.evaluate(testCards)).toBe(true);
        expect(condition.successes).toBe(1);
    });

    test('should evaluate correctly with different operators', () => {
        const equalCondition = new Condition('Tag1', 2, '=');
        expect(equalCondition.evaluate(testCards)).toBe(true);

        const lessEqualCondition = new Condition('Tag3', 1, '<=');
        expect(lessEqualCondition.evaluate(testCards)).toBe(true);
    });

    test('should throw error for unknown operator', () => {
        const invalidCondition = new Condition('Card A', 1, '>' as any);
        expect(() => invalidCondition.evaluate(testCards)).toThrow('Unknown operator: >');
    });
    
    test('should evaluate correctly with quantity and <= operator', () => {
        const condition = new Condition('Tag1', 2, '<=');
        const testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag1'] }),
            CreateCard('Card C', { tags: ['Tag1'] }),
        ];
        expect(condition.evaluate(testCards)).toBe(false);
        expect(condition.successes).toBe(0);
    });

    test('should evaluate correctly with exact quantity', () => {
        const condition = new Condition('Tag2', 2, '=');
        const testCards = [
            CreateCard('Card A', { tags: ['Tag2'] }),
            CreateCard('Card B', { tags: ['Tag2'] }),
        ];
        expect(condition.evaluate(testCards)).toBe(true);
        expect(condition.successes).toBe(1);
    });

    test('should handle cards with multiple tags', () => {
        const condition = new Condition('Tag3', 2, '>=');
        const testCards = [
            CreateCard('Card A', { tags: ['Tag1', 'Tag3'] }),
            CreateCard('Card B', { tags: ['Tag2', 'Tag3'] }),
            CreateCard('Card C', { tags: ['Tag3', 'Tag4'] }),
        ];
        expect(condition.evaluate(testCards)).toBe(true);
        expect(condition.successes).toBe(1);
    });

    it('should evaluate greater than or equal correctly', () => {
        const condition = new Condition('Test Card', 2, '>=');
        expect(condition.evaluate([CreateCard('Test Card', {}), CreateCard('Test Card', {})])).toBe(true);
        expect(condition.evaluate([CreateCard('Test Card', {})])).toBe(false);
    });

    it('should evaluate less than or equal correctly', () => {
        const condition = new Condition('Test Card', 2, '<=');
        expect(condition.evaluate([CreateCard('Test Card', {})])).toBe(true);
        expect(condition.evaluate([CreateCard('Test Card', {}), CreateCard('Test Card', {}), CreateCard('Test Card', {})])).toBe(false);
    });

    it('should evaluate equal correctly', () => {
        const condition = new Condition('Test Card', 2, '=');
        expect(condition.evaluate([CreateCard('Test Card', {}), CreateCard('Test Card', {})])).toBe(true);
        expect(condition.evaluate([CreateCard('Test Card', {})])).toBe(false);
        expect(condition.evaluate([CreateCard('Test Card', {}), CreateCard('Test Card', {}), CreateCard('Test Card', {})])).toBe(false);
    });

    it('should handle card tags', () => {
        const condition = new Condition('TestTag', 1, '>=');
        expect(condition.evaluate([CreateCard('Different Card', { tags: ['TestTag'] })])).toBe(true);
        expect(condition.evaluate([CreateCard('Different Card', { tags: ['OtherTag'] })])).toBe(false);
    });
});

describe('AndCondition', () => {
    test('should evaluate correctly', () => {
        const condition1 = new Condition('Card A');
        const condition2 = new Condition('Tag2');
        const andCondition = new AndCondition([condition1, condition2]);

        const testCards = [
        CreateCard('Card A', { tags: ['Tag1'] }),
        CreateCard('Card B', { tags: ['Tag2'] }),
        ];

        expect(andCondition.evaluate(testCards)).toBe(true);
        expect(andCondition.successes).toBe(1);
    });

    test('should fail if one condition fails', () => {
        const condition1 = new Condition('Card A');
        const condition2 = new Condition('Card C');
        const andCondition = new AndCondition([condition1, condition2]);

        const testCards = [
        CreateCard('Card A', { tags: ['Tag1'] }),
        CreateCard('Card B', { tags: ['Tag2'] }),
        ];

        expect(andCondition.evaluate(testCards)).toBe(false);
        expect(andCondition.successes).toBe(0);
    });

    test('should evaluate correctly with multiple conditions', () => {
        const condition1 = new Condition('Tag1', 2, '>=');
        const condition2 = new Condition('Tag2', 1, '=');
        const condition3 = new Condition('Card C');
        const andCondition = new AndCondition([condition1, condition2, condition3]);

        const testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag1', 'Tag2'] }),
            CreateCard('Card C', { tags: ['Tag3'] }),
        ];

        expect(andCondition.evaluate(testCards)).toBe(true);
        expect(andCondition.successes).toBe(1);
    });

    test('should fail if any condition fails', () => {
        const condition1 = new Condition('Tag1', 2, '>=');
        const condition2 = new Condition('Tag2', 2, '=');
        const andCondition = new AndCondition([condition1, condition2]);

        const testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag1', 'Tag2'] }),
        ];

        expect(andCondition.evaluate(testCards)).toBe(false);
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
    test('should evaluate correctly', () => {
        const condition1 = new Condition('Card A');
        const condition2 = new Condition('Card C');
        const orCondition = new OrCondition([condition1, condition2]);

        const testCards = [
        CreateCard('Card A', { tags: ['Tag1'] }),
        CreateCard('Card B', { tags: ['Tag2'] }),
        ];

        expect(orCondition.evaluate(testCards)).toBe(true);
        expect(orCondition.successes).toBe(1);
    });

    test('should fail if all conditions fail', () => {
        const condition1 = new Condition('Card C');
        const condition2 = new Condition('Card D');
        const orCondition = new OrCondition([condition1, condition2]);

        const testCards = [
        CreateCard('Card A', { tags: ['Tag1'] }),
        CreateCard('Card B', { tags: ['Tag2'] }),
        ];

        expect(orCondition.evaluate(testCards)).toBe(false);
        expect(orCondition.successes).toBe(0);
    });

    test('should evaluate correctly with multiple conditions', () => {
        const condition1 = new Condition('Tag1', 3, '>=');
        const condition2 = new Condition('Tag2', 1, '=');
        const condition3 = new Condition('Card D');
        const orCondition = new OrCondition([condition1, condition2, condition3]);

        const testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag2'] }),
        ];

        expect(orCondition.evaluate(testCards)).toBe(true);
        expect(orCondition.successes).toBe(1);
    });

    test('should pass if any condition passes', () => {
        const condition1 = new Condition('Tag1', 3, '>=');
        const condition2 = new Condition('Tag2', 1, '=');
        const condition3 = new Condition('Card C');
        const orCondition = new OrCondition([condition1, condition2, condition3]);

        const testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag1'] }),
            CreateCard('Card C', { tags: ['Tag3'] }),
        ];

        expect(orCondition.evaluate(testCards)).toBe(true);
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
    test('should evaluate a complex nested condition correctly', () => {
        const condition1 = new Condition('Tag1', 2, '>=');
        const condition2 = new Condition('Tag2', 1, '=');
        const condition3 = new Condition('Card C');
        const condition4 = new Condition('Tag3', 1, '>=');

        const nestedAnd = new AndCondition([condition1, condition2]);
        const nestedOr = new OrCondition([condition3, condition4]);
        const complexCondition = new AndCondition([nestedAnd, nestedOr]);

        const testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag1', 'Tag2'] }),
            CreateCard('Card D', { tags: ['Tag3'] }),
        ];

        expect(complexCondition.evaluate(testCards)).toBe(true);
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

        const testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag1', 'Tag2'] }),
            CreateCard('Card D', { tags: ['Tag3'] }),
        ];

        expect(complexCondition.evaluate(testCards)).toBe(false);
        expect(complexCondition.successes).toBe(0);
    });
});
