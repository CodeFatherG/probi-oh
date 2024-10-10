import { Card, CreateCard } from "@server/card";
import { GameState } from "@server/game-state";
import { MockDeck } from "./deck.mock";

export class MockGameState extends GameState {
    constructor(deck: MockDeck) {
        super(deck);
    }

    override deepCopy(): GameState {
        const newState = new MockGameState(this._deck as MockDeck);
        this._deck = this._deck.deepCopy(); // need to recopy the deck since the constructor will draw a hand
        newState._hand = this._hand.map(card => CreateCard(card.name, { ...card.details }));
        newState._banishPile = this._banishPile.map(card => CreateCard(card.name, { ...card.details }));
        newState._graveyard = this._graveyard.map(card => CreateCard(card.name, { ...card.details }));
        return newState;
    }

    get mockDeck(): MockDeck {
        return this._deck as MockDeck;
    }

    setHand(cards: Card[]): void {
        this._hand = cards;
    }

    addCardToHand(card: Card): void {
        this._hand.push(card);
    }

    removeCardFromHand(cardName: string): Card | undefined {
        const index = this._hand.findIndex(card => card.name === cardName);
        if (index !== -1) {
            return this._hand.splice(index, 1)[0];
        }
        return undefined;
    }

    setBanishPile(cards: Card[]): void {
        this._banishPile = cards;
    }

    setGraveyard(cards: Card[]): void {
        this._graveyard = cards;
    }

    setCardsPlayed(cards: Card[]): void {
        this._cardsPlayed = cards;
    }
}