import ydkeManager from '@ygo/ydke-manager'; // Adjust the import path as needed
import { getCardById, getCardByName } from '@ygo/card-api';
import { getCardDetails } from '@ygo/details-provider';
import { CardInformation } from '@ygo/card-information';
import { CardDetails } from '@server/card-details';
import { SimulationInput } from '@server/simulation-input';
import { BaseCondition, Condition } from '@server/condition';

// Mock the imported functions
jest.mock('@ygo/card-api');
jest.mock('@ygo/details-provider');

describe('YDKE Manager', () => {
    // Mock implementations
    const mockGetCardById = getCardById as jest.MockedFunction<typeof getCardById>;
    const mockGetCardByName = getCardByName as jest.MockedFunction<typeof getCardByName>;
    const mockGetCardDetails = getCardDetails as jest.MockedFunction<typeof getCardDetails>;

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('importFromString', () => {
        it('should import a card from a valid YDKE string', async () => {
            const validYdkeString = 'ydke://pKlXBQ==!!!'
            const mockCardInfo1: CardInformation = {
                id: 89631139,
                name: 'Blue-Eyes White Dragon',
                type: 'Monster',
                desc: 'This legendary dragon is a powerful engine of destruction...',
                race: 'Dragon',
                card_images: [{ id: 89631139, image_url: 'url1', image_url_small: 'url1_small', image_url_cropped: 'url1_cropped' }]
            };
            const mockCardDetails1: CardDetails = { tags: ['Monster', 'Normal'] };

            mockGetCardById
                .mockResolvedValueOnce(mockCardInfo1)
            mockGetCardDetails
                .mockResolvedValueOnce(mockCardDetails1)

            const result = await ydkeManager.importFromString(validYdkeString);

            expect(result.deck.size).toBe(1);
            expect(result.deck.get('Blue-Eyes White Dragon')).toEqual({ qty: 1, tags: ['Monster', 'Normal'] });
            expect(mockGetCardById).toHaveBeenCalledTimes(1);
            expect(mockGetCardDetails).toHaveBeenCalledTimes(1);
        });

        it('should import multiple cards from a valid YDKE string', async () => {
            const validYdkeString = 'ydke://pKlXBaSpVwWu9MwC!!!'
            const mockCardInfo1: CardInformation = {
                id: 89631139,
                name: 'Blue-Eyes White Dragon',
                type: 'Monster',
                desc: 'This legendary dragon is a powerful engine of destruction...',
                race: 'Dragon',
                card_images: [{ id: 89631139, image_url: 'url1', image_url_small: 'url1_small', image_url_cropped: 'url1_cropped' }]
            };
            const mockCardDetails1: CardDetails = { tags: ['Monster', 'Normal'] };
            const mockCardInfo2: CardInformation = {
                id: 46986414,
                name: 'Dark Magician',
                type: 'Monster',
                desc: 'The ultimate wizard in terms of attack and defense.',
                race: 'Spellcaster',
                card_images: [{ id: 46986414, image_url: 'url1', image_url_small: 'url1_small', image_url_cropped: 'url1_cropped' }]
            };
            const mockCardDetails2: CardDetails = { tags: ['Monster', 'Normal'] };

            // 2x Blue eyes, 1x Dark Magician
            mockGetCardById
                .mockResolvedValueOnce(mockCardInfo1)
                .mockResolvedValueOnce(mockCardInfo1)
                .mockResolvedValueOnce(mockCardInfo2)

            // Only need to get details for each card once
            mockGetCardDetails
                .mockResolvedValueOnce(mockCardDetails1)
                .mockResolvedValueOnce(mockCardDetails2)

            const result = await ydkeManager.importFromString(validYdkeString);

            expect(result.deck.size).toBe(2);
            expect(result.deck.get('Blue-Eyes White Dragon')?.qty).toEqual(2);
            expect(result.deck.get('Dark Magician')?.qty).toEqual(1);
            expect(mockGetCardById).toHaveBeenCalledTimes(3);
            expect(mockGetCardDetails).toHaveBeenCalledTimes(2);
        });

        it('should ignore side and extra', async () => {
            const validYdkeString = 'ydke://pKlXBQ==!SSyyAg==!rvTMAg==!'
            const mockCardInfo1: CardInformation = {
                id: 89631139,
                name: 'Blue-Eyes White Dragon',
                type: 'Monster',
                desc: 'This legendary dragon is a powerful engine of destruction...',
                race: 'Dragon',
                card_images: [{ id: 89631139, image_url: 'url1', image_url_small: 'url1_small', image_url_cropped: 'url1_cropped' }]
            };
            const mockCardDetails1: CardDetails = { tags: ['Monster', 'Normal'] };

            mockGetCardById
                .mockResolvedValueOnce(mockCardInfo1)
            mockGetCardDetails
                .mockResolvedValueOnce(mockCardDetails1)

            const result = await ydkeManager.importFromString(validYdkeString);

            expect(result.deck.size).toBe(1);
            expect(result.deck.get('Blue-Eyes White Dragon')).toEqual({ qty: 1, tags: ['Monster', 'Normal'] });
            expect(mockGetCardById).toHaveBeenCalledTimes(1);
            expect(mockGetCardDetails).toHaveBeenCalledTimes(1);
        });

        it('should throw an error for no prefix', async () => {
            const ydkeString = 'pKlXBQ==!!!'

            await expect(ydkeManager.importFromString(ydkeString)).rejects.toThrow('Invalid url format. Expected ydke://...!');
        });

        it('should throw an error for invalid suffix', async () => {
            const ydkeString = 'ydke://pKlXBQ==!!!#'

            await expect(ydkeManager.importFromString(ydkeString)).rejects.toThrow('Invalid url format. Expected ydke://...!');
        });

        it('should throw an error for invalid components', async () => {
            const ydkeString = 'ydke://pKlXBQ==!!'

            await expect(ydkeManager.importFromString(ydkeString)).rejects.toThrow('Invalid url format. Expected 3 components');
        });
    });

    describe('exportDeckToString', () => {
        it('should export a card to a valid YDKE string', async () => {
            const mockDeck = new Map<string, CardDetails>([
                ['Blue-Eyes White Dragon', { qty: 1, tags: ['Monster', 'Normal'] }],
            ]);

            mockGetCardByName
                .mockResolvedValueOnce({ id: 89631139, name: 'Blue-Eyes White Dragon' } as CardInformation)

            const result = await ydkeManager.exportDeckToString(mockDeck);

            expect(result).toBe('ydke://o6lXBQ==!!!');
            expect(mockGetCardByName).toHaveBeenCalledTimes(1);
        });

        it('should export a deck to a valid YDKE string', async () => {
            const mockDeck = new Map<string, CardDetails>([
                ['Blue-Eyes White Dragon', { qty: 2, tags: ['Monster', 'Normal'] }],
                ['Dark Magician', { qty: 1, tags: ['Monster', 'Normal'] }]
            ]);

            mockGetCardByName
                .mockResolvedValueOnce({ id: 89631139, name: 'Blue-Eyes White Dragon' } as CardInformation)
                .mockResolvedValueOnce({ id: 46986414, name: 'Dark Magician' } as CardInformation);

            const result = await ydkeManager.exportDeckToString(mockDeck);

            expect(result).toBe('ydke://o6lXBaOpVwWu9MwC!!!');
            expect(mockGetCardByName).toHaveBeenCalledTimes(2);
        });

        it('should handle errors when fetching card information', async () => {
            const mockDeck = new Map<string, CardDetails>([
                ['Blue-Eyes White Dragon', { qty: 1, tags: ['Monster', 'Normal'] }],
                ['Nonexistent Card', { qty: 1, tags: ['Monster'] }]
            ]);

            mockGetCardByName
                .mockResolvedValueOnce({ id: 89631139, name: 'Blue-Eyes White Dragon' } as CardInformation)
                .mockResolvedValueOnce(null);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await ydkeManager.exportDeckToString(mockDeck);

            expect(result).toBe('ydke://o6lXBQ==!!!');
            expect(consoleSpy).toHaveBeenCalledWith('No card found for name Nonexistent Card');
            expect(mockGetCardByName).toHaveBeenCalledTimes(2);

            consoleSpy.mockRestore();
        });
    });

    describe('exportConditionsToString', () => {
        it('should return an empty string', async () => {
            const mockConditions: Condition[] = [
                new Condition('Blue-Eyes White Dragon', 1, '>=')
            ];

            const result = await ydkeManager.exportConditionsToString(mockConditions);

            expect(result).toBe('');
        });
    });

    describe('exportSimulationToString', () => {
        it('should export a simulation to a valid YDKE string', async () => {
            const mockSimulation: SimulationInput = {
                deck: new Map<string, CardDetails>([
                    ['Blue-Eyes White Dragon', { qty: 1, tags: ['Monster', 'Normal'] }]
                ]),
                conditions: []
            };

            mockGetCardByName
                .mockResolvedValueOnce({ id: 89631139, name: 'Blue-Eyes White Dragon' } as CardInformation);

            const result = await ydkeManager.exportSimulationToString(mockSimulation);

            expect(result).toBe('ydke://o6lXBQ==!!!');
            expect(mockGetCardByName).toHaveBeenCalledTimes(1);
        });

        it('should handle empty deck', async () => {
            const mockSimulation: SimulationInput = {
                deck: new Map<string, CardDetails>(),
                conditions: []
            };

            const result = await ydkeManager.exportSimulationToString(mockSimulation);

            expect(result).toBe('ydke://!!!');
            expect(mockGetCardByName).not.toHaveBeenCalled();
        });
    });
});