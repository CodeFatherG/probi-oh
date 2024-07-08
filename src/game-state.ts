import { Card } from "./card";
import { Deck } from "./deck";

export class GameState {
    private _deck: Deck;
    private _hand: Card[];
    private _banishPile: Card[];
    private _graveyard: Card[];

    constructor(deck: Deck, handSize: number = 5) {
        this._deck = deck.deepCopy();
        this._deck.shuffle();
        this._hand = [...Array(handSize)].map(() => this._deck.drawCard());

        this._banishPile = [];
        this._graveyard = [];
    }

    deepCopy(): GameState {
        const newState = new GameState(this._deck);
        this._deck = this._deck.deepCopy(); // need to recopy the deck since the constructor will draw a hand
        newState._hand = this._hand.map(card => new Card(card.name, { ...card.details }));
        newState._banishPile = this._banishPile.map(card => new Card(card.name, { ...card.details }));
        newState._graveyard = this._graveyard.map(card => new Card(card.name, { ...card.details }));
        return newState;
    }

    get deck(): Deck {
        return this._deck;
    }

    get hand(): Card[] {
        return this._hand;
    }

    get banishPile(): Card[] {
        return this._banishPile;
    }

    get graveyard(): Card[] {
        return this._graveyard;
    }
}