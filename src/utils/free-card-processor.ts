import { Card, FreeCard } from "./card";
import { ConditionType, CostType, RestrictionType } from "./card-details";
import { SimulationBranch } from "./simulation";
import { GameState } from './game-state';
import { AndCondition, BaseCondition, Condition, evaluateCondition, OrCondition } from "./condition";

function cardCanPayCost(gameState: GameState, card: FreeCard): boolean {
    if (!card.cost) {
        return true;
    }

    const handLessCard = gameState.hand.filter(handCard => handCard !== card);

    switch (card.cost.type)
    {
        case CostType.BanishFromDeck:
            if (typeof(card.cost.value) === "number") {
                if (gameState.deck.deckCount < (card.cost.value as number)) {
                    return false;
                }
            } else if (typeof(card.cost.value) === "string") {
                return false;
            }
            
            break;

        case CostType.BanishFromHand:
            if (handLessCard.length < (card.cost.value as number))
            {
                return false;
            }
            break;

        case CostType.Discard:
            if (typeof(card.cost.value) === "number") {
                if (handLessCard.length < (card.cost.value as number)) {
                    return false;
                }
            }
            break;

        case CostType.PayLife:
            // We don't care about life points
            break;
    }

    return true;
}

function checkCardRestrictions(gameState: GameState, card: FreeCard): boolean {
    if (card.restrictions)
    {
        for (const restriction of card.restrictions)
        {
            switch (restriction)
            {
                case RestrictionType.NoSpecialSummon:
                    // We don't care... yet
                    break;

                case RestrictionType.NoMoreDraws:
                    // gameState is not something we care about
                    break;

                case RestrictionType.NoPreviousDraws:
                    // If we have already used any free cards, then we can't use gameState card
                    if (gameState.freeCardsPlayedThisTurn.length > 0)
                    {
                        return false;
                    }
                    break;
            }
        }
    }

    return true;
}

export function freeCardIsUsable(gameState: GameState, card: FreeCard): boolean {
    // Check if the card is once per turn and has already been used 
    if (card.oncePerTurn && gameState.cardsPlayedThisTurn.some(usedCard => usedCard.name === card.name))
    {
        return false;
    }

    // Check there are enough cards in the deck to draw
    if (gameState.deck.deckCount < card.activationCount)
    {
        return false;
    }

    // Check if any cards already impose the no more cards restriction
    if (gameState.freeCardsPlayedThisTurn.some(usedCard => usedCard.restrictions?.includes(RestrictionType.NoMoreDraws)))
    {
        return false;
    }

    // If the card has restrictions
    if (!checkCardRestrictions(gameState, card)) {
        return false;
    }

    // Check we can pay cost if required
    if (!cardCanPayCost(gameState, card))
    {
        return false;
    }

    return true;
}

function payCost(gameState: GameState, card: FreeCard, condition: BaseCondition): void {
    if (!card.cost) {
        return;
    }

    const requiredCards = condition.requiredCards(gameState.hand);

    switch (card.cost.type) {
        case CostType.BanishFromDeck:
            gameState.banishFromHand([...Array(card.cost.value as number)].map(() => gameState.deck.drawCard()));
            break;

        case CostType.BanishFromHand:
        case CostType.Discard:
        {
            const availableCards = gameState.hand.filter(c => !requiredCards.includes(c));
            let cardsToRemove = [];

            if (typeof(card.cost.value) === "number") {
                cardsToRemove.push(...availableCards.slice(0, card.cost.value as number));
                
                if (cardsToRemove.length < (card.cost.value as number)) {
                    throw new Error("Not enough cards to pay cost");
                }
            } else {
                const requirements = card.cost.value as string[];
                cardsToRemove = availableCards.filter(c => requirements.includes(c.name) || c.tags?.some(t => requirements.includes(t)));

                if (!cardsToRemove) {
                    throw new Error("No card to pay cost");
                }
            }

            if (card.cost.type === CostType.BanishFromHand) {
                gameState.banishFromHand(cardsToRemove);
            } else {
                gameState.discardFromHand(cardsToRemove);
            }
        }
            break;

        case CostType.PayLife:
            // We don't care about life points
            break;
    }
}

