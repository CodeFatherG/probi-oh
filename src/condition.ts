import { Card } from './card';

/** Base condition interface for card evaluation */
export interface BaseCondition {
    /** Evaluates the condition against a hand of cards */
    evaluate(hand: Card[]): boolean;

    /** Number of successful evaluations */
    get successes(): Readonly<number>;
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
        readonly operator: string = '>='
    ) {
    }

    /** Number of successful evaluations */
    get successes(): Readonly<number> {
        return this._successes;
    }

    /** Evaluates the condition against a hand of cards */
    evaluate(hand: Card[]): boolean {
        const count = hand.filter(card => card.name === this.cardName || (card.tags && card.tags.includes(this.cardName))).length;

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

    /** Evaluates the AND condition against a hand of cards */
    evaluate(hand: Card[]): boolean {
        let result = this.conditions.every(condition => condition.evaluate(hand));
        this._successes += result ? 1 : 0;
        return result;
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

    /** Evaluates the OR condition against a hand of cards */
    evaluate(hand: Card[]): boolean {
        let result = this.conditions.some(condition => condition.evaluate(hand));
        this._successes += result ? 1 : 0;
        return result;
    }
}