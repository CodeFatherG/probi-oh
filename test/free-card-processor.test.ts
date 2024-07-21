import { excavate, processFreeCard } from '../src/free-card-processor';
import { Simulation, SimulationBranch } from '../src/simulation';
import { GameState } from '../src/game-state';
import { Deck } from '../src/deck';
import { Card, CreateCard, FreeCard } from '../src/card';
import { CardDetails, ConditionType, CostType, RestrictionType } from '../src/card-details';
import { AndCondition, BaseCondition, Condition, OrCondition } from '../src/condition';

describe('free-card-processor', () => {
    let testDeck: Deck;
    let simulation: SimulationBranch;
    let mockCondition: BaseCondition;

    beforeEach(() => {
        testDeck = new Deck(Array(40).fill(null).map((_, i) => CreateCard(`Card ${i}`, {})));
        const gameState = new GameState(testDeck);
        gameState.drawHand(5);
        mockCondition = {
            evaluate: jest.fn().mockReturnValue(true),
            requiredCards: jest.fn().mockReturnValue([CreateCard('Required Card', {})]),
            successes: 0
        };
        simulation = new SimulationBranch(gameState, mockCondition);
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

describe('Free Card Tests', () => {
    let testDeck: Deck;
    let simulation: SimulationBranch;
    let mockCondition: BaseCondition;

    beforeEach(() => {
        testDeck = new Deck(Array(40).fill(null).map((_, i) => CreateCard(`Card ${i}`, {})));
        const gameState = new GameState(testDeck);
        gameState.drawHand(5);
        mockCondition = {
            evaluate: jest.fn().mockReturnValue(true),
            requiredCards: jest.fn().mockReturnValue([CreateCard('Required Card', {})]),
            successes: 0
        };
        simulation = new SimulationBranch(gameState, mockCondition);
    });

    test('Pot of Desires', () => {
        const potOfDesires = CreateCard('Pot of Desires', {
            free: {
                count: 2,
                oncePerTurn: true,
                cost: {
                    type: CostType.BanishFromDeck,
                    value: 10
                }
            }
        }) as FreeCard;
        simulation.gameState.hand.push(potOfDesires);

        const initialDeckCount = simulation.gameState.deck.deckCount;
        processFreeCard(simulation, potOfDesires);

        expect(simulation.gameState.cardsPlayedThisTurn).toContain(potOfDesires);
        expect(simulation.gameState.deck.deckCount).toBe(initialDeckCount - 12); // -10 for cost, -2 for draw
        expect(simulation.gameState.banishPile).toHaveLength(10);
        expect(simulation.gameState.hand).toHaveLength(7); // 5 initial + 1 seed card - 1 played + 2 drawn

        // Test once per turn
        processFreeCard(simulation, potOfDesires);
        expect(simulation.gameState.cardsPlayedThisTurn).toHaveLength(1);
    });

    test('Pot of Extravagance', () => {
        const potOfExtravagance = CreateCard('Pot of Extravagance', {
            free: {
                count: 2,
                oncePerTurn: false,
                restriction: [RestrictionType.NoPreviousDraws, RestrictionType.NoMoreDraws]
            }
        }) as FreeCard;
        simulation.gameState.hand.push(potOfExtravagance);

        processFreeCard(simulation, potOfExtravagance);
        expect(simulation.gameState.cardsPlayedThisTurn).toContain(potOfExtravagance);
        expect(simulation.gameState.hand).toHaveLength(7); // 5 initial + 1 seed card - 1 played + 2 drawn

        // Test no more draws restriction
        const anotherDraw = CreateCard('Another Draw', { free: { count: 1, oncePerTurn: false } }) as FreeCard;
        simulation.gameState.hand.push(anotherDraw);
        processFreeCard(simulation, anotherDraw);
        expect(simulation.gameState.cardsPlayedThisTurn).toHaveLength(1);
    });

    test('Pot of Prosperity', () => {
        const potOfProsperity = CreateCard('Pot of Prosperity', {
            free: {
                count: 0,
                oncePerTurn: true,
                restriction: [RestrictionType.NoPreviousDraws, RestrictionType.NoMoreDraws],
                excavate: {
                    count: 6,
                    pick: 1
                }
            }
        }) as FreeCard;
        simulation.gameState.hand.push(potOfProsperity);

        processFreeCard(simulation, potOfProsperity);
        expect(simulation.gameState.cardsPlayedThisTurn).toContain(potOfProsperity);
        expect(simulation.gameState.hand).toHaveLength(6); // 5 initial + 1 seed card - 1 played + 1 drawn
        // Add more assertions for excavate functionality when implemented
    });

    test('Upstart Goblin', () => {
        const upstartGoblin = CreateCard('Upstart Goblin', {
            free: {
                count: 1,
                oncePerTurn: false,
                cost: {
                    type: CostType.PayLife,
                    value: -1000
                }
            }
        }) as FreeCard;
        simulation.gameState.hand.push(upstartGoblin);

        processFreeCard(simulation, upstartGoblin);
        expect(simulation.gameState.cardsPlayedThisTurn).toContain(upstartGoblin);
        expect(simulation.gameState.hand).toHaveLength(6); // 5 initial + 1 seed card - 1 played + 1 drawn
    });

    test('Allure of Darkness', () => {
        const allureOfDarkness = CreateCard('Allure of Darkness', {
            free: {
                count: 2,
                oncePerTurn: false,
                condition: {
                    type: ConditionType.BanishFromHand,
                    value: "DARK"
                }
            }
        }) as FreeCard;
        const darkMonster = CreateCard('Dark Monster', { tags: ['DARK'] });
        simulation.gameState.hand.push(allureOfDarkness, darkMonster);

        processFreeCard(simulation, allureOfDarkness);
        expect(simulation.gameState.cardsPlayedThisTurn).toContain(allureOfDarkness);
        expect(simulation.gameState.hand).toHaveLength(7); // 5 initial + 2 seed card - 1 played + 2 drawn - 1 banished
        expect(simulation.gameState.banishPile).toContain(darkMonster);
    });

    test('Into The Void', () => {
        const intoTheVoid = CreateCard('Into The Void', {
            free: {
                count: 1,
                oncePerTurn: false
            }
        }) as FreeCard;
        simulation.gameState.hand.push(intoTheVoid);

        processFreeCard(simulation, intoTheVoid);
        expect(simulation.gameState.cardsPlayedThisTurn).toContain(intoTheVoid);
        expect(simulation.gameState.hand).toHaveLength(6); // 5 initial + 1 seed card - 1 played + 1 drawn
    });

    test('Pot of Duality', () => {
        const potOfDuality = CreateCard('Pot of Duality', {
            free: {
                count: 0,
                oncePerTurn: true,
                excavate: {
                    count: 3,
                    pick: 1
                }
            }
        }) as FreeCard;
        simulation.gameState.hand.push(potOfDuality);

        processFreeCard(simulation, potOfDuality);
        expect(simulation.gameState.cardsPlayedThisTurn).toContain(potOfDuality);
        expect(simulation.gameState.hand).toHaveLength(6); // 5 initial + 1 seed card - 1 played + 1 drawn
        // Add more assertions for excavate functionality when implemented
    });

    test('Trade-In', () => {
        const tradeIn = CreateCard('Trade-In', {
            free: {
                count: 2,
                oncePerTurn: false,
                cost: {
                    type: CostType.Discard,
                    value: ["Level 8"]
                }
            }
        }) as FreeCard;
        const level8Monster = CreateCard('Level 8 Monster', { tags: ['Level 8'] });
        simulation.gameState.hand.push(tradeIn, level8Monster);

        processFreeCard(simulation, tradeIn);
        expect(simulation.gameState.cardsPlayedThisTurn).toContain(tradeIn);
        expect(simulation.gameState.hand).toHaveLength(7); // 5 initial + 2 seed card - 1 played - 1 discarded + 2 drawn
        expect(simulation.gameState.graveyard).toContain(level8Monster);
    });

    test('Spellbook of Knowledge', () => {
        const spellbookOfKnowledge = CreateCard('Spellbook of Knowledge', {
            free: {
                count: 2,
                oncePerTurn: true,
                cost: {
                    type: CostType.Discard,
                    value: ["Spellcaster", "Spellbook"]
                }
            }
        }) as FreeCard;
        const spellcaster = CreateCard('Spellcaster', { tags: ['Spellcaster'] });
        simulation.gameState.hand.push(spellbookOfKnowledge, spellcaster);

        processFreeCard(simulation, spellbookOfKnowledge);
        expect(simulation.gameState.cardsPlayedThisTurn).toContain(spellbookOfKnowledge);
        expect(simulation.gameState.hand).toHaveLength(7); // 5 initial + 2 seed cards - 1 played - 1 discarded + 2 drawn
        expect(simulation.gameState.graveyard).toContain(spellcaster);

        // Test once per turn
        processFreeCard(simulation, spellbookOfKnowledge);
        expect(simulation.gameState.cardsPlayedThisTurn).toHaveLength(1);
    });
});