export function excavate(gameState: GameState, card: FreeCard, condition: BaseCondition): void {
    if (!card.excavate) {
        return;
    }

    const { count, pick } = card.excavate;
    const excavatedCards = [...Array(count)].map(() => gameState.deck.drawCard());
    
    // Calculate the base score (how many conditions are met with the current hand)
    const baseScore = countMetConditions(condition, gameState, null);

    // Sort excavated cards based on their contribution to completing the condition
    const sortedCards = excavatedCards.sort((a, b) => {
        const aScore = countMetConditions(condition, gameState, a) - baseScore;
        const bScore = countMetConditions(condition, gameState, b) - baseScore;
        return bScore - aScore; // Sort in descending order
    });

    // Add the best cards to the hand
    gameState.hand.push(...sortedCards.slice(0, pick));

    // Put the rest back on top of the deck
    gameState.deck.addToBottom(sortedCards.slice(pick));
}

function countMetConditions(condition: BaseCondition, gameState: GameState, card: Card | null): number {
    const localGameState = gameState.deepCopy();

    if (condition instanceof Condition) {
        if (card) {
            const hand = localGameState.hand;
            hand.push(card);
        }

        return evaluateCondition(condition, gameState.hand, gameState.deck.deckList) ? 1 : 0;
    } else if (condition instanceof AndCondition) {
        return condition.conditions.filter(c => countMetConditions(c, localGameState, card) > 0).length;
    } else if (condition instanceof OrCondition) {
        return condition.conditions.some(c => countMetConditions(c, localGameState, card) > 0) ? 1 : 0;
    }
    return 0;
}

function payPostConditions(gameState: GameState, card: FreeCard, condition: BaseCondition): boolean {
    if (!card.condition) {
        return true;
    }

    const requiredCards = condition.requiredCards(gameState.hand);

    switch (card.condition.type) {
        case ConditionType.BanishFromDeck:
            gameState.banishFromHand([...Array(card.condition.value as number)].map(() => gameState.deck.drawCard()));
            break;

        case ConditionType.Discard:
        case ConditionType.BanishFromHand:
        {
            const availableCards = gameState.hand.filter(c => !requiredCards.includes(c));

            if (typeof(card.condition.value) === "number") {
                const count = card.condition.value as number;
                if (availableCards.length < count) {
                    return false;
                }

                const cardsToRemove = availableCards.slice(0, count);

                if (card.condition.type === ConditionType.BanishFromHand) {
                    gameState.banishFromHand(cardsToRemove);
                } else {
                    gameState.discardFromHand(cardsToRemove);
                }
    
                let hand = gameState.hand;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                hand = gameState.hand.filter(c => !cardsToRemove.includes(c));
            } else {
                const requirement = card.condition.value as string;
                
                const cardToRemove = availableCards.find(c => c.tags?.includes(requirement) || c.name === requirement);

                if (!cardToRemove) {
                    return false;
                }

                if (card.condition.type === ConditionType.BanishFromHand) {
                    gameState.banishFromHand([cardToRemove]);
                } else {
                    gameState.discardFromHand([cardToRemove]);
                }
    
                let hand = gameState.hand;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                hand = gameState.hand.filter(c => c === cardToRemove);
                break;
            }
        }
            break;
    }

    return true;
}

function handleFreeCard(gameState: GameState, card: FreeCard, condition: BaseCondition): void {
    if (!gameState.hand.includes(card)) {
        console.error("Card is not in the player's hand");
        return;
    }

    if (!freeCardIsUsable(gameState, card)) {
        return;
    }

    gameState.playCard(card);

    // pay cost
    payCost(gameState, card, condition);

    // draw cards
    if (card.count > 0) {
        gameState.hand.push(...[...Array(card.count)].map(() => gameState.deck.drawCard()));
    }

    // excavate
    excavate(gameState, card, condition);

    if (!payPostConditions(gameState, card, condition)) {
        // we failed the post condition. This should be considered a total failure, how? idk
        // for the moment discard hand so we kill conditions
        gameState.discardFromHand(gameState.hand);
        return;
    }
}

export function processFreeCard(simulation: SimulationBranch, freeCard: FreeCard): void {
    if (!simulation.gameState.hand.find(c => c.name === freeCard.name)) {
        console.error("Card is not in the player's hand");
        return;
    }

    const cardInHand = simulation.gameState.hand.find(c => c.name === freeCard.name) as FreeCard;

    if (!freeCardIsUsable(simulation.gameState, cardInHand)) {
        return;
    }

    handleFreeCard(simulation.gameState, cardInHand, simulation.condition);
}