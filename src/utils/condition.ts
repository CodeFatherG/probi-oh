import { Card } from './card';
import { Deck } from './deck';
import { GameState } from './game-state';

/** Base condition interface for card evaluation */
export interface BaseCondition {
    /** The cards in the hand required for this condition */
    requiredCards(hand: Card[]): Card[];

    toString(): string;

    recordSuccess(): void;

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

    recordSuccess(): void {
        this._successes++;
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
    

            if (evaluateCondition(condition, tempGameState)) {
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

function evaluateSimpleCondition(condition: Condition, gameState: GameState): boolean {
    /** Evaluates the condition against a hand of cards */
    function evaluate(): boolean {
        let cardList: Card[] = [];
        switch (condition.location) {
            case LocationConditionTarget.Deck:
                cardList = gameState.deck.deckList;
                break;
            default:
                console.error(`Unknown location: ${condition.location}`);
                // Fallthrough to Hand case
            case LocationConditionTarget.Hand:
                cardList = gameState.hand;
                break;
        }

        const count = cardList.filter(card => card.name === condition.cardName 
            || (card.tags && card.tags.includes(condition.cardName))).length;

        let result = false;
        switch(condition.operator) {
            case '>=': result = count >= condition.quantity; break;
            case '=': result = count === condition.quantity; break;
            case '<=': result = count <= condition.quantity; break;
            default: throw new Error(`Unknown operator: ${condition.operator}`);
        }

        if (result) {
            condition.recordSuccess();
        }

        return result;
    }

    return evaluate();
}

function evaluateAndCondition(condition: AndCondition, gameState: GameState): boolean {
    function evaluate(): boolean {
        // init as a pass
        let result = true;
        condition.conditions.forEach(condition => {
            if (!evaluateCondition(condition, gameState)) {
                // then if any result fails consider the overall failure (.every)
                result = false;
            }
        });
        
        if (result) {
            condition.recordSuccess();
        }

        return result;
    }

    return evaluate();
}

function evaluateOrCondition(condition: OrCondition, gameState: GameState): boolean {
    function evaluate(): boolean {
        // init as a fail
        let result = false;
        condition.conditions.forEach(condition => {
            if (evaluateCondition(condition, gameState)) {
                // then if any result passes consider the overall failure (.some)
                result = true;
            }
        });
        
        if (result) {
            condition.recordSuccess();
        }

        return result;
    }

    return evaluate();
}

export function evaluateCondition(condition: BaseCondition, gameState: GameState): boolean {
    if (condition instanceof Condition) {
        return evaluateSimpleCondition(condition, gameState);
    } else if (condition instanceof AndCondition) {
        return evaluateAndCondition(condition, gameState);
    } else if (condition instanceof OrCondition) {
        return evaluateOrCondition(condition, gameState);
    } else {
        throw new Error(`Unknown condition type: ${condition}`);
    }
}