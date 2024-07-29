import { convertYdkToYaml } from '../src/utils/ydk-to-yaml';
import * as cardApi from '../src/utils/card-api';

jest.mock('../src/utils/card-api');

describe('convertYdkToYaml', () => {
    const mockGetCardById = cardApi.getCardById as jest.MockedFunction<typeof cardApi.getCardById>;

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should convert a valid YDK content to YAML', async () => {
        const ydkContent = `#created by...
#main
12345
67890
#extra
54321
#side
98765`;

        mockGetCardById
            .mockResolvedValueOnce({
                id: 12345,
                name: 'Card A',
                type: 'Monster',
                desc: 'Description A',
                race: 'Warrior',
                card_images: [{ id: 12345, image_url: 'url_a', image_url_small: 'small_url_a' }]
            })
            .mockResolvedValueOnce({
                id: 67890,
                name: 'Card B',
                type: 'Spell',
                desc: 'Description B',
                race: 'Normal',
                card_images: [{ id: 67890, image_url: 'url_b', image_url_small: 'small_url_b' }]
            })
            .mockResolvedValueOnce({
                id: 54321,
                name: 'Card C',
                type: 'Monster',
                desc: 'Description C',
                race: 'Dragon',
                card_images: [{ id: 54321, image_url: 'url_c', image_url_small: 'small_url_c' }]
            });

        const result = await convertYdkToYaml(ydkContent);
        expect(result).toContain('deck:');
        expect(result).toContain('Card A:');
        expect(result).toContain('Card B:');
        expect(result).not.toContain('Card C:'); // Extra deck cards should not be included
        expect(result).toContain('qty: 1');
        expect(result).toContain('tags:');
        expect(result).toContain('- Monster');
        expect(result).toContain('- Spell');
        expect(result).toContain('- Warrior');
        expect(result).toContain('- Normal');
        expect(result).toContain('conditions: []');
    });

    it('should handle YDK content without #main section', async () => {
        const ydkContent = `#created by...
#extra
54321
#side
98765`;

        await expect(convertYdkToYaml(ydkContent)).rejects.toThrow('Invalid YDK file: #main section not found');
    });

    it('should handle empty main deck', async () => {
        const ydkContent = `#created by...
#main
#extra
54321
#side
98765`;

        const result = await convertYdkToYaml(ydkContent);
        expect(result).toBe('deck: {}\nconditions: []\n');
    });

    it('should handle API errors', async () => {
        const ydkContent = `#created by...
#main
12345
67890
#extra
54321`;

        mockGetCardById
            .mockResolvedValueOnce({
                id: 12345,
                name: 'Card A',
                type: 'Monster',
                desc: 'Description A',
                race: 'Warrior',
                card_images: [{ id: 12345, image_url: 'url_a', image_url_small: 'small_url_a' }]
            })
            .mockRejectedValueOnce(new Error('API Error'));

        const result = await convertYdkToYaml(ydkContent);
        expect(result).toContain('Card A:');
        expect(result).not.toContain('Card B:');
    });

    it('should handle cards without race', async () => {
        const ydkContent = `#created by...
#main
12345
#extra
54321`;

        mockGetCardById.mockResolvedValueOnce({
            id: 12345,
            name: 'Card A',
            type: 'Spell',
            desc: 'Description A',
            race: '',
            card_images: [{ id: 12345, image_url: 'url_a', image_url_small: 'small_url_a' }]
        });

        const result = await convertYdkToYaml(ydkContent);
        expect(result).toContain('Card A:');
        expect(result).toContain('- Spell');
        expect(result).not.toContain(`- ${/\r?\n/}`);
    });

    it('should handle no extra definition', async () => {
        const ydkContent = `#created by...
#main
12345`;

        mockGetCardById.mockResolvedValueOnce({
            id: 12345,
            name: 'Card A',
            type: 'Effect Monster',
            desc: 'Description A',
            race: 'Warrior',
            card_images: [{ id: 12345, image_url: 'url_a', image_url_small: 'small_url_a' }]
        });

        const result = await convertYdkToYaml(ydkContent);
        expect(result).toContain('Card A:');
        expect(result).toContain('- Effect Monster');
        expect(result).toContain('- Warrior');
    });

    it('should handle duplicate cards', async () => {
        const ydkContent = `#created by...
#main
12345
12345
#extra
54321`;

        mockGetCardById.mockResolvedValue({
            id: 12345,
            name: 'Card A',
            type: 'Monster',
            desc: 'Description A',
            race: 'Warrior',
            card_images: [{ id: 12345, image_url: 'url_a', image_url_small: 'small_url_a' }]
        });

        const result = await convertYdkToYaml(ydkContent);
        expect(result).toContain('Card A:');
        expect(result).toContain('qty: 2');
    });
});