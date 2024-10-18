import ydkManager from '@ygo/ydk-manager';
import { getCardById, getCardByName } from '@ygo/card-api';
import { getCardDetails } from '@ygo/details-provider';
import { CardDetails } from '@server/card-details';
import { CardInformation } from '@ygo/card-information';

// Mock the imported functions
jest.mock('@ygo/card-api');
jest.mock('@ygo/details-provider');

// Mock ProgressEvent
class MockProgressEvent {
    type: string;
    target: any;

    constructor(type: string, init?: { target?: any }) {
        this.type = type;
        this.target = init?.target;
    }
}

// Mock File
class MockFile implements Partial<File> {
    name: string;
    private content: string;

    constructor(bits: BlobPart[], filename: string, options?: FilePropertyBag) {
        this.name = filename;
        this.content = bits.join('');
    }

    text(): Promise<string> {
        return Promise.resolve(this.content);
    }
}

class MockFileReader implements Partial<FileReader> {
    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    result: string | ArrayBuffer | null = null;

    readAsText(file: Blob): void {
        setTimeout(async () => {
            try {
                if (file instanceof MockFile) {
                    this.result = await file.text();
                    if (this.onload) {
                        const event = new MockProgressEvent('load', { target: this });
                        this.onload.call(this as unknown as FileReader, event as ProgressEvent<FileReader>);
                    }
                }
            } catch (error) {
                if (this.onerror) {
                    const event = new MockProgressEvent('error', { target: this });
                    this.onerror.call(this as unknown as FileReader, event as ProgressEvent<FileReader>);
                }
            }
        }, 0);
    }
}

