import { Card } from '../data/card';

/** Base condition interface for card evaluation */
export interface BaseCondition {
    toString(): string;

    recordSuccess(): void;

    /** Number of successful evaluations */
    get successes(): number;
}

export enum LocationConditionTarget {
    Hand,
    Deck
}

export function matchCards(search: string[], cardList: Card[]): Card[] {
    return cardList.filter(card => 
        search.some(s => s == card.name || (card.tags && card.tags.includes(s)))
    );
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
        readonly operator: '>=' | '=' | '<=' = '>=',
        readonly location: LocationConditionTarget = LocationConditionTarget.Hand
    ) {
    }

    /** Number of successful evaluations */
    get successes(): Readonly<number> {
        return this._successes;
    }

    recordSuccess(): void {
        this._successes++;
    }

    toString(): string {
        function operatorToSign(operator: '>=' | '=' | '<='): string {
            switch (operator) {
                case '>=': return '+';
                case '=': return '';
                case '<=': return '-';
            }
        }
        return `${this.quantity}${operatorToSign(this.operator)} ${this.cardName} IN ${LocationConditionTarget[this.location]}`;
    }
}

/** Logical AND condition composed of multiple base conditions */
export class AndCondition implements BaseCondition {
    public hasParentheses: boolean = false;
    private _successes: number = 0;

    constructor(
        readonly conditions: BaseCondition[],
        _hasParentheses: boolean = false
    ) {
        this.hasParentheses = _hasParentheses;
        if (conditions.some(condition => condition == undefined)) {
            console.error(`Found a dead condition`);
        }
    }

    get successes(): Readonly<number> {
        return this._successes;
    }

    recordSuccess(): void {
        this._successes++;
    }

    toString(): string {
        return `${this.hasParentheses ? '(' : ''}${this.conditions.map(c => c.toString()).join(' AND ')}${this.hasParentheses ? ')' : ''}`;
    }
}

/** Logical OR condition composed of multiple base conditions */
export class OrCondition implements BaseCondition {
    public hasParentheses: boolean = false;
    private _successes: number = 0;

    /**
     * Creates a new OrCondition
     * @param conditions - Array of BaseCondition objects
     */
    constructor(readonly conditions: BaseCondition[],
                _hasParentheses: boolean = false) {
        this.hasParentheses = _hasParentheses;
        if (conditions.some(condition => condition == undefined)) {
            console.error(`Found a dead condition`);
        }
    }

    /** Number of successful evaluations */
    get successes(): Readonly<number> {
        return this._successes;
    }

    recordSuccess(): void {
        this._successes++;
    }

    toString(): string {
        return `${this.hasParentheses ? '(' : ''}${this.conditions.map(c => c.toString()).join(' OR ')}${this.hasParentheses ? ')' : ''}`;
    }
}

function generateHandPermutations(hand: Card[]): Card[][] {
    function permute(arr: Card[], start: number = 0): Card[][] {
        if (start === arr.length - 1) {
            return [arr.slice()];
        }

        const permutations: Card[][] = [];

        for (let i = start; i < arr.length; i++) {
            [arr[start], arr[i]] = [arr[i], arr[start]]; // Swap elements
            permutations.push(...permute(arr, start + 1));
            [arr[start], arr[i]] = [arr[i], arr[start]]; // Swap back
        }

        return permutations;
    }

    return permute(hand);
}

interface Result {
    success: boolean;
    usedCards: Card[];
}

function evaluateSimpleCondition(condition: Condition, 
                                 hand: Card[], 
                                 deck: Card[]): Result {
    /** Evaluates the condition against a hand of cards */
    function evaluate(): Result {
        let cardList: Card[] = [];
        switch (condition.location) {
            case LocationConditionTarget.Deck:
                cardList = deck
                break;
            default:
                console.error(`Unknown location: ${condition.location}`);
                // Fallthrough to Hand case
            case LocationConditionTarget.Hand:
                cardList = hand;
                break;
        }

        const count = matchCards([condition.cardName], cardList).length;

        let result = false;
        let usedCards: Card[] = [];
        switch(condition.operator) {
            case '>=': 
                result = count >= condition.quantity;
                usedCards = matchCards([condition.cardName], cardList).slice(0, condition.quantity);
                break;

            case '=': 
                result = count === condition.quantity; 
                usedCards = matchCards([condition.cardName], cardList).slice(0, condition.quantity);
                break;

            case '<=': 
                result = count <= condition.quantity; 
                break;

            default: throw new Error(`Unknown operator: ${condition.operator}`);
        }

        return {
            success: result,
            usedCards: usedCards
        };
    }

    return evaluate();
}

