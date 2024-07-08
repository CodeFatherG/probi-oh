import { GameState } from '../src/game-state';
import { Deck } from '../src/deck';
import { Card } from '../src/card';

describe('GameState', () => {
    let testDeck: Deck;

    beforeEach(() => {
        testDeck = new Deck(Array(40).fill(null).map((_, i) => new Card(`Card ${i}`, {})));
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
});