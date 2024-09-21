import { MockGameState } from './mock/game-state.mock';
import { MockDeck } from './mock/deck.mock';
import { Card, CreateCard } from '../src/core/data/card';
import { AndCondition, BaseCondition, Condition, evaluateCondition, OrCondition } from '../src/core/sim/condition';
import { parseCondition } from './../src/core/data/parser';

describe('testers', () => {
    describe('burnpsy', () => {
        const condition = parseCondition("(1+ A AND 1+ A Garnet IN Deck) OR (1+ B AND 1+ B Garnet IN Deck) AND 1+ Extender");

        it ('should pass for A condition', () => {
            const hand = [CreateCard('A', {}), CreateCard('Extender', {})];
            const deck = [CreateCard('A Garnet', {})];

            expect(evaluateCondition(condition, hand, deck)).toBe(true);            
        });

        it ('should pass for B condition', () => {
            const hand = [CreateCard('B', {}), CreateCard('Extender', {})];
            const deck = [CreateCard('B Garnet', {})];

            expect(evaluateCondition(condition, hand, deck)).toBe(true);
        });

        it ('should fail drawing A Garnet condition', () => {
            const hand: Card[] = [CreateCard('A', {}), CreateCard('Extender', {}), CreateCard('A Garnet', {})];
            const deck: Card[] = [];

            expect(evaluateCondition(condition, hand, deck)).toBe(false);            
        });

        it ('should fail drawing B Garnet condition', () => {
            const hand: Card[] = [CreateCard('B', {}), CreateCard('Extender', {}), CreateCard('B Garnet', {})];
            const deck: Card[] = [];

            expect(evaluateCondition(condition, hand, deck)).toBe(false);
        });
    });
});