import { Card } from './card';
import { GameState } from './game-state';

/** Base condition interface for card evaluation */
export interface BaseCondition {
    /** Evaluates the condition against a game state */
    evaluate(gameState: GameState): boolean;

    /** The cards in the hand required for this condition */
    requiredCards(hand: Card[]): Card[];

    toString(): string;

    /** Number of successful evaluations */
    get successes(): number;
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

    private CardsInList(list: Card[] | Readonly<Card[]>): number {
        return list.filter(card => card.name === this.cardName || (card.tags && card.tags.includes(this.cardName))).length;
    }

    /** Evaluates the condition against a hand of cards */
    public evaluate(gameState: GameState): boolean {
        let count = 0;
        switch (this.location) {
            case LocationConditionTarget.Deck:
                count = this.CardsInList(gameState.deck.deckList);
                break;
            default:
                console.error(`Unknown location: ${this.location}`);
                // Fallthrough to Hand case
            case LocationConditionTarget.Hand:
                count = this.CardsInList(gameState.hand);
                break;
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
        const _hand = hand.slice();
        const _requiredCards = [];
        // Remove cards used for this condition
        for (let i = 0; i < this.quantity; i++) {
            const index = _hand.findIndex(card => card.name === this.cardName || (card.tags && card.tags.includes(this.cardName)));
            if (index === -1) {
                return [];
            }

            _requiredCards.push(_hand[index]);
            _hand.splice(index, 1);
        }

        return _requiredCards;
    }

    toString(): string {
        function operatorToSign(operator: string): string {
            switch (operator) {
                case '>=': return '+';
                case '=': return '';
                case '<=': return '-';
                default: return operator;
            }
        }
        return `${this.quantity}${operatorToSign(this.operator)} ${this.cardName} IN ${LocationConditionTarget[this.location]}`;
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
        // init as a pass
        let result = true;
        this.conditions.forEach(condition => {
            if (!condition.evaluate(gameState)) {
                // then if any result fails consider the overall failure (.every)
                result = false;
            }
        });
        this._successes += result ? 1 : 0;
        return result;
    }

    requiredCards(hand: Card[]): Card[] {
        let _hand = hand.slice();

        return this.conditions.flatMap(condition => {
            const cardsUsed = condition.requiredCards(_hand);
            _hand = _hand.filter(card => !cardsUsed.includes(card));
            return cardsUsed;
        });
    }

    toString(): string {
        return `(${this.conditions.map(c => c.toString()).join(' AND ')})`;
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
        // init as a fail
        let result = false;
        this.conditions.forEach(condition => {
            if (condition.evaluate(gameState)) {
                // then if any result passes consider the overall failure (.some)
                result = true;
            }
        });
        this._successes += result ? 1 : 0;
        return result;
    }

    requiredCards(hand: Card[]): Card[] {
        let _hand = hand.slice();

        return this.conditions.flatMap(condition => {
            const cardsUsed = condition.requiredCards(_hand);
            _hand = _hand.filter(card => !cardsUsed.includes(card));
            return cardsUsed;
        });
    }

    toString(): string {
        return `(${this.conditions.map(c => c.toString()).join(' OR ')})`;
    }
}