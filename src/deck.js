import { CreateCard } from "./card.js";
/** Represents a deck of cards */
export class Deck {
    /**
     * Creates a new Deck
     * @param cards - Initial array of Cards
     * @param deckSize - Size of the deck (default 40)
     */
    constructor(cards, deckSize = 40) {
        const missingCount = deckSize - cards.length;
        if (missingCount > 0) {
            cards.push(...Array(missingCount).fill(CreateCard("Empty Card", { tags: ["Empty", "Blank", "Non Engine"] })));
        }
        this._cards = cards.slice();
        this.shuffle();
    }
    /** Creates a deep copy of the deck */
    deepCopy() {
        const newDeck = new Deck([], this._cards.length);
        newDeck._cards = this._cards.map(card => CreateCard(card.name, Object.assign({}, card.details)));
        return newDeck;
    }
    /** Draws a card from the top of the deck */
    drawCard() {
        if (this._cards.length === 0) {
            throw new Error("Cannot draw from an empty deck");
        }
        return this._cards.pop();
    }
    /** Shuffles the deck */
    shuffle() {
        for (let i = this._cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this._cards[i], this._cards[j]] = [this._cards[j], this._cards[i]];
        }
    }
    /** Gets the list of cards in the deck */
    get deckList() {
        return Object.freeze([...this._cards]);
    }
    /** Gets the number of cards in the deck */
    get deckCount() {
        return this._cards.length;
    }
}
/**
 * Builds a deck from a record of card details
 * @param deckList - Record of card names and their details
 * @returns A new Deck instance
 */
export function buildDeck(deckList) {
    var _a;
    const cards = [];
    for (const [card, details] of Object.entries(deckList)) {
        const qty = (_a = details.qty) !== null && _a !== void 0 ? _a : 1;
        cards.push(...Array(qty).fill(CreateCard(card, details)));
    }
    return new Deck(cards);
}
