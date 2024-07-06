import { Card } from './card.js';

export interface BaseCondition {
    evaluate(hand: Card[]): boolean;
    successes: number;
}

export class Condition implements BaseCondition {
    cardName: string;
    quantity: number;
    operator: string;
    successes: number;

    constructor(cardName: string, quantity: number = 1, operator: string = '>=') {
        this.cardName = cardName;
        this.quantity = quantity;
        this.operator = operator;
        this.successes = 0;
    }

    evaluate(hand: Card[]): boolean {
        const count = hand.filter(card => card.name === this.cardName || (card.tags && card.tags.includes(this.cardName))).length;

        console.log(`Found ${count} of ${this.cardName}. Looking for ${this.operator}${this.quantity}`);

        let result = false;
        switch(this.operator) {
            case '>=': result = count >= this.quantity; break;
            case '=': result = count === this.quantity; break;
            case '<=': result = count <= this.quantity; break;
            default: throw new Error(`Unknown operator: ${this.operator}`);
        }

        this.successes += result ? 1 : 0;
        return result;
    }
}

export class AndCondition implements BaseCondition {
    conditions: BaseCondition[];
    successes: number;

    constructor(conditions: BaseCondition[]) {
        if (conditions.some(condition => condition == undefined)) {
            console.error(`Found a dead condition`);
        }
        this.conditions = conditions;
        this.successes = 0;
    }

    evaluate(hand: Card[]): boolean {
        let result = this.conditions.every(condition => condition.evaluate(hand));
        this.successes += result ? 1 : 0;
        return result;
    }
}

export class OrCondition implements BaseCondition {
    conditions: BaseCondition[];
    successes: number;

    constructor(conditions: BaseCondition[]) {
        this.conditions = conditions;
        this.successes = 0;
    }

    evaluate(hand: Card[]): boolean {
        let result = this.conditions.some(condition => condition.evaluate(hand));
        this.successes += result ? 1 : 0;
        return result;
    }
}