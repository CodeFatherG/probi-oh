import { CardDetails } from "@probi-oh/types";
import { getArchetypes } from "../../api/ygopro/card-api";

export async function getDeckArchetypes(cards: Map<string, CardDetails>): Promise<Record<string, [string, CardDetails][]>> {
    const archetypeMap = new Map<string, [string, CardDetails][]>();
    const archetypes = await getArchetypes();

    // Count how many cards of each archetype are in the deck
    for (const [cardName, cardDetails] of cards) {
        if (cardDetails.tags) {
            for (const tag of cardDetails.tags) {
                if (archetypes.includes(tag)) {
                    if (!archetypeMap.has(tag)) {
                        archetypeMap.set(tag, []);
                    }
                    archetypeMap.get(tag)!.push([cardName, cardDetails]);
                }
            }
        }
    }

    return Object.fromEntries(archetypeMap);
}

export async function getDeckName(deck: Map<string, CardDetails>): Promise<string> {
    const archetypeList = await getDeckArchetypes(deck);
    console.log(`Deck archetypes: ${JSON.stringify(archetypeList)}`);

    if (Object.keys(archetypeList).length === 0) {
        return 'Unknown';
    }

    const maxArchetype = Object.keys(archetypeList).reduce((a, b) => archetypeList[a].length > archetypeList[b].length ? a : b);
    console.log(`Max archetype: ${maxArchetype} with ${archetypeList[maxArchetype].length} cards`);

    if (Object.keys(archetypeList).length !== 1) {
        // if the second most common archetype is at least 50% as common as the most common archetype, then return Second Most First Most
        const secondMaxArchetype = Object.keys(archetypeList).reduce((a, b) => archetypeList[a].length > archetypeList[b].length && a !== maxArchetype ? a : b);
        if (archetypeList[secondMaxArchetype].length >= archetypeList[maxArchetype].length / 2) {
            return `${secondMaxArchetype} ${maxArchetype}`;
        }
    }

    return maxArchetype;
}
