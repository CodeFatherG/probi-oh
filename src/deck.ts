import { Card, CardDetails } from "./card.js";

/** Represents a deck of cards */
export class Deck {
    private _cards: Card[];

    /**
     * Creates a new Deck
     * @param cards - Initial array of Cards
     */
    constructor(cards: Card[]) {
        const missingCount = 40 - cards.length;
        if (missingCount > 0) {
            cards.push(...Array(missingCount).fill(new Card("Empty Card", {tags: ["Empty", "Blank", "Non Engine"]})));
        }
        this._cards = cards.slice();
        this.shuffle();
    }

    /** Creates a deep copy of the deck */
    deepCopy(): Deck {
        const newDeck = new Deck([]);
        newDeck._cards = this._cards.map(card => new Card(card.name, { ...card.details }));
        return newDeck;
    }

    /** Draws a random card from the deck */
    drawCard(): Card {
        const index = Math.floor(Math.random() * this._cards.length);
        return this._cards.splice(index, 1)[0];
    }

    /** Shuffles the deck */
    shuffle(): void {
        for (let i = this._cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this._cards[i], this._cards[j]] = [this._cards[j], this._cards[i]];
        }
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
        cards.push(...Array(qty).fill(new Card(card, details)));
    }
    return new Deck(cards);
}