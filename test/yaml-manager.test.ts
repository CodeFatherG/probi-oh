import { YamlManager, SimulationInput } from '../src/yaml-manager';
import { Deck } from '../src/deck';
import { Card } from '../src/card';
import { Condition, AndCondition, OrCondition } from '../src/condition';
import yaml from 'js-yaml';

describe('YamlManager', () => {
    let yamlManager: YamlManager;

    beforeEach(() => {
        yamlManager = YamlManager.getInstance();
    });

    describe('getInstance', () => {
        it('should always return the same instance', () => {
            const instance1 = YamlManager.getInstance();
            const instance2 = YamlManager.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('loadFromYamlString', () => {
        it('should correctly parse a valid YAML string, fill up to 40 cards, and include specified cards', () => {
            const yamlString = `
                deck:
                    Card1:
                        qty: 3
                        tags: [Tag1, Tag2]
                    Card2:
                        qty: 2
                        tags: [Tag3]
                conditions:
                    - 2+ Card1
                    - (1 Card2 OR 2 Card1)
            `;
            const result = yamlManager.loadFromYamlString(yamlString);
            
            // Check deck properties
            expect(result.deck).toBeInstanceOf(Deck);
            expect(result.deck.deckCount).toBe(40);

            // Check if specified cards are in the deck
            const deckList = result.deck.deckList;
            const card1Count = deckList.filter(card => card.name === 'Card1').length;
            const card2Count = deckList.filter(card => card.name === 'Card2').length;
            const emptyCardCount = deckList.filter(card => card.name === 'Empty Card').length;

            expect(card1Count).toBe(3);
            expect(card2Count).toBe(2);
            expect(emptyCardCount).toBe(35);  // 40 - (3 + 2)

            // Check card properties
            const card1 = deckList.find(card => card.name === 'Card1');
            const card2 = deckList.find(card => card.name === 'Card2');

            expect(card1?.tags).toEqual(['Tag1', 'Tag2']);
            expect(card2?.tags).toEqual(['Tag3']);

            // Check conditions
            expect(result.conditions).toHaveLength(2);
            expect(result.conditions[0]).toBeInstanceOf(Condition);
            expect(result.conditions[1]).toBeInstanceOf(OrCondition);
        });

        it('should throw an error for invalid YAML', () => {
            const invalidYaml = `
                deck:
                    - This is invalid
                conditions:
                    - Also invalid
            `;
            expect(() => yamlManager.loadFromYamlString(invalidYaml)).toThrow();
        });

        it('should throw an error for invalid YAML', () => {
            const invalidYaml = `
                deck:
                    - This is invalid
                conditions:
                    - Also invalid
            `;
            expect(() => yamlManager.loadFromYamlString(invalidYaml)).toThrow();
        });
    });

    describe('serializeDeckToYaml', () => {
        it('should correctly serialize a deck to YAML, excluding Empty Cards', () => {
            const cards = [
                new Card('Card1', { tags: ['Tag1', 'Tag2'] }),
                new Card('Card1', { tags: ['Tag1', 'Tag2'] }),
                new Card('Card2', { tags: ['Tag3'] })
            ];
            const deck = new Deck(cards);  // This will add 37 Empty Cards
            const result = yamlManager.serializeDeckToYaml(deck);
            const parsed = yaml.load(result) as { deck: any };
            expect(parsed.deck.Card1.qty).toBe(2);
            expect(parsed.deck.Card1.tags).toEqual(['Tag1', 'Tag2']);
            expect(parsed.deck.Card2.qty).toBe(1);
            expect(parsed.deck.Card2.tags).toEqual(['Tag3']);
            expect(parsed.deck['Empty Card']).toBeUndefined();  // Empty Cards should not be serialized
        });
    });

    describe('serializeConditionsToYaml', () => {
        it('should correctly serialize conditions to YAML', () => {
            const conditions = [
                new Condition('Card1', 2, '>='),
                new OrCondition([
                    new Condition('Card2', 1, '='),
                    new Condition('Card1', 2, ">=")
                ])
            ];
            const result = yamlManager.serializeConditionsToYaml(conditions);
            const parsed = yaml.load(result) as { conditions: string[] };
            expect(parsed.conditions).toHaveLength(2);
            expect(parsed.conditions[0]).toBe('2+ Card1');
            expect(parsed.conditions[1]).toBe('(Card2 OR 2+ Card1)');
        });
    });

    describe('serializeSimulationInputToYaml', () => {
        it('should correctly serialize a complete simulation input to YAML, excluding Empty Cards', () => {
            const cards = [
                new Card('Card1', { tags: ['Tag1'] }),
                new Card('Card2', { tags: ['Tag2'] })
            ];
            const deck = new Deck(cards);  // This will add 38 Empty Cards
            const conditions = [
                new Condition('Card1', 1, '>='),
                new AndCondition([
                    new Condition('Card1', 1, '='),
                    new Condition('Card2', 1, '=')
                ])
            ];
            const input: SimulationInput = { deck, conditions };
            const result = yamlManager.serializeSimulationInputToYaml(input);
            const parsed = yaml.load(result) as { deck: any, conditions: string[] };
            expect(parsed.deck.Card1.qty).toBe(1);
            expect(parsed.deck.Card2.qty).toBe(1);
            expect(parsed.deck['Empty Card']).toBeUndefined();  // Empty Cards should not be serialized
            expect(parsed.conditions).toHaveLength(2);
            expect(parsed.conditions[0]).toBe('1+ Card1');
            expect(parsed.conditions[1]).toBe('(Card1 AND Card2)');
        });
    });
});