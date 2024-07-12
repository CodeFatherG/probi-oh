import { Card, CardDetails } from '../src/card';

describe('Card', () => {
    const cardName = 'Blue-Eyes White Dragon';
    const cardDetails = {
        tags: ['Dragon', 'Normal'],
        free: {
        cost: 2,
        cards: 1,
        destination: 'grave'
        }
    };

    it('should create a card with the correct name', () => {
        const card = new Card(cardName, cardDetails);
        expect(card.name).toBe(cardName);
    });

    it('should have the correct tags', () => {
        const card = new Card(cardName, cardDetails);
        expect(card.tags).toEqual(cardDetails.tags);
    });

    it('should correctly identify as a free card', () => {
        const card = new Card(cardName, cardDetails);
        expect(card.cardIsFree).toBe(true);
    });

    it('should correctly identify as not a free card', () => {
        const nonFreeCard = new Card('Dark Magician', { tags: ['Spellcaster'] });
        expect(nonFreeCard.cardIsFree).toBe(false);
    });

    it('should handle cards without tags', () => {
        const card = new Card('Card B', {});
        expect(card.tags).toBeNull();
    });
    
    it('should handle cards without free details', () => {
        const card = new Card('Card A', {});
        expect(card.cardIsFree).toBe(false);
        expect(card.freeCardDetails).toBeNull();
    });

    it('should return card details', () => {
        const details: CardDetails = {
            qty: 3,
            tags: ['Tag A', 'Tag B'],
            free: {
                cost: 1,
                cards: 2,
                destination: 'hand'
            }
        };
        const card = new Card(
            'Card A', 
            details
        );
        expect(card.details).toBe(details);
        expect(card.details.qty).toBe(3);
        expect(card.details.tags).toEqual(['Tag A', 'Tag B']);
        expect(card.details.free).toEqual({
            cost: 1,
            cards: 2,
            destination: 'hand'
        });
    });
});