function evaluateAndCondition(condition: AndCondition, 
                              hand: Card[], 
                              deck: Card[],
                              succeededConditions: BaseCondition[]): Result {
    function evaluate(): Result {
        // init as a pass
        const result: Result = { success: true, usedCards: [] };
        condition.conditions.forEach(condition => {
            const ret = checkCondition(condition, hand.filter(c => !result.usedCards.includes(c)), deck, succeededConditions);
            if (!ret.success) {
                // then if any result fails consider the overall failure (.every)
                result.success = false;
            } else {
                result.usedCards.push(...ret.usedCards);
            }
        });
        
        return result;
    }

    return evaluate();
}

function evaluateOrCondition(condition: OrCondition, 
                             hand: Card[], 
                             deck: Card[],
                             succeededConditions: BaseCondition[]): Result {
    function evaluate(): Result {
        // init as a fail
        const result: Result = { success: false, usedCards: [] };
        condition.conditions.forEach(condition => {
            if (checkCondition(condition, hand, deck, succeededConditions).success) {
                // then if any result passes consider the overall failure (.some)
                result.success = true;
            }
        });
        
        return result;
    }

    return evaluate();
}

function checkCondition(condition: BaseCondition, hand: Card[], deck: Card[], succeededConditions: BaseCondition[]): Result {
    let result;
    
    if (condition instanceof Condition) {
        result = evaluateSimpleCondition(condition, hand, deck);
    } else if (condition instanceof AndCondition) {
        result = evaluateAndCondition(condition, hand, deck, succeededConditions);
    } else if (condition instanceof OrCondition) {
        result = evaluateOrCondition(condition, hand, deck, succeededConditions);
    } else {
        throw new Error(`Unknown condition type: ${condition}`);
    }

    if (result.success) {
        succeededConditions.push(condition);
    }

    return result;
}

export function conditionHasAnd(condition: BaseCondition): boolean {
    const checkAnd = (condition: BaseCondition): boolean => {
        if (condition instanceof Condition) {
            return false
        } else if (condition instanceof AndCondition) {
            return true;
        } else if (condition instanceof OrCondition) {
            return condition.conditions.some(checkAnd);
        } else {
            throw new Error(`Unknown condition type: ${condition}`);
        }
    }

    return checkAnd(condition);
}

export function evaluateCondition(condition: BaseCondition, hand: Card[], deck: Card[]): boolean {
    let succeededConditionList: BaseCondition[] = [];
    let result: boolean = false;

    if (conditionHasAnd(condition)) {
        const permutations = generateHandPermutations(hand);

        for (const hand of permutations) {
            const succeededConditions: BaseCondition[] = [];
            result = checkCondition(condition, hand, deck, succeededConditions).success
            
            if (succeededConditions.length > succeededConditionList.length) {
                succeededConditionList = succeededConditions;
            }

            if (result) {
                break;
            }
        }
    } else {
        result = checkCondition(condition, hand, deck, succeededConditionList).success;
    }

    for (const condition of succeededConditionList) {
        condition.recordSuccess();
    }    

    return result;
}

/**
 * @brief Returns a map conditions and the cards in the list that satisfy them. Only type Condition is returned as a key
 *        as realistically the only conditions that matter are the end conditions. This is a design choice since and implies that 
 * @note This function is recursive.
 * @param condition 
 * @param list 
 * @returns 
 */
export function cardsThatSatisfy(condition: BaseCondition, list: Card[]): Map<Condition, Card[]> {
    const map = new Map<Condition, Card[]>();

    const iterateCondition = (condition: BaseCondition): void => {
        if (condition instanceof Condition) {
            map.set(condition, matchCards([condition.cardName], list));
        } else if (condition instanceof AndCondition
                   || condition instanceof OrCondition) {
            condition.conditions.forEach(subCondition => iterateCondition(subCondition));
        } else {
            throw new Error(`Unknown condition type: ${condition}`);
        }
    }

    iterateCondition(condition);
    return map;
}
