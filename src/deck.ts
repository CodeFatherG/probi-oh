import { Card, CardDetails } from "./card.js";

export class Deck {
    private _cards: Card[];
    private _deck_list: Card[];

    constructor(cards: Card[]) {
        const missingCount = 40 - cards.length;
        if (missingCount > 0) {
            cards.push(...Array(missingCount).fill(new Card("Empty Card", {tags: ["Empty", "Blank", "Non Engine"]})));
        }
        this._cards = cards;
        this._deck_list = cards.slice()
        this.shuffle();
    }

    deepCopy(): Deck {
        const newDeck = new Deck([]);
        newDeck._cards = this._cards.map(card => new Card(card.name, { ...card.details }));
        newDeck._deck_list = newDeck._cards.slice();
        return newDeck;
    }

    drawCard(): Card {
        const index = Math.floor(Math.random() * this._cards.length);
        return this._cards.splice(index, 1)[0];
    }

    shuffle(): void {
        for (let i = this._cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this._cards[i], this._cards[j]] = [this._cards[j], this._cards[i]];
        }
    }

    get deckList(): Card[] {
        return this._cards;
    }

    get deckCount(): number {
        return this._cards.length;
    }
}

export function buildDeck(deckList: Record<string, CardDetails>): Deck {
    const cards: Card[] = [];
    for (const [card, details] of Object.entries(deckList)) {
        const qty = details.qty ?? 1;
        cards.push(...Array(qty).fill(new Card(card, details)));
    }
    return new Deck(cards);
}
