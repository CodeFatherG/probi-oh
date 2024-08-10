import { loadFromYdkString, serialiseCardsToYdk } from '../src/utils/ydk-manager';
import { getCardById, getCardByName } from '../src/utils/card-api';
import { getCardDetails } from '../src/utils/details-provider';
import { CardDetails } from '../src/utils/card-details';
import { CardInformation } from '../src/utils/card-information';

// Mock the imported functions
jest.mock('../src/utils/card-api');
jest.mock('../src/utils/details-provider');

describe('YDK Manager', () => {
    // Mock implementations
    const mockGetCardById = getCardById as jest.MockedFunction<typeof getCardById>;
    const mockGetCardByName = getCardByName as jest.MockedFunction<typeof getCardByName>;
    const mockGetCardDetails = getCardDetails as jest.MockedFunction<typeof getCardDetails>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('loadFromYdkString', () => {
        it('should load cards from a valid YDK string', async () => {
            const validYdkString = '#created by...\n#main\n12345\n67890\n#extra\n!side\n';
            const mockCardInfo1: CardInformation = {
                id: 12345,
                name: 'Card 1',
                type: 'Monster',
                desc: 'Description 1',
                race: 'Warrior',
                card_images: [{ id: 12345, image_url: 'url1', image_url_small: 'url1_small' }]
            };
            const mockCardInfo2: CardInformation = {
                id: 67890,
                name: 'Card 2',
                type: 'Spell',
                desc: 'Description 2',
                race: 'Normal',
                card_images: [{ id: 67890, image_url: 'url2', image_url_small: 'url2_small' }]
            };
            const mockCardDetails1: CardDetails = { tags: ['Monster'] };
            const mockCardDetails2: CardDetails = { tags: ['Spell'] };

            mockGetCardById
                .mockResolvedValueOnce(mockCardInfo1)
                .mockResolvedValueOnce(mockCardInfo2);
            mockGetCardDetails
                .mockResolvedValueOnce(mockCardDetails1)
                .mockResolvedValueOnce(mockCardDetails2);

            const result = await loadFromYdkString(validYdkString);

            expect(result.size).toBe(2);
            expect(result.get('Card 1')).toEqual(mockCardDetails1);
            expect(result.get('Card 2')).toEqual(mockCardDetails2);
            expect(mockGetCardById).toHaveBeenCalledTimes(2);
            expect(mockGetCardDetails).toHaveBeenCalledTimes(2);
        });

        it('should throw an error for invalid YDK string', async () => {
            const invalidYdkString = 'Invalid YDK string';

            await expect(loadFromYdkString(invalidYdkString)).rejects.toThrow('Invalid YDK file: #main section not found');
        });

        it('should handle empty main deck', async () => {
            const emptyMainDeckYdk = '#created by...\n#main\n#extra\n!side\n';

            const result = await loadFromYdkString(emptyMainDeckYdk);

            expect(result.size).toBe(0);
            expect(mockGetCardById).not.toHaveBeenCalled();
            expect(mockGetCardDetails).not.toHaveBeenCalled();
        });

        it('should skip invalid card IDs', async () => {
            const ydkWithInvalidId = '#created by...\n#main\n12345\ninvalid\n67890\n#extra\n!side\n';
            const mockCardInfo1: CardInformation = {
                id: 12345,
                name: 'Card 1',
                type: 'Monster',
                desc: 'Description 1',
                race: 'Warrior',
                card_images: [{ id: 12345, image_url: 'url1', image_url_small: 'url1_small' }]
            };
            const mockCardInfo2: CardInformation = {
                id: 67890,
                name: 'Card 2',
                type: 'Spell',
                desc: 'Description 2',
                race: 'Normal',
                card_images: [{ id: 67890, image_url: 'url2', image_url_small: 'url2_small' }]
            };
            const mockCardDetails: CardDetails = { tags: ['Monster'] };

            mockGetCardById
                .mockResolvedValueOnce(mockCardInfo1)
                .mockResolvedValueOnce(mockCardInfo2);
            mockGetCardDetails.mockResolvedValue(mockCardDetails);

            const result = await loadFromYdkString(ydkWithInvalidId);

            expect(result.size).toBe(2);
            expect(mockGetCardById).toHaveBeenCalledTimes(2);
            expect(mockGetCardDetails).toHaveBeenCalledTimes(2);
        });

        it('should handle errors when fetching card information', async () => {
            const validYdkString = '#created by...\n#main\n12345\n67890\n#extra\n!side\n';
            mockGetCardById.mockRejectedValueOnce(new Error('API Error'));
            mockGetCardById.mockResolvedValueOnce({
                id: 67890,
                name: 'Card 2',
                type: 'Spell',
                desc: 'Description 2',
                race: 'Normal',
                card_images: [{ id: 67890, image_url: 'url2', image_url_small: 'url2_small' }]
            });
            mockGetCardDetails.mockResolvedValue({ tags: ['Spell'] });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await loadFromYdkString(validYdkString);

            expect(result.size).toBe(1);
            expect(result.get('Card 2')).toEqual({ tags: ['Spell'] });
            expect(consoleSpy).toHaveBeenCalledWith('Error fetching card with ID 12345:', expect.any(Error));
            
            consoleSpy.mockRestore();
        });
    });

    describe('serialiseCardsToYdk', () => {
        it('should serialise cards to YDK string format', async () => {
            const mockCards = new Map<string, CardDetails>([
                ['Card 1', { tags: ['Monster'] }],
                ['Card 2', { tags: ['Spell'] }],
            ]);

            mockGetCardByName
                .mockResolvedValueOnce({
                    id: 12345,
                    name: 'Card 1',
                    type: 'Monster',
                    desc: 'Description 1',
                    race: 'Warrior',
                    card_images: [{ id: 12345, image_url: 'url1', image_url_small: 'url1_small' }]
                })
                .mockResolvedValueOnce({
                    id: 67890,
                    name: 'Card 2',
                    type: 'Spell',
                    desc: 'Description 2',
                    race: 'Normal',
                    card_images: [{ id: 67890, image_url: 'url2', image_url_small: 'url2_small' }]
                });

            const result = await serialiseCardsToYdk(mockCards);

            expect(result).toBe('#Created by Probi-Oh\n#tags=\n#main\n12345\n67890\n#extra\n!side\n');
            expect(mockGetCardByName).toHaveBeenCalledTimes(2);
        });

        it('should handle errors when fetching card information', async () => {
            const mockCards = new Map<string, CardDetails>([
                ['Card 1', { tags: ['Monster'] }],
                ['Card 2', { tags: ['Spell'] }],
            ]);

            mockGetCardByName
                .mockResolvedValueOnce({
                    id: 12345,
                    name: 'Card 1',
                    type: 'Monster',
                    desc: 'Description 1',
                    race: 'Warrior',
                    card_images: [{ id: 12345, image_url: 'url1', image_url_small: 'url1_small' }]
                })
                .mockResolvedValueOnce(null);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await serialiseCardsToYdk(mockCards);

            expect(result).toBe('#Created by Probi-Oh\n#tags=\n#main\n12345\n#extra\n!side\n');
            expect(consoleSpy).toHaveBeenCalledWith('No card found for Card 2');
            
            consoleSpy.mockRestore();
        });

        it('should return a valid YDK string for an empty deck', async () => {
            const emptyCards = new Map<string, CardDetails>();

            const result = await serialiseCardsToYdk(emptyCards);

            expect(result).toBe('#Created by Probi-Oh\n#tags=\n#main\n#extra\n!side\n');
            expect(mockGetCardByName).not.toHaveBeenCalled();
        });
    });
});