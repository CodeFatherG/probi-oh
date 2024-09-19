import { Card, FreeCard } from "../data/card";
import { ConditionType, CostType, RestrictionType } from "../data/card-details";
import { SimulationBranch } from "./simulation";
import { GameState } from '../data/game-state';
import { BaseCondition, cardsThatSatisfy, Condition, matchCards } from "./condition";

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
            if (typeof(card.cost.value) === "number") {
                if (handLessCard.length < (card.cost.value as number))
                {
                    return false;
                } 
            } else if (typeof(card.cost.value) === "string") {
                (card.cost.value as string[]).forEach(c => {
                    if (!handLessCard.some(h => h.name === c)) {
                        return false;
                    }
                });
            }
            break;

        case CostType.Discard:
            if (typeof(card.cost.value) === "number") {
                if (handLessCard.length < (card.cost.value as number)) {
                    return false;
                }
            } else if (typeof(card.cost.value) === "string") {
                (card.cost.value as string[]).forEach(c => {
                    if (!handLessCard.some(h => h.name === c)) {
                        return false;
                    }
                });
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

function countCardSatisfactions(card: Card, satisfiedConditions: Map<Condition, Card[]>): number {
    return Array.from(satisfiedConditions.values())
        .filter(satisfiedCards => satisfiedCards.includes(card))
        .length;
}

function satisfactoryCardPriority(condition: BaseCondition, list: Card[]): Card[] {
    const satisfiedConditions = cardsThatSatisfy(condition, list);
    
    return [...list].sort((a, b) => {
        const priorityB = countCardSatisfactions(b, satisfiedConditions);
        const priorityA = countCardSatisfactions(a, satisfiedConditions);
        return priorityB - priorityA; // Sort in descending order
    });
}

function payCost(gameState: GameState, card: FreeCard, condition: BaseCondition): void {
    if (!card.cost) {
        return;
    }

    const prioritizedCards = satisfactoryCardPriority(condition, gameState.hand).reverse();

    switch (card.cost.type) {
        case CostType.BanishFromDeck:
            gameState.banishFromDeck([...Array(card.cost.value as number)].map(() => gameState.deck.drawCard()));
            break;

        case CostType.BanishFromHand:
        case CostType.Discard:
        {
            let cardsToRemove: Card[] = [];

            if (typeof card.cost.value === "number") {
                cardsToRemove = prioritizedCards.slice(0, card.cost.value as number);
                
                if (cardsToRemove.length < (card.cost.value as number)) {
                    throw new Error("Not enough cards to pay cost");
                }
            } else {
                const requirements = card.cost.value as string[];
                cardsToRemove = matchCards(requirements, prioritizedCards).slice(0, requirements.length);

                if (cardsToRemove.length === 0) {
                    throw new Error("Not enough cards to pay cost");
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
    
    const prioritizedCards = satisfactoryCardPriority(condition, excavatedCards);

    // Add the best cards to the hand
    gameState.hand.push(...prioritizedCards.slice(0, pick));

    // Put the rest back on top of the deck
    gameState.deck.addToBottom(prioritizedCards.slice(pick));
}

function payPostConditions(gameState: GameState, card: FreeCard, condition: BaseCondition): boolean {
    if (!card.condition) {
        return true;
    }

    const ascendingCards = satisfactoryCardPriority(condition, gameState.hand).reverse();

    switch (card.condition.type) {
        case ConditionType.BanishFromDeck:
            gameState.banishFromDeck([...Array(card.condition.value as number)].map(() => gameState.deck.drawCard()));
            break;

        case ConditionType.Discard:
        case ConditionType.BanishFromHand:
            {
                let cardsToRemove: Card[] = [];
    
                if (typeof card.condition.value === "number") {
                    cardsToRemove = ascendingCards.slice(0, card.condition.value as number);
                    
                    if (cardsToRemove.length < (card.condition.value as number)) {
                        return false;
                    }
                } else {
                    const requirements = card.condition.value as string;
                    const matchingCards = matchCards([requirements], ascendingCards);
                    if (matchingCards.length === 0) {
                        return false;
                    }
                    cardsToRemove = matchingCards.slice(0, 1);
                }
    
                if (card.condition.type === ConditionType.BanishFromHand) {
                    gameState.banishFromHand(cardsToRemove);
                } else {
                    gameState.discardFromHand(cardsToRemove);
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