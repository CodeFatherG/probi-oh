import { Card, CreateCard, FreeCard } from "./card";
import { CostType, RestrictionType } from "./card-details";
import { Deck } from "./deck";

/**
 * Callback function for the excavation effect of a card
 * @param cards - The cards to choose from
 * @returns The card chosen
 */
export interface excavationCb {(cards: Card[]): Card};

/**
 * Callback function for determining the cost of a card from hand
 * @param hand - The current hand
 * @param costType - The type of cost to pay
 * @returns The cards to pay the cost
 */
export interface handCostCb {(hand: Card[], costType: CostType): Card[]};

/** Represents the current state of a game */
export class GameState {
    private _deck: Deck;
    private _hand: Card[];
    private _banishPile: Card[] = [];
    private _graveyard: Card[] = [];
    private _cardsPlayed: Card[] = [];

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
    public deepCopy(): GameState {
        const newState = new GameState(this._deck);
        this._deck = this._deck.deepCopy(); // need to recopy the deck since the constructor will draw a hand
        newState._hand = this._hand.map(card => CreateCard(card.name, { ...card.details }));
        newState._banishPile = this._banishPile.map(card => CreateCard(card.name, { ...card.details }));
        newState._graveyard = this._graveyard.map(card => CreateCard(card.name, { ...card.details }));
        return newState;
    }

    public playCard(card: Card): void {
        if (!this._hand.includes(card)) {
            console.error("Card is not in the player's hand");
            return;
        }

        if (card.isFree) {
            const freeCard = card as FreeCard;
            
            if (freeCard.oncePerTurn && this.cardsPlayedThisTurn.some(usedCard => usedCard.name === card.name)) {
                console.error("Card has already been played this turn and is only usable once per turn");
            }
        }

        this._cardsPlayed.push(card);
        this._hand = this._hand.filter(handCard => handCard !== card);
    }

    public discard(cards: Card[]) {
        this._graveyard.push(...cards);
        this._hand = this._hand.filter(card => !cards.includes(card));
    }

    public banish(cards: Card[]) {
        this._banishPile.push(...cards);
        this._hand = this._hand.filter(card => !cards.includes(card));
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

    /** Gets the free cards in hand */
    get freeCardsInHand(): FreeCard[] {
        return this._hand.filter(card => card.isFree) as FreeCard[];
    }

    /** Gets the cards played this turn */
    get cardsPlayedThisTurn(): Card[] {
        return this._cardsPlayed;
    }

    get freeCardsPlayedThisTurn(): FreeCard[] {
        return this.cardsPlayedThisTurn.filter(card => card.isFree) as FreeCard[];
    }
}