import { Card } from "./card.js";
import { Deck } from "./deck.js";

class Hand {
    private _deck: Deck;
    private _handSize: number;
    private _cards: Card[];

    constructor(deck: Deck, handSize: number) {
        this._deck = deck;
        this._handSize = handSize;
        this._cards = deck.draw(this._handSize);
    }

    get deck(): Deck {
        return this._deck;
    }

    get handSize(): number {
        return this._handSize;
    }

    get cards(): Card[] {
        return this._cards;
    }

    get hasFreeCard(): boolean {
        return this.cards.some(c => c.cardIsFree);
    }

    get freeCards(): Card[] {
        return this.cards.filter(c => c.cardIsFree);
    }

    get lowestCostFreeCard(): Card | undefined {
        return this.freeCards.reduce((min, current) => 
            (min.details.free?.cost || Infinity) < (current.details.free?.cost || Infinity) ? min : current
        );
    }
}