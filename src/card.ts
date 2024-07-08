import { Deck } from './deck.js';

export interface CardDetails {
    qty?: number;
    tags?: string[];
    free?: {
        cost?: number;
        cards?: number;
        destination?: string;
    };
}

export class Card {
    private _name: string;
    private _details: CardDetails;
    private _tags: string[] | null;
    private _free: CardDetails['free'] | null;

    constructor(cardName: string, cardDetails: CardDetails) {
        this._name = cardName;
        this._details = cardDetails;
        this._tags = cardDetails.tags || null;
        this._free = cardDetails.free || null;
    }

    get name(): string {
        return this._name;
    }

    get nameLower(): string {
        return this.name.toLowerCase();
    }

    get tags(): string[] | null {
        return this._tags;
    }

    get details(): CardDetails {
        return this._details;
    }

    get cardIsFree(): boolean {
        return this._free != null;
    }

    get freeCardDetails(): CardDetails['free'] | null {
        return this._free;
    }
}