import { Card } from "./card";
import { Deck } from "./deck";

/** Represents the current state of a game */
export class GameState {
    private _deck: Deck;
    private _hand: Card[];
    private _banishPile: Card[] = [];
    private _graveyard: Card[] = [];

    /**
     * Creates a new GameState
     * @param deck - The deck to use for this game
     * @param handSize - The number of cards to draw for the initial hand
     */
    constructor(deck: Deck, handSize: number = 5) {
        this._deck = deck.deepCopy();
        this._deck.shuffle();
        this._hand = [...Array(handSize)].map(() => this._deck.drawCard());
    }

    /** Creates a deep copy of the game state */
    deepCopy(): GameState {
        const newState = new GameState(this._deck);
        this._deck = this._deck.deepCopy(); // need to recopy the deck since the constructor will draw a hand
        newState._hand = this._hand.map(card => new Card(card.name, { ...card.details }));
        newState._banishPile = this._banishPile.map(card => new Card(card.name, { ...card.details }));
        newState._graveyard = this._graveyard.map(card => new Card(card.name, { ...card.details }));
        return newState;
    }

    /** Gets the current deck */
    get deck(): Readonly<Deck> {
        return this._deck;
    }

    /** Gets the current hand */
    get hand(): Card[] {
        return this._hand;
    }

    /** Gets the banish pile */
    get banishPile(): Readonly<Card[]> {
        return Object.freeze(this._banishPile);
    }

    /** Gets the graveyard */
    get graveyard(): Readonly<Card[]> {
        return Object.freeze(this._graveyard);
    }
}