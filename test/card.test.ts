import { Card } from '../src/card';

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

    it('should return the correct lower case name', () => {
        const card = new Card(cardName, cardDetails);
        expect(card.nameLower).toBe(cardName.toLowerCase());
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

  // You would need to mock the Deck class for this test
    it('should process a free card correctly', () => {
        const card = new Card(cardName, cardDetails);
        const mockDeck = {
            deckCount: 40,
            mill: jest.fn(),
            draw: jest.fn().mockReturnValue(['Drawn Card'])
        };

        const result = card.processFreeCard(mockDeck as any);

        expect(mockDeck.mill).toHaveBeenCalledWith(2);
        expect(mockDeck.draw).toHaveBeenCalledWith(1);
        expect(result).toEqual(['Drawn Card']);
    });
});