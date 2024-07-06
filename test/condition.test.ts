import { Card } from '../src/card';
import { Condition, AndCondition, OrCondition } from '../src/condition';

describe('Condition', () => {
    let testCards: Card[];

    beforeEach(() => {
        testCards = [
        new Card('Card A', { tags: ['Tag1'] }),
        new Card('Card B', { tags: ['Tag2'] }),
        new Card('Card C', { tags: ['Tag1', 'Tag3'] }),
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
    });

    describe('AndCondition', () => {
    test('should evaluate correctly', () => {
        const condition1 = new Condition('Card A');
        const condition2 = new Condition('Tag2');
        const andCondition = new AndCondition([condition1, condition2]);

        const testCards = [
        new Card('Card A', { tags: ['Tag1'] }),
        new Card('Card B', { tags: ['Tag2'] }),
        ];

        expect(andCondition.evaluate(testCards)).toBe(true);
        expect(andCondition.successes).toBe(1);
    });

    test('should fail if one condition fails', () => {
        const condition1 = new Condition('Card A');
        const condition2 = new Condition('Card C');
        const andCondition = new AndCondition([condition1, condition2]);

        const testCards = [
        new Card('Card A', { tags: ['Tag1'] }),
        new Card('Card B', { tags: ['Tag2'] }),
        ];

        expect(andCondition.evaluate(testCards)).toBe(false);
        expect(andCondition.successes).toBe(0);
    });
    });

    describe('OrCondition', () => {
    test('should evaluate correctly', () => {
        const condition1 = new Condition('Card A');
        const condition2 = new Condition('Card C');
        const orCondition = new OrCondition([condition1, condition2]);

        const testCards = [
        new Card('Card A', { tags: ['Tag1'] }),
        new Card('Card B', { tags: ['Tag2'] }),
        ];

        expect(orCondition.evaluate(testCards)).toBe(true);
        expect(orCondition.successes).toBe(1);
    });

    test('should fail if all conditions fail', () => {
        const condition1 = new Condition('Card C');
        const condition2 = new Condition('Card D');
        const orCondition = new OrCondition([condition1, condition2]);

        const testCards = [
        new Card('Card A', { tags: ['Tag1'] }),
        new Card('Card B', { tags: ['Tag2'] }),
        ];

        expect(orCondition.evaluate(testCards)).toBe(false);
        expect(orCondition.successes).toBe(0);
    });
});