describe('YDK Manager', () => {
    // Mock implementations
    const mockGetCardById = getCardById as jest.MockedFunction<typeof getCardById>;
    const mockGetCardByName = getCardByName as jest.MockedFunction<typeof getCardByName>;
    const mockGetCardDetails = getCardDetails as jest.MockedFunction<typeof getCardDetails>;

    beforeEach(() => {
        // Apply mocks
        (global as any).File = MockFile;
        (global as any).FileReader = MockFileReader;
        (global as any).ProgressEvent = MockProgressEvent;

        jest.resetAllMocks();
    });

    describe('ydkManager.importFromString', () => {
        it('should load cards from a valid YDK string', async () => {
            const validYdkString = '#created by...\n#main\n12345\n67890\n#extra\n!side\n';
            const mockCardInfo1: CardInformation = {
                id: 12345,
                name: 'Card 1',
                type: 'Monster',
                desc: 'Description 1',
                race: 'Warrior',
                card_images: [{ id: 12345, image_url: 'url1', image_url_small: 'url1_small', image_url_cropped: 'url1_cropped' }]
            };
            const mockCardInfo2: CardInformation = {
                id: 67890,
                name: 'Card 2',
                type: 'Spell',
                desc: 'Description 2',
                race: 'Normal',
                card_images: [{ id: 67890, image_url: 'url2', image_url_small: 'url2_small', image_url_cropped: 'url2_cropped' }]
            };
            const mockCardDetails1: CardDetails = { tags: ['Monster'] };
            const mockCardDetails2: CardDetails = { tags: ['Spell'] };

            mockGetCardById
                .mockResolvedValueOnce(mockCardInfo1)
                .mockResolvedValueOnce(mockCardInfo2);
            mockGetCardDetails
                .mockResolvedValueOnce(mockCardDetails1)
                .mockResolvedValueOnce(mockCardDetails2);

            const result = await ydkManager.importFromString(validYdkString);

            expect(result.deck.size).toBe(2);
            expect(result.deck.get('Card 1')).toEqual({qty: 1, tags: ['Monster']});
            expect(result.deck.get('Card 2')).toEqual({qty: 1, tags: ['Spell']});
            expect(mockGetCardById).toHaveBeenCalledTimes(2);
            expect(mockGetCardDetails).toHaveBeenCalledTimes(2);
        });

        it('should throw an error for invalid YDK string', async () => {
            const invalidYdkString = 'Invalid YDK string';

            await expect(ydkManager.importFromString(invalidYdkString)).rejects.toThrow('Invalid YDK file: #main section not found');
        });

        it('should handle empty main deck', async () => {
            const emptyMainDeckYdk = '#created by...\n#main\n#extra\n!side\n';

            const result = await ydkManager.importFromString(emptyMainDeckYdk);

            expect(result.deck.size).toBe(0);
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
                card_images: [{ id: 12345, image_url: 'url1', image_url_small: 'url1_small', image_url_cropped: 'url1_cropped' }]
            };
            const mockCardInfo2: CardInformation = {
                id: 67890,
                name: 'Card 2',
                type: 'Spell',
                desc: 'Description 2',
                race: 'Normal',
                card_images: [{ id: 67890, image_url: 'url2', image_url_small: 'url2_small', image_url_cropped: 'url2_cropped' }]
            };
            const mockCardDetails: CardDetails = { tags: ['Monster'] };

            mockGetCardById
                .mockResolvedValueOnce(mockCardInfo1)
                .mockResolvedValueOnce(mockCardInfo2);
            mockGetCardDetails.mockResolvedValue(mockCardDetails);

            const result = await ydkManager.importFromString(ydkWithInvalidId);

            expect(result.deck.size).toBe(2);
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
                card_images: [{ id: 67890, image_url: 'url2', image_url_small: 'url2_small', image_url_cropped: 'url2_cropped'  }]
            });
            mockGetCardDetails.mockResolvedValue({ tags: ['Spell'] });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await ydkManager.importFromString(validYdkString);

            expect(result.deck.size).toBe(1);
            expect(result.deck.get('Card 2')).toEqual({ qty: 1, tags: ['Spell'] });
            expect(consoleSpy).toHaveBeenCalledWith('Error fetching card with ID 12345:', expect.any(Error));
            
            consoleSpy.mockRestore();
        });
    });

    describe('ydkManager.exportDeckToString', () => {
        it('should serialise cards to YDK string format', async () => {
            const mockCards = new Map<string, CardDetails>([
                ['Card 1', { qty: 1, tags: ['Monster'] }],
                ['Card 2', { qty: 1, tags: ['Spell'] }],
            ]);

            mockGetCardByName
                .mockResolvedValueOnce({
                    id: 12345,
                    name: 'Card 1',
                    type: 'Monster',
                    desc: 'Description 1',
                    race: 'Warrior',
                    card_images: [{ id: 12345, image_url: 'url1', image_url_small: 'url1_small', image_url_cropped: 'url1_cropped' }]
                })
                .mockResolvedValueOnce({
                    id: 67890,
                    name: 'Card 2',
                    type: 'Spell',
                    desc: 'Description 2',
                    race: 'Normal',
                    card_images: [{ id: 67890, image_url: 'url2', image_url_small: 'url2_small', image_url_cropped: 'url2_cropped' }]
                });

            const result = await ydkManager.exportDeckToString(mockCards);

            expect(result).toBe('#Created by Probi-Oh\n#tags=\n#main\n12345\n67890\n#extra\n!side\n');
            expect(mockGetCardByName).toHaveBeenCalledTimes(2);
        });

        it('should serialise cards with multiple qty to YDK string format', async () => {
            const mockCards = new Map<string, CardDetails>([
                ['Card 1', { qty: 2, tags: ['Monster'] }],
                ['Card 2', { qty: 1, tags: ['Spell'] }],
            ]);

            mockGetCardByName
                .mockResolvedValueOnce({
                    id: 12345,
                    name: 'Card 1',
                    type: 'Monster',
                    desc: 'Description 1',
                    race: 'Warrior',
                    card_images: [{ id: 12345, image_url: 'url1', image_url_small: 'url1_small', image_url_cropped: 'url1_cropped' }]
                })
                .mockResolvedValueOnce({
                    id: 67890,
                    name: 'Card 2',
                    type: 'Spell',
                    desc: 'Description 2',
                    race: 'Normal',
                    card_images: [{ id: 67890, image_url: 'url2', image_url_small: 'url2_small', image_url_cropped: 'url2_cropped' }]
                });

            const result = await ydkManager.exportDeckToString(mockCards);

            expect(result).toBe('#Created by Probi-Oh\n#tags=\n#main\n12345\n12345\n67890\n#extra\n!side\n');
            expect(mockGetCardByName).toHaveBeenCalledTimes(2);
        });

        it('should handle errors when fetching card information', async () => {
            const mockCards = new Map<string, CardDetails>([
                ['Card 1', { qty:1, tags: ['Monster'] }],
                ['Card 2', { qty:1, tags: ['Spell'] }],
            ]);

            mockGetCardByName
                .mockResolvedValueOnce({
                    id: 12345,
                    name: 'Card 1',
                    type: 'Monster',
                    desc: 'Description 1',
                    race: 'Warrior',
                    card_images: [{ id: 12345, image_url: 'url1', image_url_small: 'url1_small', image_url_cropped: 'url1_cropped' }]
                })
                .mockResolvedValueOnce(null);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await ydkManager.exportDeckToString(mockCards);

            expect(result).toBe('#Created by Probi-Oh\n#tags=\n#main\n12345\n#extra\n!side\n');
            expect(consoleSpy).toHaveBeenCalledWith('No card found for Card 2');
            
            consoleSpy.mockRestore();
        });

        it('should return a valid YDK string for an empty deck', async () => {
            const emptyCards = new Map<string, CardDetails>();

            const result = await ydkManager.exportDeckToString(emptyCards);

            expect(result).toBe('#Created by Probi-Oh\n#tags=\n#main\n#extra\n!side\n');
            expect(mockGetCardByName).not.toHaveBeenCalled();
        });
    });
});