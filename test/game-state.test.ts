import { GameState, excavationCb } from '../src/game-state';
import { Deck } from '../src/deck';
import { Card, CreateCard, FreeCard } from '../src/card';
import { CardDetails, CostType, RestrictionType } from '../src/card-details';

describe('GameState', () => {
    let testDeck: Deck;

    beforeEach(() => {
        // Use a seeded deck for deterministic behavior in tests
        testDeck = new Deck(Array(40).fill(null).map((_, i) => CreateCard(`Card ${i}`, {})), 40);
    });

    it('should initialize with the correct hand size', () => {
        const gameState = new GameState(testDeck, 5);
        expect(gameState.hand.length).toBe(5);
        expect(gameState.deck.deckCount).toBe(35);
    });

    it('should create a deep copy', () => {
        const gameState = new GameState(testDeck);
        const copiedState = gameState.deepCopy();
        expect(copiedState).not.toBe(gameState);
        expect(copiedState.hand).not.toBe(gameState.hand);
        expect(copiedState.deck).not.toBe(gameState.deck);
        expect(copiedState.banishPile).not.toBe(gameState.banishPile);
        expect(copiedState.graveyard).not.toBe(gameState.graveyard);
    });

    it('should have empty banish pile and graveyard initially', () => {
        const gameState = new GameState(testDeck);
        expect(gameState.banishPile).toHaveLength(0);
        expect(gameState.graveyard).toHaveLength(0);
    });

    it('should return free cards from hand', () => {
        const freeCard = CreateCard('Free Card', { free: { oncePerTurn: false } });
        const nonFreeCard = CreateCard('Non-Free Card', {});
        const customDeck = new Deck([freeCard, nonFreeCard], 2);
        const gameState = new GameState(customDeck, 2);
        expect(gameState.freeCardsInHand).toHaveLength(1);
        expect(gameState.freeCardsInHand[0].name).toBe('Free Card');
    });

    describe('deepCopy', () => {
        it('should create a deep copy with banish pile and graveyard', () => {
            const initialDeck = new Deck([...Array(40).fill(null).map((_, i) => CreateCard(`Card ${i}`, {}))]);
            const gameState = new GameState(initialDeck);
            gameState['_banishPile'].push(CreateCard('Banished Card', {}));
            gameState['_graveyard'].push(CreateCard('Discarded Card', {}));
            
            const copiedState = gameState.deepCopy();
            
            expect(copiedState.banishPile).toHaveLength(1);
            expect(copiedState.banishPile[0].name).toBe('Banished Card');
            expect(copiedState.graveyard).toHaveLength(1);
            expect(copiedState.graveyard[0].name).toBe('Discarded Card');
        });
    });
});