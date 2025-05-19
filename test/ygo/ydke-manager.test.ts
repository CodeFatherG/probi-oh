import ydkeManager from '@services/ydke-manager'; // Adjust the import path as needed
import { getCard } from '@api/ygopro/card-api';
import { getCardDetails } from '@services/yugioh/details-provider';
import { CardInformation } from '@/types/card-information';
import { CardCondition, CardDetails, ConditionLocation, ConditionOperator } from '@probi-oh/types';
import { SimulationInput } from '@probi-oh/types';

// Mock the imported functions
jest.mock('@api/ygopro/card-api');
jest.mock('@services/yugioh/details-provider');

describe('YDKE Manager', () => {
    // Mock implementations
    const mockGetCard = getCard as jest.MockedFunction<typeof getCard>;
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

            mockGetCard
                .mockResolvedValueOnce(mockCardInfo1)
            mockGetCardDetails
                .mockResolvedValueOnce(mockCardDetails1)

            const result = await ydkeManager.importFromString(validYdkeString);

            expect(result.deck.size).toBe(1);
            expect(result.deck.get('Blue-Eyes White Dragon')).toEqual({ qty: 1, tags: ['Monster', 'Normal'] });
            expect(mockGetCard).toHaveBeenCalledTimes(1);
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
            mockGetCard
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
            expect(mockGetCard).toHaveBeenCalledTimes(3);
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

            mockGetCard
                .mockResolvedValueOnce(mockCardInfo1)
            mockGetCardDetails
                .mockResolvedValueOnce(mockCardDetails1)

            const result = await ydkeManager.importFromString(validYdkeString);

            expect(result.deck.size).toBe(1);
            expect(result.deck.get('Blue-Eyes White Dragon')).toEqual({ qty: 1, tags: ['Monster', 'Normal'] });
            expect(mockGetCard).toHaveBeenCalledTimes(1);
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

            mockGetCard
                .mockResolvedValueOnce({ id: 89631139, name: 'Blue-Eyes White Dragon' } as CardInformation)

            const result = await ydkeManager.exportDeckToString(mockDeck);

            expect(result).toBe('ydke://o6lXBQ==!!!');
            expect(mockGetCard).toHaveBeenCalledTimes(1);
        });

        it('should export a deck to a valid YDKE string', async () => {
            const mockDeck = new Map<string, CardDetails>([
                ['Blue-Eyes White Dragon', { qty: 2, tags: ['Monster', 'Normal'] }],
                ['Dark Magician', { qty: 1, tags: ['Monster', 'Normal'] }]
            ]);

            mockGetCard
                .mockResolvedValueOnce({ id: 89631139, name: 'Blue-Eyes White Dragon' } as CardInformation)
                .mockResolvedValueOnce({ id: 46986414, name: 'Dark Magician' } as CardInformation);

            const result = await ydkeManager.exportDeckToString(mockDeck);

            expect(result).toBe('ydke://o6lXBaOpVwWu9MwC!!!');
            expect(mockGetCard).toHaveBeenCalledTimes(2);
        });

        it('should handle errors when fetching card information', async () => {
            const mockDeck = new Map<string, CardDetails>([
                ['Blue-Eyes White Dragon', { qty: 1, tags: ['Monster', 'Normal'] }],
                ['Nonexistent Card', { qty: 1, tags: ['Monster'] }]
            ]);

            mockGetCard
                .mockResolvedValueOnce({ id: 89631139, name: 'Blue-Eyes White Dragon' } as CardInformation)
                .mockResolvedValueOnce(null);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await ydkeManager.exportDeckToString(mockDeck);

            expect(result).toBe('ydke://o6lXBQ==!!!');
            expect(consoleSpy).toHaveBeenCalledWith('No card found for name Nonexistent Card');
            expect(mockGetCard).toHaveBeenCalledTimes(2);

            consoleSpy.mockRestore();
        });
    });

    describe('exportConditionsToString', () => {
        it('should return an empty string', async () => {
            const mockConditions: CardCondition[] = [
                {
                    kind: 'card',
                    cardName: 'Blue-Eyes White Dragon',
                    cardCount: 1,
                    operator: ConditionOperator.AT_LEAST,
                    location: ConditionLocation.HAND
                },
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

            mockGetCard
                .mockResolvedValueOnce({ id: 89631139, name: 'Blue-Eyes White Dragon' } as CardInformation);

            const result = await ydkeManager.exportSimulationToString(mockSimulation);

            expect(result).toBe('ydke://o6lXBQ==!!!');
            expect(mockGetCard).toHaveBeenCalledTimes(1);
        });

        it('should handle empty deck', async () => {
            const mockSimulation: SimulationInput = {
                deck: new Map<string, CardDetails>(),
                conditions: []
            };

            const result = await ydkeManager.exportSimulationToString(mockSimulation);

            expect(result).toBe('ydke://!!!');
            expect(mockGetCard).not.toHaveBeenCalled();
        });
    });
});