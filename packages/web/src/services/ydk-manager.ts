import { CardDetails, Condition } from '@probi-oh/types';
import { getCardDetails } from '@services/yugioh/details-provider';
import { DataFileManager } from '@probi-oh/core/src/data-file';
import { SimulationInput } from '@probi-oh/types';
import { getCard } from '@external/ygopro/card-api';

class YdkManager implements DataFileManager {
    private static instance: YdkManager;

    public static getInstance(): YdkManager {
        if (!YdkManager.instance) {
            YdkManager.instance = new YdkManager();
        }
        return YdkManager.instance;
    }

    public async importFromString(ydkString: string): Promise<SimulationInput> {
        // Split content into lines, handling both \n and \r\n
        const lines = ydkString.split(/\r?\n/);
        
        // Find the start and end indices for the main deck
        const mainDeckStart = lines.findIndex(line => line.trim() === '#main') + 1;
        const extraDeckStart = lines.findIndex(line => line.trim() === '#extra');
        const mainDeckEnd = extraDeckStart !== -1 ? extraDeckStart : lines.length;
        
        if (mainDeckStart === 0) {
            throw new Error("Invalid YDK file: #main section not found");
        }

        // Extract and parse main deck card IDs
        const mainDeckIds = lines.slice(mainDeckStart, mainDeckEnd)
            .filter(line => line.trim() !== '' && !isNaN(parseInt(line.trim())))
            .map(line => parseInt(line.trim()));

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

    public async exportDeckToString(cards: Record<string, CardDetails>): Promise<string> {
        let ydkString = "#Created by Probi-Oh\n#tags=\n#main\n";

        for (const cardName of Object.keys(cards)) {
            const info = await getCard(cardName);

            if (!info) {
                console.error(`No card found for ${cardName}`);
                continue;
            }

            const details = cards[cardName];
            if (details) {
                for (let i = 0; i < (details.qty || 0); i++) {
                    ydkString += `${info.id}\n`;
                }
            }
        }

        ydkString += "#extra\n!side\n";

        return ydkString;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async exportConditionsToString(conditions: Condition[]): Promise<string> {
        return '';
    }

    public async exportSimulationToString(simulation: SimulationInput): Promise<string> {
        return this.exportDeckToString(simulation.deck);
    }
}

export default YdkManager.getInstance();
