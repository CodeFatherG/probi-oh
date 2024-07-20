import { Card, FreeCard } from "./card";
import { CostType, RestrictionType } from "./card-details";
import { Simulation } from "./simulation";
import { GameState } from './game-state';
import { BaseCondition } from './condition';

function cardCanPayCost(gameState: GameState, card: FreeCard): boolean {
    if (!card.cost) {
        return true;
    }

    switch (card.cost.type)
    {
        case CostType.BanishFromDeck:
            if (gameState.deck.deckCount < (card.cost.value as number))
            {
                return false;
            }
            break;

        case CostType.BanishFromHand:
            if (gameState.hand.length < (card.cost.value as number))
            {
                return false;
            }
            break;

        case CostType.Discard:
            if (gameState.hand.length < (card.cost.value as number))
            {
                return false;
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

function freeCardIsUsable(gameState: GameState, card: FreeCard): boolean {
    // Check if the card is once per turn and has already been used 
    if (card.oncePerTurn && gameState.cardsPlayedThisTurn.some(usedCard => usedCard.name === card.name))
    {
        return false;
    }

    // Check there are enough cards in the deck to draw
    if (gameState.deck.deckCount < card.count)
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

function payCost(gameState: GameState, card: FreeCard): void {
    if (!card.cost) {
        return;
    }

    switch (card.cost.type)
    {
        case CostType.BanishFromDeck:
            gameState.banish([...Array(card.cost.value as number)].map(() => gameState.deck.drawCard()));
            break;

        case CostType.BanishFromHand:
            // We need to get the cards to banish from the hand
            // we should not banish anything in the hand that is already being used
            break;

        case CostType.Discard:
            // We need to get the cards to discard from the hand
            // we should not discard anything in the hand that is already being used
            break;

        case CostType.PayLife:
            // We don't care about life points
            break;
    }
}

function handleFreeCard(gameState: GameState, card: FreeCard): void {
    if (!gameState.hand.includes(card)) {
        console.error("Card is not in the player's hand");
        return;
    }

    if (!freeCardIsUsable(gameState, card)) {
        return;
    }

    // remove card from hand
    const index = gameState.hand.indexOf(card, 0);
    if (index > -1) {
        gameState.hand.splice(index, 1);
    }

    // pay cost
    payCost(gameState, card);

    // draw cards
    if (card.count > 0)
    {
        gameState.playCard(card);
        gameState.hand.push(...[...Array(card.count)].map(() => gameState.deck.drawCard()));
    }

    // excavate
    if (card.excavate)
    {
        // draw cards from the deck, pick some based on the requirements still in the simulation
    }
}

export function processFreeCard(simulation: Simulation, freeCard: FreeCard): void {
    if (!simulation.gameState.hand.includes(freeCard)) {
        console.error("Card is not in the player's hand");
        return;
    }

    if (!freeCardIsUsable(simulation.gameState, freeCard)) {
        return;
    }

    handleFreeCard(simulation.gameState, freeCard);
}