import { parseCondition } from '../src/parser';
import { Condition, AndCondition, OrCondition, LocationConditionTarget } from '../src/condition';

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

    describe('Location conditions', () => {
        it('should set default location to hand', () => {
            const condition = "Card A";

            const result = parseCondition(condition);
            expect(result).toBeInstanceOf(Condition);
            expect((result as Condition).cardName).toBe("Card A");
            expect((result as Condition).location).toBe(LocationConditionTarget.Hand);
        });

        it('should parse a condition with a hand location', () => {
            const conditions = [
                "Card A IN Hand",
                "Card A IN hand",
                "Card A IN HAND",
                "Card A IN HaNd"
            ];

            conditions.forEach(condition => {
                const result = parseCondition(condition);
                expect(result).toBeInstanceOf(Condition);
                expect((result as Condition).cardName).toBe("Card A");
                expect((result as Condition).location).toBe(LocationConditionTarget.Hand);
            });
        });

        it('should parse a condition with a deck location', () => {
            const conditions = [
                "Card A IN Deck",
                "Card A IN deck",
                "Card A IN DECK",
                "Card A IN deCK"
            ];

            conditions.forEach(condition => {
                const result = parseCondition(condition);
                expect(result).toBeInstanceOf(Condition);
                expect((result as Condition).cardName).toBe("Card A");
                expect((result as Condition).location).toBe(LocationConditionTarget.Deck);
            });
        });

        it('should parse a condition with a location and qty', () => {
            const conditions = [
                {str: "2+ Card A IN Deck",  qty: 2,     op: '>=', loc: LocationConditionTarget.Deck},
                {str: "2 Card A IN deck",   qty: 2,     op: '=',  loc: LocationConditionTarget.Deck},
                {str: "3- Card A IN Hand",  qty: 3,     op: '<=', loc: LocationConditionTarget.Hand},
                {str: "1 Card A IN hand",   qty: 1,     op: '=',  loc: LocationConditionTarget.Hand},
            ];

            conditions.forEach(condition => {
                const result = parseCondition(condition.str);
                expect(result).toBeInstanceOf(Condition);
                expect((result as Condition).cardName).toBe("Card A");
                expect((result as Condition).quantity).toBe(condition.qty);
                expect((result as Condition).operator).toBe(condition.op);
                expect((result as Condition).location).toBe(condition.loc);
            });
        });

        it('should parse a complex AND condition with a location and qty', () => {
            const condition = "2+ Card A AND 1 Card B IN Hand AND 3 Card C IN Deck";

            const result = parseCondition(condition);
            expect(result).toBeInstanceOf(AndCondition);

            const andCondition = result as AndCondition;
            expect(andCondition.conditions.length).toBe(2);

            // Should be [0] = 2+ Card A AND 1 Card B IN Hand, [1] = 3 Card C IN Deck
            expect(andCondition.conditions[0]).toBeInstanceOf(AndCondition);
            expect(andCondition.conditions[1]).toBeInstanceOf(Condition);

            const conditionA = andCondition.conditions[0] as AndCondition;
            expect(conditionA.conditions.length).toBe(2);
            expect(conditionA.conditions[0]).toBeInstanceOf(Condition);
            expect(conditionA.conditions[1]).toBeInstanceOf(Condition);
            expect((conditionA.conditions[0] as Condition).cardName).toBe("Card A");
            expect((conditionA.conditions[0] as Condition).quantity).toBe(2);
            expect((conditionA.conditions[0] as Condition).operator).toBe('>=');
            expect((conditionA.conditions[0] as Condition).location).toBe(LocationConditionTarget.Hand);
            expect((conditionA.conditions[1] as Condition).cardName).toBe("Card B");
            expect((conditionA.conditions[1] as Condition).quantity).toBe(1);
            expect((conditionA.conditions[1] as Condition).operator).toBe('=');
            expect((conditionA.conditions[1] as Condition).location).toBe(LocationConditionTarget.Hand);

            const conditionB = andCondition.conditions[1] as Condition;
            expect((conditionB).cardName).toBe("Card C");
            expect((conditionB).quantity).toBe(3);
            expect((conditionB).operator).toBe('=');
            expect((conditionB).location).toBe(LocationConditionTarget.Deck);
        });

        it('should parse a complex OR condition with a location and qty', () => {
            const condition = "(2+ Card A OR 1 Card B IN Hand) AND 3 Card C IN Deck";

            const result = parseCondition(condition);
            expect(result).toBeInstanceOf(AndCondition);

            const andCondition = result as AndCondition;
            expect(andCondition.conditions.length).toBe(2);

            // Should be [0] = (2+ Card A OR 1 Card B IN Hand), [1] = 3 Card C IN Deck
            expect(andCondition.conditions[0]).toBeInstanceOf(OrCondition);
            expect(andCondition.conditions[1]).toBeInstanceOf(Condition);

            const conditionA = andCondition.conditions[0] as OrCondition;
            expect(conditionA.conditions.length).toBe(2);
            expect(conditionA.conditions[0]).toBeInstanceOf(Condition);
            expect(conditionA.conditions[1]).toBeInstanceOf(Condition);
            expect((conditionA.conditions[0] as Condition).cardName).toBe("Card A");
            expect((conditionA.conditions[0] as Condition).quantity).toBe(2);
            expect((conditionA.conditions[0] as Condition).operator).toBe('>=');
            expect((conditionA.conditions[0] as Condition).location).toBe(LocationConditionTarget.Hand);
            expect((conditionA.conditions[1] as Condition).cardName).toBe("Card B");
            expect((conditionA.conditions[1] as Condition).quantity).toBe(1);
            expect((conditionA.conditions[1] as Condition).operator).toBe('=');
            expect((conditionA.conditions[1] as Condition).location).toBe(LocationConditionTarget.Hand);

            const conditionB = andCondition.conditions[1] as Condition;
            expect((conditionB).cardName).toBe("Card C");
            expect((conditionB).quantity).toBe(3);
            expect((conditionB).operator).toBe('=');
            expect((conditionB).location).toBe(LocationConditionTarget.Deck);
        });
    });

    describe('Edge cases', () => {
        it('should handle card names with numbers', () => {
            const validNames = [
                "Card 1",
                "Card1",
                "C4rd 1"
            ];

            validNames.forEach(name => {
                const result = parseCondition(name);
                    expect(result).toBeInstanceOf(Condition);
                    expect((result as Condition).cardName).toBe(name);
                });
        });

        it('should handle card names starting with number', () => {
            const result = parseCondition("1st Card");
            expect(result).toBeInstanceOf(Condition);
            expect((result as Condition).cardName).toBe("1st Card");
        });

        it('should handle card names starting with number and quantity', () => {
            const result = parseCondition("2 1st Card");
            expect(result).toBeInstanceOf(Condition);
            expect((result as Condition).cardName).toBe("1st Card");
            expect((result as Condition).quantity).toBe(2);
        });

        it('should handle card names starting with number complex', () => {
            const result = parseCondition("2 1st Card AND 3+ 2nd Card");
            expect(result).toBeInstanceOf(AndCondition);
            expect(((result as AndCondition).conditions[0] as Condition).cardName).toBe("1st Card");
            expect(((result as AndCondition).conditions[0] as Condition).quantity).toBe(2);
            expect(((result as AndCondition).conditions[0] as Condition).operator).toBe("=");
            expect(((result as AndCondition).conditions[1] as Condition).cardName).toBe("2nd Card");
            expect(((result as AndCondition).conditions[1] as Condition).quantity).toBe(3);
            expect(((result as AndCondition).conditions[1] as Condition).operator).toBe(">=");
        });
        
        it('should handle card names with various special characters', () => {
            const validNames = [
            "Pot of Greed",
            "Blue-Eyes White Dragon",
            "Fool's Gold",
            "Goblin, Inc.",
            "Elves & Orcs",
            "Level Up!",
            "Go Fish?",
            "Magic: The Gathering",
            "\"Card Name\""
            ];
        
            validNames.forEach(name => {
            const result = parseCondition(name);
                expect(result).toBeInstanceOf(Condition);
                expect((result as Condition).cardName).toBe(name);
            });
        });

        it('should reject invalid card names', () => {
            const invalidNames = [
                "Invalid@Card",
                "No/Slashes",
                "No*Asterisks",
                "No+Plus",
                "No_Underscore",
                "No#Hashtag",
                "No%Percent",
                "No^Caret",
                "No=Equals",
                "No[SquareBrackets]",
                "NoAquareBrackets]",
                "No<Arrows>",
                "NoArrows>",
                "No{Squiglies}",
                "NoSquiglies}",
            ];
        
            invalidNames.forEach(name => {
                expect(() => parseCondition(name)).toThrow();
            });
        });
    });
});