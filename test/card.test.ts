import { Card, CreateCard } from '../src/card';
import { CardDetails } from '../src/card-details';

describe('Card', () => {
    const cardName = 'Blue-Eyes White Dragon';
    const cardDetails = {
        tags: ['Dragon', 'Normal'],
    };

    it('should create a card with the correct name', () => {
        const card = CreateCard(cardName, cardDetails);
        expect(card.name).toBe(cardName);
    });

    it('should have the correct tags', () => {
        const card = CreateCard(cardName, cardDetails);
        expect(card.tags).toEqual(cardDetails.tags);
    });

    it('should correctly identify a Card as not being free', () => {
        const card = CreateCard(cardName, cardDetails);
        expect(card.isFree).toBe(false);
    });

    it('should correctly identify as not a free card', () => {
        const nonFreeCard = CreateCard('Dark Magician', { tags: ['Spellcaster'] });
        expect(nonFreeCard.isFree).toBe(false);
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
        const card = CreateCard(
            'Card A', 
            details
        );
        expect(card.details).toBe(details);
        expect(card.details.qty).toBe(3);
        expect(card.details.tags).toEqual(['Tag A', 'Tag B']);
    });
});