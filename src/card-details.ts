/**
 * The type of cost that a free card must pay
 */
export enum CostType {
    BanishFromDeck,
    BanishFromHand,
    PayLife,
    Discard,
}

/**
 * The type of a condition that the free card imposes
 */
export enum ConditionType {
    Discard,
    BanishFromHand,
    BanishFromDeck,
}

/**
 * The type of restriction that the free card imposes
 */
export enum RestrictionType {
    NoSpecialSummon,
    NoMoreDraws,
    NoPreviousDraws,
}

/**
 * Represents the details of a free card in the game.
 */
export interface FreeCardDetails {
    /**
     * The number of free draws this card gives
     */
    count?: number;

    /**
     * If this card can only be used once per turn
     */
    oncePerTurn: boolean;

    /**
     * The cost that must be paid to use this card. If null then cost is not required
     */
    cost?: {
        /**
         * The type of cost that must be paid
         */
        type: CostType;

        /**
         * The value of the cost.
         */
        value: number | string[];
    };

    /**
     * The condition that must be met to use this card. If null then no condition is imposed
     */
    condition?: {
        /**
         * The type of condition that is imposed
         */
        type: ConditionType;

        /**
         * The value of the condition.
         */
        value: number | string;
    };

    /**
     * The restrictions that this card imposes. If null then no restrictions are imposed
     */
    restriction?: RestrictionType[];

    /**
     * The number of cards that must be excavated to use this card. If null then no excavation is required
     */
    excavate?: {
        /**
         * The number of cards that must be excavated
         */
        count: number;

        /**
         * The number of cards that must be picked from the excavated cards
         */
        pick: number;
    }
}

/**
 * Represents the details of a card in the game.
 * @interface
 */
export interface CardDetails {
    /**
     * The quantity of the card in the deck.
     */
    qty?: number;
    /**
     * The tags associated with the card.
     */
    tags?: readonly string[];
    /**
     * The details of a free card.
     */
    free?: FreeCardDetails;
}
