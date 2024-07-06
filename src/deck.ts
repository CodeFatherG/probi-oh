import { Card, CardDetails } from "./card.js";

class Deck {
    private _cards: Card[];
    private _deck_list: Card[];
    private _banished: Card[];
    private _grave: Card[];

    constructor(cards: Card[]) {
        const missingCount = 40 - cards.length;
        if (missingCount > 0) {
            cards.push(...Array(missingCount).fill(new Card("Empty Card", {tags: ["Empty", "Blank", "Non Engine"]})));
        }
        this._cards = cards;
        this._deck_list = cards.slice()
        this.shuffle();

        this._banished = [];
        this._grave = [];
    }

    deepCopy(): Deck {
        const newDeck = new Deck([]);
        newDeck._cards = this._cards.map(card => new Card(card.name, { ...card.details }));
        newDeck._deck_list = newDeck._cards.slice();
        newDeck._banished = this._banished.map(card => new Card(card.name, { ...card.details }));
        newDeck._grave = this._grave.map(card => new Card(card.name, { ...card.details }));
        return newDeck;
    }

    drawCard(): Card {
        const index = Math.floor(Math.random() * this._cards.length);
        return this._cards.splice(index, 1)[0];
    }

    draw(count: number): Card[] {
        const hand: Card[] = [];
        for (let i = 0; i < count; i++) {
            const card = this.drawCard();
            if (card.cardIsFree) {
                hand.push(...card.processFreeCard(this));
            } else {
                hand.push(card);
            }
        }

        console.log(`Cards in hand: ${hand.map(card => card.name).join(', ')}`);

        return hand;
    }

    shuffle(): void {
        console.log('Shuffling the deck')
        for (let i = this._cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this._cards[i], this._cards[j]] = [this._cards[j], this._cards[i]];
        }
    }

    reset(): void {
        let countBefore = this.deckList.length
        this._cards = this._deck_list.slice()
        this.shuffle()
        this._banished = [];
        this._grave = [];
        console.log(`Resetting the deck from ${countBefore} to ${this.deckList.length}`)
    }

    banish(count: number): void {
        const hand: Card[] = [];
        for (let i = 0; i < count; i++) {
            const card = this.drawCard();
            hand.push(card);
        }

        console.log(`Cards banished: ${hand.map(card => card.name).join(', ')}`);

        this._banished.push(...hand);
    }

    mill(count: number): void {
        const hand: Card[] = [];
        for (let i = 0; i < count; i++) {
            const card = this.drawCard();
            hand.push(card);
        }

        console.log(`Cards milled: ${hand.map(card => card.name).join(', ')}`);

        this._grave.push(...hand);
    }

    get deckList(): Card[] {
        return this._cards;
    }

    get deckCount(): number {
        return this._cards.length;
    }

    get banishedCards(): Card[] {
        return this._banished;
    }

    get graveCards(): Card[] {
        return this._grave;
    }
}

function buildDeck(deckList: Record<string, CardDetails>): Deck {
    const cards: Card[] = [];
    for (const [card, details] of Object.entries(deckList)) {
        const qty = details.qty ?? 1;
        cards.push(...Array(qty).fill(new Card(card, details)));
    }
    return new Deck(cards);
}

export { Deck, buildDeck };
