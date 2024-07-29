import { YamlManager, SimulationInput } from '../src/utils/yaml-manager';
import { Deck } from '../src/utils/deck';
import { Card, CreateCard } from '../src/utils/card';
import { Condition, AndCondition, OrCondition, BaseCondition } from '../src/utils/condition';
import * as yaml from 'js-yaml';
import * as cardApi from '../src/utils/card-api';

jest.mock('../src/utils/card-api');

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

describe('YamlManager', () => {
    let yamlManager: YamlManager;
    const mockGetCardById = cardApi.getCardById as jest.MockedFunction<typeof cardApi.getCardById>;

    beforeEach(() => {
        yamlManager = YamlManager.getInstance();
        // Apply mocks
        (global as any).File = MockFile;
        (global as any).FileReader = MockFileReader;
        (global as any).ProgressEvent = MockProgressEvent;

        jest.resetAllMocks();
    });
    
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getInstance', () => {
        it('should always return the same instance', () => {
            const instance1 = YamlManager.getInstance();
            const instance2 = YamlManager.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('loadFromYamlString', () => {
        it('should correctly parse a valid YAML string', () => {
            const yamlString = `
                deck:
                    Card1:
                        qty: 3
                        tags: [Tag1, Tag2]
                    Card2:
                        qty: 2
                        tags: [Tag3]
                conditions:
                    - 2+ Card1
                    - (1 Card2 OR 2 Card1)
            `;
            const result = yamlManager.loadFromYamlString(yamlString);
            
            expect(result.deck).toBeInstanceOf(Deck);
            expect(result.deck.deckCount).toBe(40);
            expect(result.conditions).toHaveLength(2);
            expect(result.conditions[0]).toBeInstanceOf(Condition);
            expect(result.conditions[1]).toBeInstanceOf(OrCondition);
        });

        it('should throw an error for invalid YAML', () => {
            const invalidYaml = `
                deck:
                    - This is invalid
                conditions:
                    - Also invalid
            `;
            expect(() => yamlManager.loadFromYamlString(invalidYaml)).toThrow();
        });

        it('should throw an error for invalid deck structure', () => {
            const invalidYaml = `
              deck:
                invalidCard: 'not an object'
              conditions: []
            `;
            expect(() => yamlManager.loadFromYamlString(invalidYaml)).toThrow('Invalid card details');
          });
          
          it('should throw an error for invalid card structure', () => {
            const invalidYaml = `
              deck:
                Card1:
                  qty: 'not a number'
                  tags: 'not an array'
              conditions: []
            `;
            expect(() => yamlManager.loadFromYamlString(invalidYaml)).toThrow('Invalid card structure');
          });
    });

    describe('loadFromYamlFile', () => {
        it('should load YAML from a file', async () => {
            const mockFileContent = `
                deck:
                    Card1:
                        qty: 3
                        tags: [Tag1, Tag2]
                conditions:
                    - 1+ Card1
            `;
            const mockFile = new MockFile([mockFileContent], 'test.yaml', { type: 'application/x-yaml' });
            
            const result = await yamlManager.loadFromYamlFile(mockFile as unknown as File);
            expect(result.deck).toBeInstanceOf(Deck);
            expect(result.conditions).toHaveLength(1);
        });

        it('should handle file read errors', async () => {
            const mockFile = new File([], 'test.yaml');
            const mockFileReader = {
                readAsText: jest.fn().mockImplementation(function(this: any) {
                    setTimeout(() => {
                    if (this.onerror) {
                        this.onerror(new Error('Read error'));
                    }
                    }, 0);
                }),
                onload: null as any,
                onerror: null as any,
            };
            (global as any).FileReader = jest.fn(() => mockFileReader);
            await expect(yamlManager.loadFromYamlFile(mockFile)).rejects.toThrow('Read error');
        });
    });

    describe('convertYdkToYaml', () => {
        it('should convert YDK to YAML', async () => {
            const ydkContent = `#created by...
            #main
            12345
            67890
            #extra
            54321`;
            const mockFile = new MockFile([ydkContent], 'test.ydk', { type: 'text/plain' });
    
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
                });
    
            const result = await yamlManager.convertYdkToYaml(mockFile as unknown as File);
            expect(result).toContain('Card A:');
            expect(result).toContain('Card B:');
        });
    });

    describe('serializeDeckToYaml', () => {
        it('should correctly serialize a deck to YAML', () => {
            const cards = [
                CreateCard('Card1', { tags: ['Tag1', 'Tag2'] }),
                CreateCard('Card1', { tags: ['Tag1', 'Tag2'] }),
                CreateCard('Card2', { tags: ['Tag3'] })
            ];
            const deck = new Deck(cards);
            const result = yamlManager.serializeDeckToYaml(deck);
            const parsed = yaml.load(result) as { deck: any };
            expect(parsed.deck.Card1.qty).toBe(2);
            expect(parsed.deck.Card2.qty).toBe(1);
        });

        it('should correctly handle duplicate cards', () => {
            const cards = [
                CreateCard('Card1', { tags: ['Tag1'] }),
                CreateCard('Card1', { tags: ['Tag1'] }),
                CreateCard('Card2', { tags: ['Tag2'] }),
            ];
            const deck = new Deck(cards);
            const result = yamlManager.serializeDeckToYaml(deck);
            const parsed = yaml.load(result) as { deck: any };
            expect(parsed.deck.Card1.qty).toBe(2);
            expect(parsed.deck.Card2.qty).toBe(1);
        });
    });

    describe('serializeConditionsToYaml', () => {
        it('should correctly serialize conditions to YAML', () => {
            const conditions = [
                new Condition('Card1', 2, '>='),
                new OrCondition([
                    new Condition('Card2', 1, '='),
                    new Condition('Card1', 2, ">=")
                ])
            ];
            const result = yamlManager.serializeConditionsToYaml(conditions);
            const parsed = yaml.load(result) as { conditions: string[] };
            expect(parsed.conditions).toHaveLength(2);
            expect(parsed.conditions[0]).toBe('2+ Card1');
            expect(parsed.conditions[1]).toBe('(Card2 OR 2+ Card1)');
        });

        it('should correctly serialize complex conditions', () => {
            const condition = new AndCondition([
                new Condition('Card1', 2, '>='),
                new OrCondition([
                    new Condition('Card2', 1, '='),
                    new Condition('Card3', 3, '<='),
                ]),
            ]);
            const result = yamlManager.serializeConditionsToYaml([condition]);
            const parsed = yaml.load(result) as { conditions: string[] };
            expect(parsed.conditions[0]).toBe('(2+ Card1 AND (Card2 OR 3 Card3))');
        });
    });

    describe('serializeSimulationInputToYaml', () => {
        it('should correctly serialize a complete simulation input to YAML', () => {
            const cards = [
                CreateCard('Card1', { tags: ['Tag1'] }),
                CreateCard('Card2', { tags: ['Tag2'] })
            ];
            const deck = new Deck(cards);
            const conditions = [
                new Condition('Card1', 1, '>='),
                new AndCondition([
                    new Condition('Card1', 1, '='),
                    new Condition('Card2', 1, '=')
                ])
            ];
            const input: SimulationInput = { deck, conditions };
            const result = yamlManager.serializeSimulationInputToYaml(input);
            const parsed = yaml.load(result) as { deck: any, conditions: string[] };
            expect(parsed.deck.Card1.qty).toBe(1);
            expect(parsed.deck.Card2.qty).toBe(1);
            expect(parsed.conditions).toHaveLength(2);
        });
    });

    describe('yaml getter', () => {
        it('should return the yaml property', () => {
            const yamlManager = YamlManager.getInstance();
            expect(yamlManager.yaml).toBeNull(); // Assuming it's initially null
        });
    });

    describe('input getter', () => {
        it('should return the input property', () => {
            const yamlManager = YamlManager.getInstance();
            expect(yamlManager.input).toBeNull(); // Assuming it's initially null
        });
    });

    describe('loadFromYamlString', () => {
        it('should throw an error for null input', () => {
            const yamlManager = YamlManager.getInstance();
            expect(() => yamlManager.loadFromYamlString(null as any)).toThrow('Invalid YAML structure: not an object');
        });

        it('should throw an error for missing deck', () => {
            const yamlManager = YamlManager.getInstance();
            const invalidYaml = `
                conditions:
                    - 1+ Card1
            `;
            expect(() => yamlManager.loadFromYamlString(invalidYaml)).toThrow('Invalid YAML structure: deck must be an object');
        });

        it('should throw an error for missing conditions', () => {
            const yamlManager = YamlManager.getInstance();
            const invalidYaml = `
                deck:
                    Card1:
                        qty: 3
                        tags: [Tag1, Tag2]
            `;
            expect(() => yamlManager.loadFromYamlString(invalidYaml)).toThrow('Invalid YAML structure: conditions must be an array');
        });
    });

    describe('conditionToString', () => {
        it('should handle AndCondition', () => {
            const yamlManager = YamlManager.getInstance();
            const condition = new AndCondition([
                new Condition('Card1', 2, '>='),
                new Condition('Card2', 1, '=')
            ]);
            const result = yamlManager['conditionToString'](condition); // Accessing private method
            expect(result).toBe('(2+ Card1 AND Card2)');
        });

        it('should handle OrCondition', () => {
            const yamlManager = YamlManager.getInstance();
            const condition = new OrCondition([
                new Condition('Card1', 2, '>='),
                new Condition('Card2', 1, '=')
            ]);
            const result = yamlManager['conditionToString'](condition); // Accessing private method
            expect(result).toBe('(2+ Card1 OR Card2)');
        });

        it('should throw an error for unknown condition type', () => {
            const yamlManager = YamlManager.getInstance();
            const unknownCondition = {} as BaseCondition;
            expect(() => yamlManager['conditionToString'](unknownCondition)).toThrow('Unknown condition type');
        });
    });

    describe('readFileContent', () => {
        it('should handle file read errors', async () => {
            const yamlManager = YamlManager.getInstance();
            const mockFile = new MockFile([], 'test.yaml');
            
            // Mock the FileReader
            const mockFileReader = {
                readAsText: jest.fn().mockImplementation(function(this: any) {
                    setTimeout(() => {
                        if (this.onerror) {
                            this.onerror(new Error('Read error'));
                        }
                    }, 0);
                }),
                onload: null as any,
                onerror: null as any,
            };
            (global as any).FileReader = jest.fn(() => mockFileReader);
    
            await expect(yamlManager['readFileContent'](mockFile as unknown as File)).rejects.toThrow('Read error');
        });
    });
});

