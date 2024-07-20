import { processFreeCard } from '../src/free-card-processor';
import { Simulation } from '../src/simulation';
import { GameState } from '../src/game-state';
import { Deck } from '../src/deck';
import { Card, CreateCard, FreeCard } from '../src/card';
import { CardDetails, CostType, RestrictionType } from '../src/card-details';
import { BaseCondition } from '../src/condition';

describe('free-card-processor', () => {
    let testDeck: Deck;
    let simulation: Simulation;
    let mockCondition: BaseCondition;

    beforeEach(() => {
        testDeck = new Deck(Array(40).fill(null).map((_, i) => CreateCard(`Card ${i}`, {})));
        const gameState = new GameState(testDeck, 5);
        mockCondition = {
            evaluate: jest.fn().mockReturnValue(true),
            successes: 0
        };
        simulation = new Simulation(gameState, mockCondition);
    });

    describe('processFreeCard', () => {
        it('should process a valid free card', () => {
            const freeCardDetails: CardDetails = {
                free: {
                    count: 2,
                    oncePerTurn: false
                }
            };
            const freeCard = CreateCard('Free Card', freeCardDetails) as FreeCard;
            simulation.gameState.hand.push(freeCard);

            processFreeCard(simulation, freeCard);

            expect(simulation.gameState.hand).not.toContain(freeCard);
            expect(simulation.gameState.cardsPlayedThisTurn).toContain(freeCard);
            expect(simulation.gameState.hand.length).toBe(7); // 5 initial + 2 drawn
        });

        it('should not process a card that is not in hand', () => {
            const freeCard = CreateCard('Not In Hand', { free: { oncePerTurn: false } }) as FreeCard;
            
            console.error = jest.fn();
            processFreeCard(simulation, freeCard);

            expect(console.error).toHaveBeenCalledWith("Card is not in the player's hand");
            expect(simulation.gameState.cardsPlayedThisTurn).not.toContain(freeCard);
        });

        it('should not process a card that has already been used this turn when once per turn', () => {
            const freeCard = CreateCard('Once Per Turn', { free: { oncePerTurn: true } }) as FreeCard;
            simulation.gameState.hand.push(freeCard);
            simulation.gameState.playCard(freeCard);

            processFreeCard(simulation, freeCard);

            expect(simulation.gameState.cardsPlayedThisTurn).toHaveLength(1);
        });

        it('should not process a card if there are not enough cards in the deck', () => {
            const freeCard = CreateCard('Draw Too Many', { free: { count: 41, oncePerTurn: false } }) as FreeCard;
            simulation.gameState.hand.push(freeCard);

            processFreeCard(simulation, freeCard);

            expect(simulation.gameState.cardsPlayedThisTurn).not.toContain(freeCard);
        });

        it('should not process a card if NoMoreDraws restriction is active', () => {
            const restrictiveCard = CreateCard('No More Draws', { 
                free: { oncePerTurn: false, restriction: [RestrictionType.NoMoreDraws] }
            }) as FreeCard;
            const freeCard = CreateCard('Free Card', { free: { count: 1, oncePerTurn: false } }) as FreeCard;
            
            simulation.gameState.hand.push(restrictiveCard, freeCard);
            simulation.gameState.playCard(restrictiveCard);

            processFreeCard(simulation, freeCard);

            expect(simulation.gameState.cardsPlayedThisTurn).not.toContain(freeCard);
        });

        it('should not process a card if it fails restriction checks', () => {
            const freeCard = CreateCard('Restricted Card', { 
                free: { oncePerTurn: false, restriction: [RestrictionType.NoPreviousDraws] }
            }) as FreeCard;
            const previousFreeCard = CreateCard('Previous Free Card', { free: { oncePerTurn: false } }) as FreeCard;
            
            simulation.gameState.hand.push(freeCard, previousFreeCard);
            simulation.gameState.playCard(previousFreeCard);

            processFreeCard(simulation, freeCard);

            expect(simulation.gameState.cardsPlayedThisTurn).not.toContain(freeCard);
        });

        it('should process a card with a cost', () => {
            const freeCard = CreateCard('Costly Card', { 
                free: { 
                    count: 1, 
                    oncePerTurn: false,
                    cost: { type: CostType.BanishFromDeck, value: 1 }
                }
            }) as FreeCard;
            simulation.gameState.hand.push(freeCard);

            const initialDeckCount = simulation.gameState.deck.deckCount;
            processFreeCard(simulation, freeCard);

            expect(simulation.gameState.cardsPlayedThisTurn).toContain(freeCard);
            expect(simulation.gameState.deck.deckCount).toBe(initialDeckCount - 2); // -1 for cost, -1 for draw
            expect(simulation.gameState.banishPile).toHaveLength(1);
        });

        it('should not process a card if BanishFromHand cost cannot be paid', () => {
            const freeCard = CreateCard('Costly Card', { 
                free: { 
                    count: 1, 
                    oncePerTurn: false,
                    cost: { type: CostType.BanishFromHand, value: 6 }
                }
            }) as FreeCard;
            simulation.gameState.hand.push(freeCard);

            processFreeCard(simulation, freeCard);

            expect(simulation.gameState.cardsPlayedThisTurn).not.toContain(freeCard);
        });

        it('should not process a card if Discard cost cannot be paid', () => {
            const freeCard = CreateCard('Costly Card', { 
                free: { 
                    count: 1, 
                    oncePerTurn: false,
                    cost: { type: CostType.Discard, value: 6 }
                }
            }) as FreeCard;
            simulation.gameState.hand.push(freeCard);

            processFreeCard(simulation, freeCard);

            expect(simulation.gameState.cardsPlayedThisTurn).not.toContain(freeCard);
        });

        it('should process a card with PayLife cost', () => {
            const freeCard = CreateCard('Life Cost Card', { 
                free: { 
                    count: 1, 
                    oncePerTurn: false,
                    cost: { type: CostType.PayLife, value: 1000 }
                }
            }) as FreeCard;
            simulation.gameState.hand.push(freeCard);

            processFreeCard(simulation, freeCard);

            expect(simulation.gameState.cardsPlayedThisTurn).toContain(freeCard);
        });

        it('should process a card when deck has exactly enough cards', () => {
            const freeCard = CreateCard('Last Card', { 
                free: { 
                    count: 1, 
                    oncePerTurn: false
                }
            }) as FreeCard;
            simulation.gameState.hand.push(freeCard);
            
            // Manually set the deck to have only one card
            while (simulation.gameState.deck.deckCount > 1) {
                simulation.gameState.deck.drawCard();
            }

            processFreeCard(simulation, freeCard);

            expect(simulation.gameState.cardsPlayedThisTurn).toContain(freeCard);
            expect(simulation.gameState.deck.deckCount).toBe(0);
        });

        it('should handle a card with excavate effect', () => {
            const freeCard = CreateCard('Excavate Card', { 
                free: { 
                    count: 1, 
                    oncePerTurn: false,
                    excavate: { count: 3, pick: 1 }
                }
            }) as FreeCard;
            simulation.gameState.hand.push(freeCard);

            processFreeCard(simulation, freeCard);

            expect(simulation.gameState.cardsPlayedThisTurn).toContain(freeCard);
            // Add more assertions based on how excavate is supposed to work
        });

        it('should not process a card if NoMoreDraws already imposed',  () => {
            simulation.gameState.cardsPlayedThisTurn.push(CreateCard('No More Draws', {
                free: { 
                    restriction: [RestrictionType.NoMoreDraws], 
                    oncePerTurn: false,
                }
            }) as FreeCard);
            const freeCard = CreateCard('Free Card', { free: { count: 1, oncePerTurn: false } }) as FreeCard;
            simulation.gameState.hand.push(freeCard);

            processFreeCard(simulation, freeCard);

            expect(simulation.gameState.cardsPlayedThisTurn).not.toContain(freeCard);
        });
    });
});