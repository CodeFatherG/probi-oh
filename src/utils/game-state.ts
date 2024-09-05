import { Card, CreateCard, FreeCard } from "./card";
import { CardDetails } from "./card-details";
import { buildDeck, Deck } from "./deck";


export interface SerialisedGameState {
    hand: { name: string; details: CardDetails }[];
    deck: { name: string; details: CardDetails }[];
    banishPile: { name: string; details: CardDetails }[];
    graveyard: { name: string; details: CardDetails }[];
    cardsPlayedThisTurn: { name: string; details: CardDetails }[];
}

/** Represents the current state of a game */
export class GameState {
    private _deck: Deck;
    private _hand: Card[] = [];
    private _banishPile: Card[] = [];
    private _graveyard: Card[] = [];
    private _cardsPlayed: Card[] = [];

    /**
     * Creates a new GameState
     * @param deck - The deck to use for this game
     * @param handSize - The number of cards to draw for the initial hand
     */
    constructor(deck: Deck) {
        this._deck = deck.deepCopy();
        this._deck.shuffle();
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

    public serialise(): SerialisedGameState {
        return {
            hand: this.hand.map(card => ({ name: card.name, details: card.details })),
            deck: this.deck.deckList.map(card => ({ name: card.name, details: card.details })),
            banishPile: this.banishPile.map(card => ({ name: card.name, details: card.details })),
            graveyard: this.graveyard.map(card => ({ name: card.name, details: card.details })),
            cardsPlayedThisTurn: this.cardsPlayedThisTurn.map(card => ({ name: card.name, details: card.details }))
        };
    }

    public static deserialize(serialisedGameState: SerialisedGameState): GameState {
        const deck = buildDeck(new Map(serialisedGameState.deck.map(c => [c.name, c.details])));
        const gameState = new GameState(deck);
        gameState._hand = serialisedGameState.hand.map(c => CreateCard(c.name, c.details));
        gameState._banishPile = serialisedGameState.banishPile.map(c => CreateCard(c.name, c.details));
        gameState._graveyard = serialisedGameState.graveyard.map(c => CreateCard(c.name, c.details));
        gameState._cardsPlayed = serialisedGameState.cardsPlayedThisTurn.map(c => CreateCard(c.name, c.details));
        return gameState;
    }

    public drawHand(handSize: number = 5): void {
        this._hand = Array(handSize).fill(null).map(() => this._deck.drawCard());
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

    public discardFromHand(cards: Card[]) {
        this._graveyard.push(...cards);
        this._hand = this._hand.filter(card => !cards.includes(card));
    }

    public banishFromHand(cards: Card[]) {
        this._banishPile.push(...cards);
        this._hand = this._hand.filter(card => !cards.includes(card));
    }

    /** Gets the current deck */
    get deck(): Deck {
        return this._deck;
    }

    /** Gets the current hand */
    get hand(): Card[] {
        return this._hand;
    }

    /** Gets the banish pile */
    get banishPile(): Readonly<Card[]> {
        return this._banishPile;
    }

    /** Gets the graveyard */
    get graveyard(): Readonly<Card[]> {
        return this._graveyard;
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
