import { CreateCard } from "./card.js";
;
;
/** Represents the current state of a game */
export class GameState {
    /**
     * Creates a new GameState
     * @param deck - The deck to use for this game
     * @param handSize - The number of cards to draw for the initial hand
     */
    constructor(deck, handSize = 5) {
        this._banishPile = [];
        this._graveyard = [];
        this._cardsPlayed = [];
        this._deck = deck.deepCopy();
        this._deck.shuffle();
        this._hand = [...Array(handSize)].map(() => this._deck.drawCard());
    }
    /** Creates a deep copy of the game state */
    deepCopy() {
        const newState = new GameState(this._deck);
        this._deck = this._deck.deepCopy(); // need to recopy the deck since the constructor will draw a hand
        newState._hand = this._hand.map(card => CreateCard(card.name, Object.assign({}, card.details)));
        newState._banishPile = this._banishPile.map(card => CreateCard(card.name, Object.assign({}, card.details)));
        newState._graveyard = this._graveyard.map(card => CreateCard(card.name, Object.assign({}, card.details)));
        return newState;
    }
    playCard(card) {
        if (!this._hand.includes(card)) {
            console.error("Card is not in the player's hand");
            return;
        }
        if (card.isFree) {
            const freeCard = card;
            if (freeCard.oncePerTurn && this.cardsPlayedThisTurn.some(usedCard => usedCard.name === card.name)) {
                console.error("Card has already been played this turn and is only usable once per turn");
            }
        }
        this._cardsPlayed.push(card);
        this._hand = this._hand.filter(handCard => handCard !== card);
    }
    discard(cards) {
        this._graveyard.push(...cards);
        this._hand = this._hand.filter(card => !cards.includes(card));
    }
    banish(cards) {
        this._banishPile.push(...cards);
        this._hand = this._hand.filter(card => !cards.includes(card));
    }
    /** Gets the current deck */
    get deck() {
        return this._deck;
    }
    /** Gets the current hand */
    get hand() {
        return this._hand;
    }
    /** Gets the banish pile */
    get banishPile() {
        return this._banishPile;
    }
    /** Gets the graveyard */
    get graveyard() {
        return this._graveyard;
    }
    /** Gets the free cards in hand */
    get freeCardsInHand() {
        return this._hand.filter(card => card.isFree);
    }
    /** Gets the cards played this turn */
    get cardsPlayedThisTurn() {
        return this._cardsPlayed;
    }
    get freeCardsPlayedThisTurn() {
        return this.cardsPlayedThisTurn.filter(card => card.isFree);
    }
}
