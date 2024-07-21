import { Card } from './card';
import { GameState } from './game-state';

/** Base condition interface for card evaluation */
export interface BaseCondition {
    /** Evaluates the condition against a game state */
    evaluate(gameState: GameState): boolean;

    /** The cards in the hand required for this condition */
    requiredCards(hand: Card[]): Card[];

    /** Number of successful evaluations */
    get successes(): Readonly<number>;
}

export enum LocationConditionTarget {
    Hand,
    Deck
}

/** Specific condition for card evaluation */
export class Condition implements BaseCondition {
    private _successes: number = 0;

    /**
     * Creates a new Condition
     * @param cardName - Name of the card to evaluate
     * @param quantity - Quantity to compare against
     * @param operator - Comparison operator
     */
    constructor(
        readonly cardName: string, 
        readonly quantity: number = 1, 
        readonly operator: string = '>=',
        readonly location: LocationConditionTarget = LocationConditionTarget.Hand
    ) {
    }

    /** Number of successful evaluations */
    get successes(): Readonly<number> {
        return this._successes;
    }

    /** Evaluates the condition against a hand of cards */
    evaluate(gameState: GameState): boolean {
        let count = 0;
        if (this.location === LocationConditionTarget.Deck) {
            count = gameState.deck.deckList.filter(card => card.name === this.cardName || (card.tags && card.tags.includes(this.cardName))).length            
        } else {
            count = gameState.hand.filter(card => card.name === this.cardName || (card.tags && card.tags.includes(this.cardName))).length;
        }

        let result = false;
        switch(this.operator) {
            case '>=': result = count >= this.quantity; break;
            case '=': result = count === this.quantity; break;
            case '<=': result = count <= this.quantity; break;
            default: throw new Error(`Unknown operator: ${this.operator}`);
        }

        this._successes += result ? 1 : 0;
        return result;
    }

    requiredCards(hand: Card[]): Card[] {
        let _hand = hand.slice();
        let _requiredCards = [];
        // Remove cards used for this condition
        for (let i = 0; i < this.quantity; i++) {
            const index = _hand.findIndex(card => card.name === this.cardName || (card.tags && card.tags.includes(this.cardName)));
            if (index === -1) {
                console.error(`Failed to find card: ${this.cardName}`);
                return [];
            }

            _requiredCards.push(_hand[index]);
            _hand.splice(index, 1);
        }

        return _requiredCards;
    }
}

/** Logical AND condition composed of multiple base conditions */
export class AndCondition implements BaseCondition {
    private _successes: number = 0;

    /**
     * Creates a new AndCondition
     * @param conditions - Array of BaseCondition objects
     */
    constructor(readonly conditions: BaseCondition[]) {
        if (conditions.some(condition => condition == undefined)) {
            console.error(`Found a dead condition`);
        }
    }

    /** Number of successful evaluations */
    get successes(): Readonly<number> {
        return this._successes;
    }

    /** Evaluates the AND condition against a game state */
    evaluate(gameState: GameState): boolean {
        let result = this.conditions.every(condition => condition.evaluate(gameState));
        this._successes += result ? 1 : 0;
        return result;
    }

    requiredCards(hand: Card[]): Card[] {
        let _hand = hand.slice();

        return this.conditions.flatMap(condition => {
            let cardsUsed = condition.requiredCards(_hand);
            _hand = _hand.filter(card => !cardsUsed.includes(card));
            return cardsUsed;
        });
    }
}

/** Logical OR condition composed of multiple base conditions */
export class OrCondition implements BaseCondition {
    private _successes: number = 0;

    /**
     * Creates a new OrCondition
     * @param conditions - Array of BaseCondition objects
     */
    constructor(readonly conditions: BaseCondition[]) {
        if (conditions.some(condition => condition == undefined)) {
            console.error(`Found a dead condition`);
        }
    }

    /** Number of successful evaluations */
    get successes(): Readonly<number> {
        return this._successes;
    }

    /** Evaluates the OR condition against a a game state */
    evaluate(gameState: GameState): boolean {
        let result = this.conditions.some(condition => condition.evaluate(gameState));
        this._successes += result ? 1 : 0;
        return result;
    }

    requiredCards(hand: Card[]): Card[] {
        let _hand = hand.slice();

        return this.conditions.flatMap(condition => {
            let cardsUsed = condition.requiredCards(_hand);
            _hand = _hand.filter(card => !cardsUsed.includes(card));
            return cardsUsed;
        });
    }
}