describe('Edge Cases', () => {
    it('should deserialise a condition with a numbered card name', () => {
        const yamlString = `
            deck:
                1:
                    qty: 3
                    tags: [Tag1, Tag2]
                2:
                    qty: 2
                    tags: [Tag3]
            conditions:
                - 2+ 1
                - (1 2 OR 2 1)
        `;
        const yamlManager = YamlManager.getInstance();
        const result = yamlManager.loadFromYamlString(yamlString);
        
        expect(result.deck).toBeInstanceOf(Deck);
        expect(result.deck.deckCount).toBe(40);
        expect(result.conditions).toHaveLength(2);
        expect(result.conditions[0]).toBeInstanceOf(Condition);
        expect(result.conditions[1]).toBeInstanceOf(OrCondition);
        expect((result.conditions[0] as Condition).cardName).toBe('1');
        expect((result.conditions[0] as Condition).quantity).toBe(2);
        expect((result.conditions[0] as Condition).operator).toBe('>=');
        expect((result.conditions[1] as OrCondition).conditions[0]).toBeInstanceOf(Condition);
        expect((result.conditions[1] as OrCondition).conditions[1]).toBeInstanceOf(Condition);
        expect(((result.conditions[1] as OrCondition).conditions[0] as Condition).cardName).toBe('2');
        expect(((result.conditions[1] as OrCondition).conditions[0] as Condition).quantity).toBe(1);
        expect(((result.conditions[1] as OrCondition).conditions[0] as Condition).operator).toBe('=');
        expect(((result.conditions[1] as OrCondition).conditions[1] as Condition).cardName).toBe('1');
        expect(((result.conditions[1] as OrCondition).conditions[1] as Condition).quantity).toBe(2);
        expect(((result.conditions[1] as OrCondition).conditions[1] as Condition).operator).toBe('=');
    });

    describe('Handle "" card names', () => {
        it('should deserialise a condition with card name starting ""', () => {
            const yamlString = `
                deck:
                    "Card A":
                        qty: 3
                        tags: [Tag1, Tag2]
                conditions:
                    - 2+ "Card A"
            `;
            const yamlManager = YamlManager.getInstance();
            const result = yamlManager.loadFromYamlString(yamlString);
            
            expect(result.deck).toBeInstanceOf(Deck);
            expect(result.deck.deckCount).toBe(40);
            expect(result.conditions).toHaveLength(1);
            expect(result.conditions[0]).toBeInstanceOf(Condition);
            expect((result.conditions[0] as Condition).cardName).toBe('"Card A"');
            expect((result.conditions[0] as Condition).quantity).toBe(2);
            expect((result.conditions[0] as Condition).operator).toBe('>=');
        });
    })
    
});