import { Card } from "@probi-oh/core/src/card";
import { Deck } from "@probi-oh/core/src/deck";

export class MockDeck extends Deck {
    constructor(cards: Card[] = [], deckSize: number = 40) {
        super(cards, deckSize);
    }

    override deepCopy(): Deck {
        const newDeck = new MockDeck([], this._cards.length);
        newDeck.setDeckList(this._cards);
        return newDeck;
    }

    setDeckList(cards: Card[]): void {
        this._cards = cards;
    }

    addCardToDeck(card: Card, position: 'top' | 'bottom' = 'top'): void {
        if (position === 'top') {
            this._cards.unshift(card);
        } else {
            this._cards.push(card);
        }
    }

    removeCardFromDeck(cardName: string): Card | undefined {
        const index = this._cards.findIndex(card => card.name === cardName);
        if (index !== -1) {
            return this._cards.splice(index, 1)[0];
        }
        return undefined;
    }
}