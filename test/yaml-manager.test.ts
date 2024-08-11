import { loadFromYamlFile, loadFromYamlString, serialiseConditionsToYaml, serialiseCardsToYaml, serialiseSimulationInputToYaml } from '../src/utils/yaml-manager';
import { Deck } from '../src/utils/deck';
import { CreateCard } from '../src/utils/card';
import { Condition, AndCondition, OrCondition, BaseCondition } from '../src/utils/condition';
import * as yaml from 'js-yaml';
import * as cardApi from '../src/utils/card-api';
import { SimulationInput } from '../src/utils/simulation-input';
import { CardDetails } from '../src/utils/card-details';

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

describe('YAML Manager', () => {
    const mockGetCardById = cardApi.getCardById as jest.MockedFunction<typeof cardApi.getCardById>;

    beforeEach(() => {
        // Apply mocks
        (global as any).File = MockFile;
        (global as any).FileReader = MockFileReader;
        (global as any).ProgressEvent = MockProgressEvent;

        jest.resetAllMocks();
    });
    
    afterEach(() => {
        jest.restoreAllMocks();
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
            const result = loadFromYamlString(yamlString);
            
            expect(result.conditions).toHaveLength(2);
            expect(result.deck.get('Card1')?.qty).toBe(3);
            expect(result.deck.get('Card2')?.qty).toBe(2);
            expect(result.conditions[0]).toBe('2+ Card1');
            expect(result.conditions[1]).toBe('(1 Card2 OR 2 Card1)');
        });

        it('should handle no quantity specified', () => {
            const yamlString = `
                deck:
                    Card1:
                        qty: 1
            `;
            const result = loadFromYamlString(yamlString);
            
            expect(result.deck).toBeInstanceOf(Map);
            expect(result.deck.size).toBe(1);
            expect(result.deck.get('Card1')?.qty).toBe(1);
        });

        it('should throw an error for invalid YAML', () => {
            const invalidYaml = `
                deck:
                    - This is invalid
                conditions:
                    - Also invalid
            `;
            expect(() => loadFromYamlString(invalidYaml)).toThrow();
        });

        it('should throw an error for invalid deck structure', () => {
            const invalidYaml = `
              deck:
                invalidCard: 'not an object'
              conditions: []
            `;
            expect(() => loadFromYamlString(invalidYaml)).toThrow('Invalid card details');
        });
          
        it('should throw an error for invalid card structure', () => {
            const invalidYaml = `
              deck:
                Card1:
                  qty: 'not a number'
                  tags: 'not an array'
              conditions: []
            `;
            expect(() => loadFromYamlString(invalidYaml)).toThrow('Invalid card structure');
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
            
            const result = await loadFromYamlFile(mockFile as unknown as File);
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
            await expect(loadFromYamlFile(mockFile)).rejects.toThrow('Read error');
        });
    });

    describe('serialiseDeckToYaml', () => {
        it('should correctly serialise a deck to YAML', () => {
            const cards = new Map<string, CardDetails>([
                ['Card1', { qty: 2, tags: ['Tag1', 'Tag2'] }],
                ['Card2', { tags: ['Tag3'] }]
            ]);
            const result = serialiseCardsToYaml(cards);
            const parsed = yaml.load(result) as { deck: any };
            expect(parsed.deck.Card1.qty).toBe(2);
            expect(parsed.deck.Card2.qty).toBe(undefined);
        });

        it('should correctly handle duplicate cards', () => {
            const cards = new Map<string, CardDetails>([
                ['Card1', { qty: 2, tags: ['Tag1'] }],
                ['Card2', { tags: ['Tag2'] }],
            ]);
            const result = serialiseCardsToYaml(cards);
            const parsed = yaml.load(result) as { deck: any };
            expect(parsed.deck.Card1.qty).toBe(2);
            expect(parsed.deck.Card2.qty).toBe(undefined);
        });
    });

    describe('serialiseConditionsToYaml', () => {
        it('should correctly serialise conditions to YAML', () => {
            const conditions = [
                new Condition('Card1', 2, '>='),
                new OrCondition([
                    new Condition('Card2', 1, '='),
                    new Condition('Card1', 2, ">=")
                ])
            ];
            const result = serialiseConditionsToYaml(conditions);
            const parsed = yaml.load(result) as { conditions: string[] };
            expect(parsed.conditions).toHaveLength(2);
            expect(parsed.conditions[0]).toBe('2+ Card1 IN Hand');
            expect(parsed.conditions[1]).toBe('(1 Card2 IN Hand OR 2+ Card1 IN Hand)');
        });

        it('should correctly serialise complex conditions', () => {
            const condition = new AndCondition([
                new Condition('Card1', 2, '>='),
                new OrCondition([
                    new Condition('Card2', 1, '='),
                    new Condition('Card3', 3, '<='),
                ]),
            ]);
            const result = serialiseConditionsToYaml([condition]);
            const parsed = yaml.load(result) as { conditions: string[] };
            expect(parsed.conditions[0]).toBe('(2+ Card1 IN Hand AND (1 Card2 IN Hand OR 3- Card3 IN Hand))');
        });
    });

    describe('serialiseSimulationInputToYaml', () => {
        it('should correctly serialise a complete simulation input to YAML', () => {
            const deck = new Map([
                ['Card1', { tags: ['Tag1'] }],
                ['Card2', { tags: ['Tag2'] }]
            ]);
            const conditions = [
                '1+ Card1',
                '(Card1 AND Card2)'
            ];
            const input: SimulationInput = { deck, conditions };
            const result = serialiseSimulationInputToYaml(input);
            const parsed = yaml.load(result) as { deck: any, conditions: string[] };
            expect(parsed.deck.Card1.qty).toBe(undefined);
            expect(parsed.deck.Card2.qty).toBe(undefined);
            expect(parsed.conditions).toHaveLength(2);
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
        const result = loadFromYamlString(yamlString);
        
        expect(result.deck.size).toBe(2);
        expect(result.conditions).toHaveLength(2);
        expect(result.conditions[0]).toBe('2+ 1');
        expect(result.conditions[1]).toBe('(1 2 OR 2 1)');
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
            const result = loadFromYamlString(yamlString);
            
            expect(result.deck.size).toBe(1);
            expect(result.conditions).toHaveLength(1);
            expect(result.conditions[0]).toBe('2+ "Card A"');
        });
    });
});