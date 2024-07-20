import { CardDetails } from "./card-details";
import { Card, CreateCard } from "./card";

/** Represents a deck of cards */
export class Deck {
    private _cards: Card[];

    /**
     * Creates a new Deck
     * @param cards - Initial array of Cards
     * @param deckSize - Size of the deck (default 40)
     */
    constructor(cards: Card[], deckSize: number = 40) {
        const missingCount = deckSize - cards.length;
        if (missingCount > 0) {
            cards.push(...Array(missingCount).fill(CreateCard("Empty Card", {tags: ["Empty", "Blank", "Non Engine"]})));
        }
        this._cards = cards.slice();
        this.shuffle();
    }

    /** Creates a deep copy of the deck */
    deepCopy(): Deck {
        const newDeck = new Deck([], this._cards.length);
        newDeck._cards = this._cards.map(card => CreateCard(card.name, { ...card.details }));
        return newDeck;
    }

    /** Draws a card from the top of the deck */
    drawCard(): Card {
        if (this._cards.length === 0) {
            throw new Error("Cannot draw from an empty deck");
        }
        
        return this._cards.pop()!;
    }

    /** Shuffles the deck */
    shuffle(): void {
        for (let i = this._cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this._cards[i], this._cards[j]] = [this._cards[j], this._cards[i]];
        }
    }

    public addToBottom(cards: Card[]): void {
        this._cards.push(...cards);
    }

    /** Gets the list of cards in the deck */
    get deckList(): Readonly<Card[]> {
        return Object.freeze([...this._cards]);
    }

    /** Gets the number of cards in the deck */
    get deckCount(): number {
        return this._cards.length;
    }
}

/**
 * Builds a deck from a record of card details
 * @param deckList - Record of card names and their details
 * @returns A new Deck instance
 */
export function buildDeck(deckList: Record<string, CardDetails>): Deck {
    const cards: Card[] = [];
    for (const [card, details] of Object.entries(deckList)) {
        const qty = details.qty ?? 1;
        cards.push(...Array(qty).fill(CreateCard(card, details)));
    }
    return new Deck(cards);
}