export interface CardDetails {
    readonly qty?: number;
    readonly tags?: readonly string[];
    readonly free?: {
        readonly cost?: number;
        readonly cards?: number;
        readonly destination?: string;
    };
}

export class Card {
    private readonly _tags: string[] | null;
    private readonly _free: CardDetails['free'] | null;

    constructor(
        private readonly _name: string,
        private readonly _details: CardDetails
    ) {
        this._tags = _details.tags ? [..._details.tags] : null;
        this._free = _details.free ?? null;
    }

    get name(): Readonly<string> {
        return this._name;
    }

    get tags(): Readonly<string[]> | null {
        return this._tags;
    }

    get details(): Readonly<CardDetails> {
        return this._details;
    }

    get isFree(): Readonly<boolean> {
        return this._free != null;
    }

    get freeCardDetails(): Readonly<CardDetails['free']> | null {
        return this._free;
    }
}