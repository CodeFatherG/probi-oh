import { Deck, buildDeck } from '../src/utils/deck';
import { Card, CreateCard } from '../src/utils/card';
import { CardDetails } from '../src/utils/card-details';

describe('Deck', () => {
    describe('constructor', () => {
        it('should create a deck with the given cards', () => {
            const cards = [
                CreateCard('Card A', { tags: ['Tag1'] }),
                CreateCard('Card B', { tags: ['Tag2'] })
            ];
            const deck = new Deck(cards);
            expect(deck.deckCount).toBe(40);
            expect(deck.deckList.filter(card => card.name !== 'Empty Card').length).toBe(2);
        });

        it('should fill the deck with Empty Cards if less than 40 cards are provided', () => {
            const cards = [CreateCard('Card A', { tags: ['Tag1'] })];
            const deck = new Deck(cards);
            expect(deck.deckCount).toBe(40);
            expect(deck.deckList.filter(card => card.name === 'Empty Card').length).toBe(39);
        });

        it('should not add Empty Cards if 40 or more cards are provided', () => {
            const cards = Array(40).fill(null).map((_, i) => CreateCard(`Card ${i}`, { tags: ['Tag'] }));
            const deck = new Deck(cards);
            expect(deck.deckCount).toBe(40);
            expect(deck.deckList.filter(card => card.name === 'Empty Card').length).toBe(0);
        });
    });

    describe('deepCopy', () => {
        it('should create a deep copy of the deck', () => {
            const originalDeck = new Deck([CreateCard('Card A', { tags: ['Tag1'] })]);
            const copiedDeck = originalDeck.deepCopy();

            expect(copiedDeck).not.toBe(originalDeck);
            expect(copiedDeck.deckCount).toBe(originalDeck.deckCount);
            expect(copiedDeck.deckList).not.toBe(originalDeck.deckList);
            expect(copiedDeck.deckList[0]).not.toBe(originalDeck.deckList[0]);
            expect(copiedDeck.deckList[0].name).toBe(originalDeck.deckList[0].name);
        });
    });

    describe('drawCard', () => {
        it('should remove and return a random card from the deck', () => {
            const cards: Card[] = Array(40).fill(null).map((_, index) => 
                CreateCard(`Card ${String.fromCharCode(65 + index % 26)}`, { tags: ['Tag1'] })
            );

            const deck = new Deck(cards);
            const initialCount = deck.deckCount;
            const drawnCard = deck.drawCard();

            expect(deck.deckCount).toBe(initialCount - 1);
            expect(cards.map(card => card.name)).toContain(drawnCard.name);
        });
    });

    describe('shuffle', () => {
        it('should shuffle the deck', () => {
            const cards = Array(40).fill(null).map((_, i) => CreateCard(`Card ${i}`, { tags: ['Tag'] }));
            const deck = new Deck(cards);
            const originalOrder = [...deck.deckList].map(card => card.name);
            
            deck.shuffle();
            const shuffledOrder = deck.deckList.map(card => card.name);

            expect(shuffledOrder).not.toEqual(originalOrder);
            expect(shuffledOrder.sort()).toEqual(originalOrder.sort());
        });

        test('shuffle uses injected random function', () => {
            const cards = [
                CreateCard('Card1', {}),
                CreateCard('Card2', {}),
                CreateCard('Card3', {})
            ];
            const deck = new Deck(cards, 3);
            const mockRandom = jest.fn()
                .mockReturnValueOnce(0.5)
                .mockReturnValueOnce(0.2);
        
            deck.shuffle(mockRandom);
        
            expect(mockRandom).toHaveBeenCalledTimes(2);
            // You can add more specific assertions about the order of cards if needed
        });
    });

    describe('deckList', () => {
        it('should return the list of cards in the deck', () => {
            const cards = [
                CreateCard('Card A', { tags: ['Tag1'] }),
                CreateCard('Card B', { tags: ['Tag2'] })
            ];
            const deck = new Deck(cards);
            expect(deck.deckList.length).toBe(40);
            expect(deck.deckList.filter(card => card.name !== 'Empty Card')).toHaveLength(2);
        });
    });

    describe('deckCount', () => {
        it('should return the number of cards in the deck', () => {
            const cards = [
                CreateCard('Card A', { tags: ['Tag1'] }),
                CreateCard('Card B', { tags: ['Tag2'] })
            ];
            const deck = new Deck(cards);
            expect(deck.deckCount).toBe(40);
        });
    });
});

describe('buildDeck', () => {
    it('should build a deck from a record of card details', () => {
        const deckList: Record<string, CardDetails> = {
            'Card A': { qty: 3, tags: ['Tag1'] },
            'Card B': { qty: 2, tags: ['Tag2'] },
            'Card C': { tags: ['Tag3'] } // Testing default quantity
        };
        const deck = buildDeck(deckList);

        expect(deck).toBeInstanceOf(Deck);
        expect(deck.deckCount).toBe(40);
        expect(deck.deckList.filter((card: Card) => card.name === 'Card A')).toHaveLength(3);
        expect(deck.deckList.filter((card: Card) => card.name === 'Card B')).toHaveLength(2);
        expect(deck.deckList.filter((card: Card) => card.name === 'Card C')).toHaveLength(1);
    });

    it('should handle empty deck list', () => {
        const deckList: Record<string, CardDetails> = {};
        const deck = buildDeck(deckList);

        expect(deck).toBeInstanceOf(Deck);
        expect(deck.deckCount).toBe(40);
        expect(deck.deckList.every((card: Card) => card.name === 'Empty Card')).toBe(true);
    });
});