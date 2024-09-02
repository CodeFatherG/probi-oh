import { Card } from './card';
import { Deck } from './deck';
import { GameState } from './game-state';

/** Base condition interface for card evaluation */
export interface BaseCondition {
    /** The cards in the hand required for this condition */
    requiredCards(hand: Card[]): Card[];

    toString(): string;

    recordSuccess(): void;

    recordFailure(): void;

    /** Number of successful evaluations */
    get successes(): number;

    /** Number of successful evaluations */
    get failures(): number;

    /** Total number of evaluations */
    get totalEvaluations(): number;
}

export enum LocationConditionTarget {
    Hand,
    Deck
}

function getMatchingCards(condition: Condition, cardList: Card[]): Card[] {
    return cardList.filter(card => 
        card.name === condition.cardName || (card.tags && card.tags.includes(condition.cardName))
    );
}

/** Specific condition for card evaluation */
export class Condition implements BaseCondition {
    private _successes: number = 0;
    private _failures: number = 0;

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

    recordSuccess(): void {
        this._successes++;
    }

    get failures(): Readonly<number> {
        return this._failures;
    }

    recordFailure(): void {
        this._failures++;
    }

    get totalEvaluations(): Readonly<number> {
        return this.successes + this.failures;
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
    private _failures: number = 0;

    constructor(
        readonly conditions: BaseCondition[],
        readonly hasParentheses: boolean = true
    ) {
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

    get failures(): Readonly<number> {
        return this._failures;
    }

    recordFailure(): void {
        this._failures++;
    }

    get totalEvaluations(): Readonly<number> {
        return this.successes + this.failures;
    }

    private checkCombinations(hand: Card[], deck: Deck, conditions: BaseCondition[]): boolean {
        if (conditions.length === 0) {
            return true; // All conditions have been satisfied
        }

        const currentCondition = conditions[0];
        const remainingConditions = conditions.slice(1);

        // Get all possible combinations of cards that satisfy the current condition
        const possibleCombinations = this.getPossibleCombinations(hand, deck, currentCondition);

        for (const usedCards of possibleCombinations) {
            const remainingHand = hand.filter(card => !usedCards.includes(card));
            
            // Recursively check if the remaining conditions can be satisfied with the remaining hand
            if (this.checkCombinations(remainingHand, deck, remainingConditions)) {
                return true;
            }
        }

        return false;
    }

    private getPossibleCombinations(hand: Card[], deck: Deck, condition: BaseCondition): Card[][] {
        if (condition instanceof Condition) {
            const matchingCards = hand.filter(card => 
                card.name === condition.cardName || (card.tags && card.tags.includes(condition.cardName))
            );

            // Generate all combinations of the required number of cards
            return this.getCombinations(matchingCards, condition.quantity);
        } else {
            // For nested conditions, we need to evaluate them separately
            const tempGameState = {
                get hand() {
                    return hand;
                },
                get deck() {
                    return deck;
                }
            } as GameState;
    

            if (evaluateCondition(condition, tempGameState.hand, tempGameState.deck.deckList)) {
                return [condition.requiredCards(hand)];
            }
            return [];
        }
    }

    private getCombinations(cards: Card[], k: number): Card[][] {
        if (k > cards.length || k <= 0) {
            return [];
        }
        if (k === cards.length) {
            return [cards];
        }
        if (k === 1) {
            return cards.map(card => [card]);
        }

        const combinations: Card[][] = [];
        for (let i = 0; i < cards.length - k + 1; i++) {
            const head = cards[i];
            const tailCombos = this.getCombinations(cards.slice(i + 1), k - 1);
            tailCombos.forEach(tailCombo => {
                combinations.push([head, ...tailCombo]);
            });
        }
        return combinations;
    }

    requiredCards(hand: Card[]): Card[] {
        const usedCards: Set<Card> = new Set();
        this.checkCombinations(hand, new Deck([]), this.conditions);
        return Array.from(usedCards);
    }

    toString(): string {
        return `${this.hasParentheses ? '(' : ''}${this.conditions.map(c => c.toString()).join(' AND ')}${this.hasParentheses ? ')' : ''}`;
    }
}

/** Logical OR condition composed of multiple base conditions */
export class OrCondition implements BaseCondition {
    private _successes: number = 0;
    private _failures: number = 0;

    /**
     * Creates a new OrCondition
     * @param conditions - Array of BaseCondition objects
     */
    constructor(readonly conditions: BaseCondition[],
                readonly hasParentheses: boolean = true) {
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

    get failures(): Readonly<number> {
        return this._failures;
    }

    recordFailure(): void {
        this._failures++;
    }

    get totalEvaluations(): Readonly<number> {
        return this.successes + this.failures;
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

        const count = getMatchingCards(condition, cardList).length;

        let result = false;
        let usedCards: Card[] = [];
        switch(condition.operator) {
            case '>=': 
                result = count >= condition.quantity;
                usedCards = getMatchingCards(condition, cardList).slice(0, condition.quantity);
                break;

            case '=': 
                result = count === condition.quantity; 
                usedCards = getMatchingCards(condition, cardList).slice(0, condition.quantity);
                break;

            case '<=': 
                result = count <= condition.quantity; 
                break;

            default: throw new Error(`Unknown operator: ${condition.operator}`);
        }

        if (result) {
            condition.recordSuccess();
        } else {
            condition.recordFailure();
        }

        return {
            success: result,
            usedCards: usedCards
        };
    }

    return evaluate();
}

function evaluateAndCondition(condition: AndCondition, hand: Card[], deck: Card[]): Result {
    function evaluate(): Result {
        // init as a pass
        const result: Result = { success: true, usedCards: [] };
        condition.conditions.forEach(condition => {
            const ret = checkCondition(condition, hand.filter(c => !result.usedCards.includes(c)), deck)
            if (!ret.success) {
                // then if any result fails consider the overall failure (.every)
                result.success = false;
            } else {
                result.usedCards.push(...ret.usedCards);
            }
        });
        
        if (result.success) {
            condition.recordSuccess();
        } else {
            condition.recordFailure();
        }

        return result;
    }

    return evaluate();
}

function evaluateOrCondition(condition: OrCondition, hand: Card[], deck: Card[]): Result {
    function evaluate(): Result {
        // init as a fail
        const result: Result = { success: false, usedCards: [] };
        condition.conditions.forEach(condition => {
            if (checkCondition(condition, hand, deck).success) {
                // then if any result passes consider the overall failure (.some)
                result.success = true;
            }
        });
        
        if (result.success) {
            condition.recordSuccess();
        } else {
            condition.recordFailure();
        }

        return result;
    }

    return evaluate();
}

function checkCondition(condition: BaseCondition, hand: Card[], deck: Card[]): Result {
    let result;
    
    if (condition instanceof Condition) {
        result = evaluateSimpleCondition(condition, hand, deck);
    } else if (condition instanceof AndCondition) {
        result = evaluateAndCondition(condition, hand, deck);
    } else if (condition instanceof OrCondition) {
        result = evaluateOrCondition(condition, hand, deck);
    } else {
        throw new Error(`Unknown condition type: ${condition}`);
    }

    return result;
}

export function evaluateCondition(condition: BaseCondition, hand: Card[], deck: Card[]): boolean {
    const permutations = generateHandPermutations(hand);

    for (const hand of permutations) {
        if (checkCondition(condition, hand, deck).success) {
            return true;
        }
    }

    return false;
}