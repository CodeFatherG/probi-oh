import { CardDetails, ConditionType, CostType, RestrictionType } from "./card-details";

/**
 * Represents a card in the game.
 * @class
 */
class Card {
    private readonly _name: string;
    private readonly _details: CardDetails;
    private readonly _tags: readonly string[] | null;

    /**
     * Creates an instance of Card.
     * @param {string} cardName - The name of the card.
     * @param {CardDetails} cardDetails - The details of the card.
     */
    constructor(cardName: string, cardDetails: CardDetails) {
        this._name = cardName;
        this._details = cardDetails;
        this._tags = cardDetails.tags || null;
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
        return false;
    }
}

class FreeCard extends Card
{
    constructor(cardName: string, cardDetails: CardDetails)
    {
        if (!cardDetails.free)
        {
            throw new Error('Card does not have free details');
        }
        super(cardName, cardDetails);
    }

    get isFree(): boolean
    {
        return true;
    }

    get Count(): number
    {
        return this.details.free!.count;
    }

    get OncePerTurn(): boolean
    {
        return this.details.free!.oncePerTurn;
    }

    get Restrictions(): RestrictionType[]
    {
        return this.details.free!.restriction || [];
    }

    get Cost(): {type: CostType, value: number | string[]} | null
    {
        return this.details.free!.cost!;
    }

    get Condition(): {type: ConditionType, value: number | string} | null
    {
        return this.details.free!.condition!;
    }

    get Excavate(): {count: number, pick: number} | null
    {
        return this.details.free!.excavate!;
    }
}

export function CreateCard(cardName: string, cardDetails: CardDetails): Card {
    if (cardDetails.free) {
        return new FreeCard(cardName, cardDetails);
    }
    return new Card(cardName, cardDetails);
}

export type { Card, FreeCard};
