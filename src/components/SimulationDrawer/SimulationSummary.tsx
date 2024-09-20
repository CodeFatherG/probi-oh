import React, { useState, useEffect } from "react";
import { SimulationRecord } from '../../core/data/simulation-record';
import { Box, Card, Stack, Typography, CircularProgress, IconButton } from "@mui/material";
import { loadFromYamlString } from "../../core/data/yaml-manager";
import CardImage from './../CardTable/CardImage';
import { CardDetails } from "../../core/data/card-details";
import { getArchetypes } from "../../core/ygo/card-api";
import { ForwardOutlined } from "@mui/icons-material";

interface SimulationSummaryProps {
    record: SimulationRecord;
    onApply: (simulationId: string) => void;
}

export default function SimulationSummary({ record, onApply }: SimulationSummaryProps): JSX.Element {
    const [selectedCardName, setSelectedCardName] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEntryImage = async () => {
            setLoading(true);
            setError(null);
            try {
                const card = await entryImage();
                if (card) {
                    setSelectedCardName(card);
                } else {
                    throw new Error("No valid card found");
                }
            } catch (err) {
                console.error("Error fetching entry image:", err);
                setError("Failed to load card");
            } finally {
                setLoading(false);
            }
        };

        fetchEntryImage();
    }, [record]);

    const entryImage = async (): Promise<string | null> => {
        const cards = Array.from(loadFromYamlString(record.yaml).deck) as [string, CardDetails][];
        const archetypeMap = new Map<string, [string, CardDetails][]>();
        const archetypes = await getArchetypes();

        console.log(`Looking for display card. Total cards: ${cards.length}`);
    
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
    
        // Find the archetype with the most entries
        let maxArchetype: string | null = null;
        let maxCount = 0;
    
        for (const [archetype, cards] of archetypeMap.entries()) {
            if (cards.length > maxCount) {
                maxArchetype = archetype;
                maxCount = cards.length;
            }
        }
    
        // If we found an archetype, randomly select a card from it
        if (maxArchetype) {
            console.log(`Found archetype: ${maxArchetype} with ${maxCount} cards`);
            const cardsInArchetype = archetypeMap.get(maxArchetype)!;
            const randomIndex = Math.floor(Math.random() * cardsInArchetype.length);
            const [selectedCardName, ] = cardsInArchetype[randomIndex];

            console.log(`Selected card: ${selectedCardName}`);
    
            // Return the name of the randomly selected card
            return selectedCardName || null;
        }
    
        // If no archetype was found, return the first valid card name or null
        console.log('No archetype found, selecting first valid card');
        for (const [cardName, ] of cards) {
            if (cardName && cardName.trim() !== "") {
                console.log(`Selected first valid card: ${cardName}`);
                return cardName;
            }
        }

        console.log('No valid cards found in the deck');
        return null;
    }

    return (
        <Card
            sx={{
                padding: '6px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
            }}
        >
            <Box
                sx={{
                    width: '120px',
                    height: '120px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                }}
            >
                {loading ? (
                    <CircularProgress />
                ) : error ? (
                    <Typography color="error">{error}</Typography>
                ) : selectedCardName ? (
                    <CardImage
                        name={selectedCardName}
                        type="cropped"
                        sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                        }}
                    />
                ) : (
                    <Typography>No card available</Typography>
                )}
            </Box>
            <Stack
                alignContent={'center'}
                ml={2}
            >
                <Typography variant='body1'>{(record.result * 100).toFixed(2)}%</Typography>
                <IconButton size='large' onClick={() => onApply(record.id)}>
                    <ForwardOutlined />
                </IconButton>
            </Stack>
        </Card>
    );
}