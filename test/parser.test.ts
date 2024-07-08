import { parseCondition } from '../src/parser';
import { Condition, AndCondition, OrCondition } from '../src/condition';

describe('parseCondition', () => {
    it('should parse a simple condition', () => {
        const result = parseCondition('Card A');
        expect(result).toBeInstanceOf(Condition);
        expect((result as Condition).cardName).toBe('Card A');
    });

    it('should parse a condition with quantity', () => {
        const result = parseCondition('2+ Card A');
        expect(result).toBeInstanceOf(Condition);
        expect((result as Condition).cardName).toBe('Card A');
        expect((result as Condition).quantity).toBe(2);
        expect((result as Condition).operator).toBe('>=');
    });

    it('should parse an AND condition', () => {
        const result = parseCondition('Card A AND Card B');
        expect(result).toBeInstanceOf(AndCondition);
        expect((result as AndCondition).conditions).toHaveLength(2);
    });

    it('should parse an OR condition', () => {
        const result = parseCondition('Card A OR Card B');
        expect(result).toBeInstanceOf(OrCondition);
        expect((result as OrCondition).conditions).toHaveLength(2);
    });

    it('should parse a complex nested condition', () => {
        const result = parseCondition('(2+ Card A AND Card B) OR (Card C AND 3 Card D)');
        expect(result).toBeInstanceOf(OrCondition);
        expect((result as OrCondition).conditions).toHaveLength(2);
        expect((result as OrCondition).conditions[0]).toBeInstanceOf(AndCondition);
        expect((result as OrCondition).conditions[1]).toBeInstanceOf(AndCondition);
    });

    it('should throw an error for invalid input', () => {
        expect(() => parseCondition('Invalid *** Input')).toThrow();
    });

    it('should parse a condition with exact quantity', () => {
        const result = parseCondition('3 Card A');
        expect(result).toBeInstanceOf(Condition);
        expect((result as Condition).cardName).toBe('Card A');
        expect((result as Condition).quantity).toBe(3);
        expect((result as Condition).operator).toBe('=');
    });

    it('should parse a complex nested condition with multiple AND and OR', () => {
        const result = parseCondition('(2+ Card A AND Card B) OR (Card C AND 3 Card D) AND Card E');
        expect(result).toBeInstanceOf(AndCondition);
        const topLevelAnd = result as AndCondition;
        expect(topLevelAnd.conditions).toHaveLength(2);
        expect(topLevelAnd.conditions[0]).toBeInstanceOf(OrCondition);
        expect(topLevelAnd.conditions[1]).toBeInstanceOf(Condition);
    });

    it('should throw an error for mismatched parentheses', () => {
        expect(() => parseCondition('(Card A AND Card B')).toThrow();
    });

    it('should parse a condition with a multi-word card name', () => {
        const result = parseCondition('2+ Blue-Eyes White Dragon');
        expect(result).toBeInstanceOf(Condition);
        expect((result as Condition).cardName).toBe('Blue-Eyes White Dragon');
        expect((result as Condition).quantity).toBe(2);
        expect((result as Condition).operator).toBe('>=');
    });
    
    it('should handle whitespace correctly', () => {
        const result = parseCondition('  2+    Card A    AND    Card B  ');
        expect(result).toBeInstanceOf(AndCondition);
        const andCondition = result as AndCondition;
        expect(andCondition.conditions).toHaveLength(2);
        expect(andCondition.conditions[0]).toBeInstanceOf(Condition);
        expect(andCondition.conditions[1]).toBeInstanceOf(Condition);
    });
    
    it('should parse nested conditions with multiple levels', () => {
        const result = parseCondition('((Card A OR Card B) AND (Card C OR Card D)) OR Card E');
        expect(result).toBeInstanceOf(OrCondition);
        const orCondition = result as OrCondition;
        expect(orCondition.conditions).toHaveLength(2);
        expect(orCondition.conditions[0]).toBeInstanceOf(AndCondition);
        expect(orCondition.conditions[1]).toBeInstanceOf(Condition);
    });

    it('should parse a condition with "less than or equal to" quantity', () => {
        const result = parseCondition('2- Card A');
        expect(result).toBeInstanceOf(Condition);
        expect((result as Condition).cardName).toBe('Card A');
        expect((result as Condition).quantity).toBe(2);
        expect((result as Condition).operator).toBe('<=');
    });

    it('should handle unexpected end of input', () => {
        expect(() => parseCondition('Card A AND')).toThrow();
    });

    it('should parse complex nested conditions with mixed operators', () => {
        const result = parseCondition('(Card A OR 2+ Card B) AND (3- Card C OR Card D)');
        expect(result).toBeInstanceOf(AndCondition);
        const andCondition = result as AndCondition;
        expect(andCondition.conditions).toHaveLength(2);
        expect(andCondition.conditions[0]).toBeInstanceOf(OrCondition);
        expect(andCondition.conditions[1]).toBeInstanceOf(OrCondition);
    });

    it('should handle multiple spaces between tokens', () => {
        const result = parseCondition('Card A    AND    2+    Card B');
        expect(result).toBeInstanceOf(AndCondition);
        const andCondition = result as AndCondition;
        expect(andCondition.conditions).toHaveLength(2);
        expect(andCondition.conditions[0]).toBeInstanceOf(Condition);
        expect(andCondition.conditions[1]).toBeInstanceOf(Condition);
        expect((andCondition.conditions[1] as Condition).quantity).toBe(2);
    });

    it('should throw an error for unbalanced parentheses', () => {
        expect(() => parseCondition('(Card A AND Card B')).toThrow();
        expect(() => parseCondition('Card A AND Card B)')).toThrow();
    });

    it('should handle conditions with only parentheses', () => {
        const result = parseCondition('(Card A)');
        expect(result).toBeInstanceOf(Condition);
        expect((result as Condition).cardName).toBe('Card A');
    });

    it('should throw an error for empty parentheses', () => {
        expect(() => parseCondition('()')).toThrow();
    });

    it('should parse a condition with "less than or equal to" quantity', () => {
        const result = parseCondition('2- Card A');
        expect(result).toBeInstanceOf(Condition);
        expect((result as Condition).cardName).toBe('Card A');
        expect((result as Condition).quantity).toBe(2);
        expect((result as Condition).operator).toBe('<=');
    });

    it('should throw an error for invalid quantity syntax', () => {
        expect(() => parseCondition('2* Card A')).toThrow();
    });

    it('should parse a condition with exact quantity and no operator', () => {
        const result = parseCondition('3 Card A');
        expect(result).toBeInstanceOf(Condition);
        expect((result as Condition).cardName).toBe('Card A');
        expect((result as Condition).quantity).toBe(3);
        expect((result as Condition).operator).toBe('=');
    });

    it('should throw an error for unexpected end of input after number', () => {
        expect(() => parseCondition('2+')).toThrow();
    });

    it('should throw an error for unexpected token type', () => {
        expect(() => parseCondition('2+ AND Card A')).toThrow();
    });

    it('should handle complex nested conditions with mixed operators and quantities', () => {
        const result = parseCondition('(2+ Card A OR 3- Card B) AND (Card C OR 1 Card D)');
        expect(result).toBeInstanceOf(AndCondition);
        const andCondition = result as AndCondition;
        expect(andCondition.conditions).toHaveLength(2);
        expect(andCondition.conditions[0]).toBeInstanceOf(OrCondition);
        expect(andCondition.conditions[1]).toBeInstanceOf(OrCondition);
    });

    it('should throw an error for invalid characters in card names', () => {
        expect(() => parseCondition('Card@ A')).toThrow();
    });

    it('should handle card names with numbers', () => {
        const result = parseCondition('Card123');
        expect(result).toBeInstanceOf(Condition);
        expect((result as Condition).cardName).toBe('Card123');
    });
});