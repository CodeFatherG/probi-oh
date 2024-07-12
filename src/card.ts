/**
 * Represents the details of a card in the game.
 * @interface
 */
export interface CardDetails {
    /**
     * The quantity of the card in the deck.
     */
    readonly qty?: number;
    /**
     * The tags associated with the card.
     */
    readonly tags?: readonly string[];
    /**
     * The details of a free card.
     */
    readonly free?: {
        /**
         * The cost of the card.
         */
        readonly cost?: number;

        /**
         * The number of cards to draw.
         */
        readonly cards?: number;

        /**
         * Where the cost is sent.
         */
        readonly destination?: string;
    };
}

/**
 * Represents a card in the game.
 * @class
 */
export class Card {
    private readonly _name: string;
    private readonly _details: CardDetails;
    private readonly _tags: readonly string[] | null;
    private readonly _free: CardDetails['free'] | null;

    /**
     * Creates an instance of Card.
     * @param {string} cardName - The name of the card.
     * @param {CardDetails} cardDetails - The details of the card.
     */
    constructor(cardName: string, cardDetails: CardDetails) {
        this._name = cardName;
        this._details = cardDetails;
        this._tags = cardDetails.tags || null;
        this._free = cardDetails.free || null;
    }

    /**
     * Gets the name of the card.
     * @returns {string} The card's name.
     */
    get name(): string {
        return this._name;
    }

    /**
     * Gets the lowercase name of the card.
     * @returns {string} The card's name in lowercase.
     */
    get nameLower(): string {
        return this.name.toLowerCase();
    }

    /**
     * Gets the tags associated with the card.
     * @returns {readonly string[] | null} An array of tags or null if no tags are present.
     */
    get tags(): readonly string[] | null {
        return this._tags;
    }

    /**
     * Gets the details of the card.
     * @returns {Readonly<CardDetails>} The card's details.
     */
    get details(): Readonly<CardDetails> {
        return this._details;
    }

    /**
     * Checks if the card is free.
     * @returns {boolean} True if the card is free, false otherwise.
     */
    get isFree(): boolean {
        return this._free != null;
    }

    /**
     * Gets the free card details if the card is free.
     * @returns {Readonly<CardDetails['free']> | null} The free card details or null if the card is not free.
     */
    get freeCardDetails(): Readonly<CardDetails['free']> | null {
        return this._free;
    }
}