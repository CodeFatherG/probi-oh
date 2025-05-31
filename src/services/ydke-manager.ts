import { CardDetails, Condition } from "@probi-oh/types";
import { DataFileManager } from "@probi-oh/core/src/data-file";
import { SimulationInput } from "@probi-oh/types";
import { getCardDetails } from "./yugioh/details-provider";
import { getCard } from "@api/ygopro/card-api";

class YdkeManager implements DataFileManager {
    private static instance: YdkeManager;

    private constructor() {}

    public static getInstance(): YdkeManager {
        if (!YdkeManager.instance) {
            YdkeManager.instance = new YdkeManager();
        }
        return YdkeManager.instance;
    }

    /**
     * Import a YDKE url string to a SimulationInput object.
     * https://github.com/AlphaKretin/bastion-bot/blob/0349cdced8ad2d2de5c4758ea7312197505e94ef/commands/deck.ts
     * @param data The YDKE url string
     */
    public async importFromString(data: string): Promise<SimulationInput> {
        const extractIds = (base64: string): number[] => {
            const byte = (c: string): number => {
                return c.charCodeAt(0);
            }

            return Array.from(new Uint32Array(Uint8Array.from(atob(base64), byte).buffer, ));
        }

        if (!data.startsWith('ydke://') 
            || !data.endsWith('!')) {
            throw new Error('Invalid url format. Expected ydke://...!');
        }

        const components = data.slice("ydke://".length).slice(0, -1).split("!");

        if (components.length != 3) {
            throw new Error('Invalid url format. Expected 3 components');
        }

        const mainDeckIds = extractIds(components[0]);

        const cards: Record<string, CardDetails> = {};

        // Fetch card details and build the deck object
        for (const id of mainDeckIds) {
            try {
                const cardInfo = await getCard(id);

                if (!cardInfo) {
                    console.error(`No card found for ID ${id}`);
                    continue;
                }

                if (!cards[cardInfo.name]) {
                    cards[cardInfo.name] = await getCardDetails(cardInfo);
                }

                const details = cards[cardInfo.name];
                if (details) {
                    details.qty = (details.qty || 0) + 1;
                    cards[cardInfo.name] = details;
                }
            } catch (error) {
                console.error(`Error fetching card with ID ${id}:`, error);
            }
        }

        return {
            deck: cards,
            conditions: []
        };
    }

    public async exportDeckToString(deck: Record<string, CardDetails>): Promise<string> {
        const encodeIds = (ids: number[]): string => {
            const buffer = new Uint8Array(new Uint32Array(ids).buffer);
            return btoa(String.fromCharCode(...buffer));
        }

        const cardIds: number[] = [];
        for (const [name, details] of Object.entries(deck)) {
            try {
                const info = await getCard(name);

                if (!info) {
                    console.error(`No card found for name ${name}`);
                    continue;
                }

                cardIds.push(...Array(details.qty || 0).fill(info.id));
            } catch (error) {
                console.error(`Error fetching card with name ${name}:`, error);
            }
        }

        return `ydke://${encodeIds(cardIds)}!!!`;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async exportConditionsToString(conditions: Condition[]): Promise<string> {
        return '';
    }

    public async exportSimulationToString(simulation: SimulationInput): Promise<string> {
        return await this.exportDeckToString(simulation.deck);
    }
}

export default YdkeManager.getInstance();