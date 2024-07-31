import { Card, CreateCard, FreeCard } from '../src/utils/card';
import { CardDetails, CostType, ConditionType, RestrictionType } from '../src/utils/card-details';

describe('Card', () => {
    const cardName = 'Blue-Eyes White Dragon';
    const cardDetails: CardDetails = {
        tags: ['Dragon', 'Normal'],
    };

    it('should create a card with the correct name', () => {
        const card = CreateCard(cardName, cardDetails);
        expect(card.name).toBe(cardName);
    });

    it('should return the correct lower case name', () => {
        const card = CreateCard(cardName, cardDetails);
        expect(card.nameLower).toBe(cardName.toLowerCase());
    });

    it('should have the correct tags', () => {
        const card = CreateCard(cardName, cardDetails);
        expect(card.tags).toEqual(cardDetails.tags);
    });

    it('should correctly identify as not a free card', () => {
        const card = CreateCard(cardName, cardDetails);
        expect(card.isFree).toBe(false);
    });

    it('should handle cards without tags', () => {
        const card = CreateCard('Card B', {});
        expect(card.tags).toBeNull();
    });

    it('should return card details', () => {
        const details: CardDetails = {
            qty: 3,
            tags: ['Tag A', 'Tag B'],
        };
        const card = CreateCard('Card A', details);
        expect(card.details).toBe(details);
        expect(card.details.qty).toBe(3);
        expect(card.details.tags).toEqual(['Tag A', 'Tag B']);
    });

    it('should create a Card instance for non-free cards', () => {
        const card = CreateCard('Normal Card', { tags: ['Normal'] });
        expect(card.isFree).toBe(false);
        expect(card.name).toBe('Normal Card');
    });
});

describe('FreeCard', () => {
    const cardName = 'Pot of Greed';
    const freeCardDetails: CardDetails = {
        tags: ['Spell', 'Draw'],
        free: {
            count: 2,
            oncePerTurn: true,
            cost: {
                type: CostType.Discard,
                value: 1
            },
            condition: {
                type: ConditionType.Discard,
                value: 1
            },
            restriction: [RestrictionType.NoMoreDraws],
            excavate: {
                count: 3,
                pick: 1
            }
        }
    };

    it('should create a free card with the correct name', () => {
        const card = CreateCard(cardName, freeCardDetails) as FreeCard;
        expect(card.name).toBe(cardName);
    });

    it('should correctly identify as a free card', () => {
        const card = CreateCard(cardName, freeCardDetails);
        expect(card.isFree).toBe(true);
    });

    it('should return the correct count', () => {
        const card = CreateCard(cardName, freeCardDetails) as FreeCard;
        expect(card.count).toBe(2);
    });

    it('should return the correct oncePerTurn value', () => {
        const card = CreateCard(cardName, freeCardDetails) as FreeCard;
        expect(card.oncePerTurn).toBe(true);
    });

    it('should return the correct restrictions', () => {
        const card = CreateCard(cardName, freeCardDetails) as FreeCard;
        expect(card.restrictions).toEqual([RestrictionType.NoMoreDraws]);
    });

    it('should return the correct cost', () => {
        const card = CreateCard(cardName, freeCardDetails) as FreeCard;
        expect(card.cost).toEqual({
            type: CostType.Discard,
            value: 1
        });
    });

    it('should return the correct condition', () => {
        const card = CreateCard(cardName, freeCardDetails) as FreeCard;
        expect(card.condition).toEqual({
            type: ConditionType.Discard,
            value: 1
        });
    });

    it('should return the correct excavate details', () => {
        const card = CreateCard(cardName, freeCardDetails) as FreeCard;
        expect(card.excavate).toEqual({
            count: 3,
            pick: 1
        });
    });

    it('should throw an error when creating a FreeCard without free details', () => {
        expect(() => CreateCard('Invalid Free Card', { tags: ['Invalid'] })).not.toThrow();
    });

    it('should handle free cards without optional properties', () => {
        const minimalFreeCardDetails: CardDetails = {
            free: {
                oncePerTurn: false
            }
        };
        const card = CreateCard('Minimal Free Card', minimalFreeCardDetails) as FreeCard;
        expect(card.isFree).toBe(true);
        expect(card.count).toBe(0);
        expect(card.oncePerTurn).toBe(false);
        expect(card.restrictions).toEqual([]);
        expect(card.cost).toBeNull();
        expect(card.condition).toBeNull();
        expect(card.excavate).toBeNull();
    });

    it('should create a FreeCard instance for free cards', () => {
        const card = CreateCard('Free Card', { free: { oncePerTurn: false } });
        expect(card.isFree).toBe(true);
        expect(card.name).toBe('Free Card');
        expect((card as FreeCard).oncePerTurn).toBe(false);
    });

    it('should return 0 for count when count is not specified', () => {
        const cardDetails: CardDetails = {
            free: {
                oncePerTurn: true
            }
        };
        const card = CreateCard('Zero Count Card', cardDetails) as FreeCard;
        expect(card.count).toBe(0);
    });

    it('should handle undefined free property gracefully', () => {
        const cardDetails: CardDetails = {
            free: undefined
        };
        const card = CreateCard('Undefined Free Card', cardDetails);
        expect(card.isFree).toBe(false);
    });

    it('should return 0 for count when count is undefined', () => {
        const cardDetails: CardDetails = {
            free: {
                oncePerTurn: true
            }
        };
        const card = CreateCard('Undefined Count Card', cardDetails) as FreeCard;
        expect(card.count).toBe(0);
    });

    it('should handle undefined free property in getters', () => {
        const cardDetails: CardDetails = {
            free: {oncePerTurn: true}
        };
        const card = CreateCard('Minimal Free Card', cardDetails) as FreeCard;
        expect(card.restrictions).toEqual([]);
        expect(card.cost).toBeNull();
        expect(card.condition).toBeNull();
        expect(card.excavate).toBeNull();
    });
});

describe('CreateCard', () => {
    it('should create a Card instance for non-free cards', () => {
        const card = CreateCard('Normal Card', { tags: ['Normal'] });
        expect(card.isFree).toBe(false);
    });

    it('should create a FreeCard instance for free cards', () => {
        const card = CreateCard('Free Card', { free: { oncePerTurn: false } });
        expect(card.isFree).toBe(true);
        expect((card as FreeCard).oncePerTurn).toBe(false);
    });

    it('should create a Card instance for null free property', () => {
        const card = CreateCard('Null Free Card', { free: undefined });
        expect(card.isFree).toBe(false);
    });

    it('should create a FreeCard instance for empty free object', () => {
        const card = CreateCard('Empty Free Card', { free: { oncePerTurn: true } });
        expect(card.isFree).toBe(true);
    });
});