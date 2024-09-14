import { Card, FreeCard, CreateCard } from "../src/core/data/card";
import { GameState } from "../src/core/data/game-state";
import { SimulationBranch } from "../src/core/sim/simulation";
import { CostType, RestrictionType, ConditionType, CardDetails } from "../src/core/data/card-details";
import { Condition, AndCondition, OrCondition } from "../src/core/sim/condition";
import { 
    freeCardIsUsable, 
    excavate,
    processFreeCard 
} from "../src/core/sim/free-card-processor";
import { MockDeck } from "./mock/deck.mock";
import { MockGameState } from "./mock/game-state.mock";
import { MockSimulationBranch } from "./mock/simulation-branch.mock";

describe('Free Card Processor', () => {
    let mockGameState: MockGameState;

    beforeEach(() => {
        mockGameState = new MockGameState(new MockDeck([]));
    });

    describe('freeCardIsUsable', () => {
        test('should return true for a basic free card', () => {
            const freeCardDetails: CardDetails = {
                free: { oncePerTurn: false, count: 1 }
            };
            const freeCard = CreateCard('Test Card', freeCardDetails) as FreeCard;
            mockGameState.addCardToHand(freeCard);
            expect(freeCardIsUsable(mockGameState, freeCard)).toBe(true);
        });

        test('should return false for once per turn card already used', () => {
            const freeCardDetails: CardDetails = {
                free: { oncePerTurn: true, count: 1 }
            };
            const freeCard = CreateCard('Test Card', freeCardDetails) as FreeCard;
            mockGameState.addCardToHand(freeCard);
            mockGameState.setCardsPlayed([freeCard]);
            expect(freeCardIsUsable(mockGameState, freeCard)).toBe(false);
        });

        test('should return false when not enough cards in deck', () => {
            const freeCardDetails: CardDetails = {
                free: { oncePerTurn: false, count: 5 }
            };
            const freeCard = CreateCard('Test Card', freeCardDetails) as FreeCard;
            mockGameState.addCardToHand(freeCard);
            mockGameState.mockDeck.setDeckList([CreateCard('Dummy Card', {})]);
            expect(freeCardIsUsable(mockGameState, freeCard)).toBe(false);
        });

        test('should return false when NoMoreDraws restriction is active', () => {
            const restrictedCardDetails: CardDetails = {
                free: { oncePerTurn: false, count: 1, restriction: [RestrictionType.NoMoreDraws] }
            };
            const restrictedCard = CreateCard('Restricted Card', restrictedCardDetails) as FreeCard;
            const freeCardDetails: CardDetails = {
                free: { oncePerTurn: false, count: 1 }
            };
            const freeCard = CreateCard('Test Card', freeCardDetails) as FreeCard;
            mockGameState.addCardToHand(freeCard);
            mockGameState.setCardsPlayed([restrictedCard]);
            expect(freeCardIsUsable(mockGameState, freeCard)).toBe(false);
        });

        test('should return false when NoPreviousDraws restriction is violated', () => {
            const freeCardDetails: CardDetails = {
                free: { oncePerTurn: false, count: 1, restriction: [RestrictionType.NoPreviousDraws] }
            };
            const freeCard = CreateCard('Test Card', freeCardDetails) as FreeCard;
            mockGameState.addCardToHand(freeCard);
            mockGameState.setCardsPlayed([CreateCard('Previous Card', { free: { oncePerTurn: false, count: 1 } })]);
            expect(freeCardIsUsable(mockGameState, freeCard)).toBe(false);
        });

        test('should return false when cost cannot be paid', () => {
            const freeCardDetails: CardDetails = {
                free: { oncePerTurn: false, count: 1, cost: { type: CostType.BanishFromHand, value: 2 } }
            };
            const freeCard = CreateCard('Test Card', freeCardDetails) as FreeCard;
            mockGameState.addCardToHand(freeCard);
            expect(freeCardIsUsable(mockGameState, freeCard)).toBe(false);
        });

        describe('Cost checks', () => {
            test('should return true when no cost is specified', () => {
                const freeCard = CreateCard('No Cost Card', { free: { oncePerTurn: false, count: 1 } }) as FreeCard;
                mockGameState.addCardToHand(freeCard);
                mockGameState.mockDeck.setDeckList([...Array(10)].map(() => CreateCard('Deck Card', {})));
                expect(freeCardIsUsable(mockGameState, freeCard)).toBe(true);
            });
    
            test('should return false when not enough cards to banish from deck', () => {
                const freeCard = CreateCard('Deck Banish Card', { 
                    free: { oncePerTurn: false, count: 1, cost: { type: CostType.BanishFromDeck, value: 3 } }
                }) as FreeCard;
                mockGameState.addCardToHand(freeCard);
                mockGameState.mockDeck.setDeckList([CreateCard('Card 1', {}), CreateCard('Card 2', {})]);
                expect(freeCardIsUsable(mockGameState, freeCard)).toBe(false);
            });
    
            test('should return true when enough cards to banish from hand', () => {
                const freeCard = CreateCard('Hand Banish Card', { 
                    free: { oncePerTurn: false, count: 1, cost: { type: CostType.BanishFromHand, value: 2 } }
                }) as FreeCard;
                mockGameState.setHand([freeCard, CreateCard('Card 1', {}), CreateCard('Card 2', {})]);
                mockGameState.mockDeck.setDeckList([...Array(10)].map(() => CreateCard('Deck Card', {})));
                expect(freeCardIsUsable(mockGameState, freeCard)).toBe(true);
            });
    
            test('should return false when not enough cards to discard', () => {
                const freeCard = CreateCard('Discard Card', { 
                    free: { oncePerTurn: false, count: 1, cost: { type: CostType.Discard, value: 3 } }
                }) as FreeCard;
                mockGameState.setHand([freeCard, CreateCard('Card 1', {})]);
                mockGameState.mockDeck.setDeckList([...Array(10)].map(() => CreateCard('Deck Card', {})));
                expect(freeCardIsUsable(mockGameState, freeCard)).toBe(false);
            });
    
            test('should return true for PayLife cost', () => {
                const freeCard = CreateCard('Pay Life Card', { 
                    free: { oncePerTurn: false, count: 1, cost: { type: CostType.PayLife, value: 1000 } }
                }) as FreeCard;
                mockGameState.addCardToHand(freeCard);
                mockGameState.mockDeck.setDeckList([...Array(10)].map(() => CreateCard('Deck Card', {})));
                expect(freeCardIsUsable(mockGameState, freeCard)).toBe(true);
            });
        });
    
        describe('Restriction checks', () => {
            test('should return true when no restrictions', () => {
                const freeCard = CreateCard('No Restriction Card', { free: { oncePerTurn: false, count: 1 } }) as FreeCard;
                mockGameState.addCardToHand(freeCard);
                mockGameState.mockDeck.setDeckList([...Array(10)].map(() => CreateCard('Deck Card', {})));
                expect(freeCardIsUsable(mockGameState, freeCard)).toBe(true);
            });
    
            test('should return true for NoSpecialSummon restriction', () => {
                const freeCard = CreateCard('No Special Summon Card', { 
                    free: { oncePerTurn: false, count: 1, restriction: [RestrictionType.NoSpecialSummon] }
                }) as FreeCard;
                mockGameState.addCardToHand(freeCard);
                mockGameState.mockDeck.setDeckList([...Array(10)].map(() => CreateCard('Deck Card', {})));
                expect(freeCardIsUsable(mockGameState, freeCard)).toBe(true);
            });
    
            test('should return false for NoMoreDraws restriction when a free card has been played', () => {
                const playedFreeCard = CreateCard('No More Draws Card', { 
                    free: { oncePerTurn: false, count: 1, restriction: [RestrictionType.NoMoreDraws] }
                }) as FreeCard;
                const freeCard = CreateCard('Played Free Card', { free: { oncePerTurn: false, count: 1 } }) as FreeCard;
                mockGameState.addCardToHand(freeCard);
                mockGameState.setCardsPlayed([playedFreeCard]);
                mockGameState.mockDeck.setDeckList([...Array(10)].map(() => CreateCard('Deck Card', {})));
                expect(freeCardIsUsable(mockGameState, freeCard)).toBe(false);
            });
        });
    
        describe('Activation count checks', () => {
            test('should return false when not enough cards in deck for activation count', () => {
                const freeCard = CreateCard('High Activation Count Card', { 
                    free: { oncePerTurn: false, count: 5 }
                }) as FreeCard;
                mockGameState.addCardToHand(freeCard);
                mockGameState.mockDeck.setDeckList([...Array(4)].map(() => CreateCard('Deck Card', {})));
                expect(freeCardIsUsable(mockGameState, freeCard)).toBe(false);
            });
    
            test('should return true when enough cards in deck for activation count', () => {
                const freeCard = CreateCard('Normal Activation Count Card', { 
                    free: { oncePerTurn: false, count: 3 }
                }) as FreeCard;
                mockGameState.addCardToHand(freeCard);
                mockGameState.mockDeck.setDeckList([...Array(5)].map(() => CreateCard('Deck Card', {})));
                expect(freeCardIsUsable(mockGameState, freeCard)).toBe(true);
            });
        });
    });

    describe('excavate', () => {
        test('should excavate and add cards to hand', () => {
            const freeCardDetails: CardDetails = {
                free: { oncePerTurn: false, count: 1, excavate: { count: 3, pick: 2 } }
            };
            const freeCard = CreateCard('Excavate Card', freeCardDetails) as FreeCard;
            const condition = new Condition('Test Card', 1);
            const excavatedCards = [
                CreateCard('Excavated 1', {}),
                CreateCard('Excavated 2', {}),
                CreateCard('Excavated 3', {})
            ];
            mockGameState.mockDeck.setDeckList(excavatedCards);
            
            excavate(mockGameState, freeCard, condition);
            
            expect(mockGameState.hand.length).toBe(2);
            expect(mockGameState.deck.deckCount).toBe(1);
        });
    });

    describe('processFreeCard', () => {
        test('should process a free card correctly', () => {
            const freeCardDetails: CardDetails = {
                free: { oncePerTurn: false, count: 2 }
            };
            const freeCard = CreateCard('Test Card', freeCardDetails) as FreeCard;
            mockGameState.addCardToHand(freeCard);
            mockGameState.mockDeck.setDeckList([CreateCard('Drawn 1', {}), CreateCard('Drawn 2', {})]);
            const condition = new Condition('Test Card', 1);
            const simulationBranch = new MockSimulationBranch(mockGameState, condition);

            processFreeCard(simulationBranch, freeCard);

            expect(simulationBranch.gameState.hand.length).toBe(2);
            expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
            expect(simulationBranch.gameState.cardsPlayedThisTurn[0].name).toBe('Test Card');
        });

        test('should not process card if not in hand', () => {
            const freeCardDetails: CardDetails = {
                free: { oncePerTurn: false, count: 1 }
            };
            const freeCard = CreateCard('Not In Hand', freeCardDetails) as FreeCard;
            const condition = new Condition('Test Card', 1);
            const simulationBranch = new MockSimulationBranch(mockGameState, condition);

            processFreeCard(simulationBranch, freeCard);

            expect(simulationBranch.gameState.hand.length).toBe(0);
            expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(0);
        });

        test('should not process card if not usable', () => {
            const freeCardDetails: CardDetails = {
                free: { oncePerTurn: true, count: 1 }
            };
            const freeCard = CreateCard('Test Card', freeCardDetails) as FreeCard;
            mockGameState.addCardToHand(freeCard);
            mockGameState.setCardsPlayed([freeCard]);
            const condition = new Condition('Test Card', 1);
            const simulationBranch = new MockSimulationBranch(mockGameState, condition);

            processFreeCard(simulationBranch, freeCard);

            expect(simulationBranch.gameState.hand.length).toBe(1);
            expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
        });

        test('should process card with cost', () => {
            const freeCardDetails: CardDetails = {
                free: { oncePerTurn: false, count: 1, cost: { type: CostType.BanishFromHand, value: 1 } }
            };
            const freeCard = CreateCard('Cost Card', freeCardDetails) as FreeCard;
            const costCard = CreateCard('Cost Card', {});
            mockGameState.setHand([freeCard, costCard]);
            const condition = new Condition('Test Card', 1);
            const simulationBranch = new MockSimulationBranch(mockGameState, condition);

            processFreeCard(simulationBranch, freeCard);

            expect(simulationBranch.gameState.hand.length).toBe(1);
            expect(simulationBranch.gameState.banishPile.length).toBe(1);
            expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
        });

        test('should process card with excavate', () => {
            const freeCardDetails: CardDetails = {
                free: { oncePerTurn: false, excavate: { count: 2, pick: 1 } }
            };
            const freeCard = CreateCard('Excavate Card', freeCardDetails) as FreeCard;
            mockGameState.addCardToHand(freeCard);
            mockGameState.mockDeck.setDeckList([CreateCard('Excavated 1', {}), CreateCard('Excavated 2', {})]);
            const condition = new Condition('Test Card', 1);
            const simulationBranch = new MockSimulationBranch(mockGameState, condition);

            processFreeCard(simulationBranch, freeCard);

            expect(simulationBranch.gameState.hand.length).toBe(1);
            expect(simulationBranch.gameState.deck.deckCount).toBe(1);
            expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
        });

        test('should process card with post-condition', () => {
            const freeCardDetails: CardDetails = {
                free: { oncePerTurn: false, count: 1, condition: { type: ConditionType.Discard, value: 1 } }
            };
            const freeCard = CreateCard('Post-Condition Card', freeCardDetails) as FreeCard;
            mockGameState.setHand([freeCard]);
            const condition = new Condition('Test Card', 1);
            const simulationBranch = new MockSimulationBranch(mockGameState, condition);

            processFreeCard(simulationBranch, freeCard);

            expect(simulationBranch.gameState.hand.length).toBe(0);
            expect(simulationBranch.gameState.graveyard.length).toBe(1);
            expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
        });

        describe('Cost processing', () => {
            test('should process card with BanishFromDeck cost', () => {
                const freeCardDetails: CardDetails = {
                    free: { oncePerTurn: false, count: 1, cost: { type: CostType.BanishFromDeck, value: 2 } }
                };
                const freeCard = CreateCard('Deck Banish Card', freeCardDetails) as FreeCard;
                const deckCards = [
                    CreateCard('Deck Card 1', {}),
                    CreateCard('Deck Card 2', {}),
                    CreateCard('Deck Card 3', {})
                ];
                mockGameState.addCardToHand(freeCard);
                mockGameState.mockDeck.setDeckList(deckCards);
                const condition = new Condition('Test Card', 1);
                const simulationBranch = new MockSimulationBranch(mockGameState, condition);
    
                processFreeCard(simulationBranch, freeCard);
    
                expect(simulationBranch.gameState.banishPile.length).toBe(2);
                expect(simulationBranch.gameState.deck.deckCount).toBe(0);
                expect(simulationBranch.gameState.hand.length).toBe(1);
                expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
            });
    
            test('should process card with BanishFromHand cost', () => {
                const freeCardDetails: CardDetails = {
                    free: { oncePerTurn: false, count: 1, cost: { type: CostType.BanishFromHand, value: 1 } }
                };
                const freeCard = CreateCard('Hand Banish Card', freeCardDetails) as FreeCard;
                const handCard = CreateCard('Hand Card', {});
                mockGameState.setHand([freeCard, handCard]);
                mockGameState.mockDeck.setDeckList([CreateCard('Deck Card', {})]);
                const condition = new Condition('Test Card', 1);
                const simulationBranch = new MockSimulationBranch(mockGameState, condition);
    
                processFreeCard(simulationBranch, freeCard);
    
                expect(simulationBranch.gameState.banishPile.length).toBe(1);
                expect(simulationBranch.gameState.hand.length).toBe(1);
                expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
            });
    
            test('should process card with Discard cost', () => {
                const freeCardDetails: CardDetails = {
                    free: { oncePerTurn: false, count: 1, cost: { type: CostType.Discard, value: 1 } }
                };
                const freeCard = CreateCard('Discard Card', freeCardDetails) as FreeCard;
                const handCard = CreateCard('Hand Card', {});
                mockGameState.setHand([freeCard, handCard]);
                mockGameState.mockDeck.setDeckList([CreateCard('Deck Card', {})]);
                const condition = new Condition('Test Card', 1);
                const simulationBranch = new MockSimulationBranch(mockGameState, condition);
    
                processFreeCard(simulationBranch, freeCard);
    
                expect(simulationBranch.gameState.graveyard.length).toBe(1);
                expect(simulationBranch.gameState.hand.length).toBe(1);
                expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
            });
    
            test('should process card with PayLife cost', () => {
                const freeCardDetails: CardDetails = {
                    free: { oncePerTurn: false, count: 1, cost: { type: CostType.PayLife, value: 1000 } }
                };
                const freeCard = CreateCard('Pay Life Card', freeCardDetails) as FreeCard;
                mockGameState.addCardToHand(freeCard);
                mockGameState.mockDeck.setDeckList([CreateCard('Deck Card', {})]);
                const condition = new Condition('Test Card', 1);
                const simulationBranch = new MockSimulationBranch(mockGameState, condition);
    
                processFreeCard(simulationBranch, freeCard);
    
                // Since we don't track life points, we just check if the card was processed
                expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
                expect(simulationBranch.gameState.cardsPlayedThisTurn[0].name).toBe('Pay Life Card');
            });
    
            test('should process card with string value cost', () => {
                const freeCardDetails: CardDetails = {
                    free: { oncePerTurn: false, count: 1, cost: { type: CostType.BanishFromHand, value: ['Specific Card'] } }
                };
                const freeCard = CreateCard('String Cost Card', freeCardDetails) as FreeCard;
                const specificCard = CreateCard('Specific Card', {});
                mockGameState.setHand([freeCard, specificCard]);
                mockGameState.mockDeck.setDeckList([CreateCard('Deck Card', {})]);
                const condition = new Condition('Test Card', 1);
                const simulationBranch = new MockSimulationBranch(mockGameState, condition);
    
                processFreeCard(simulationBranch, freeCard);
    
                expect(simulationBranch.gameState.banishPile.length).toBe(1);
                expect(simulationBranch.gameState.banishPile[0].name).toBe('Specific Card');
                expect(simulationBranch.gameState.hand.length).toBe(1);
                expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(1);
            });
    
            test('should not process card when cost cannot be paid', () => {
                const freeCardDetails: CardDetails = {
                    free: { oncePerTurn: false, count: 1, cost: { type: CostType.BanishFromHand, value: 2 } }
                };
                const freeCard = CreateCard('Unpayable Cost Card', freeCardDetails) as FreeCard;
                mockGameState.setHand([freeCard]);
                mockGameState.mockDeck.setDeckList([CreateCard('Deck Card', {})]);
                const condition = new Condition('Test Card', 1);
                const simulationBranch = new MockSimulationBranch(mockGameState, condition);
    
                processFreeCard(simulationBranch, freeCard);
    
                expect(simulationBranch.gameState.hand.length).toBe(1);
                expect(simulationBranch.gameState.cardsPlayedThisTurn.length).toBe(0);
            });
        });
    });
});