import React, { useState, useEffect } from "react";
import { Box, Card, Stack, Typography, CircularProgress, IconButton } from "@mui/material";
import CardImage from './../CardTable/CardImage';
import { CardDetails } from "../../core/data/card-details";
import { getArchetypes } from "../../core/ygo/card-api";
import { ForwardOutlined } from "@mui/icons-material";
import { simulationCache } from "../../db/simulations/simulation-cache";

interface SimulationSummaryProps {
    simulationId: string;
    onApply: (simulationId: string) => void;
}

export default function SimulationSummary({ simulationId, onApply }: SimulationSummaryProps): JSX.Element {
    const [selectedCardName, setSelectedCardName] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<number>(0);

    useEffect(() => {
        const fetchSimulation = async () => {
            console.log('Fetching simulation:', simulationId);
            const data = await simulationCache.getSimulationById(simulationId);
            if (data) {
                fetchEntryImage();
                setResult(data.result);
            } else {
                console.error(`Failed to get simulation ${simulationId}`);
            }
        };

        const fetchEntryImage = async () => {
            const entryImage = async (): Promise<string | null> => {
                const archetypeMap = new Map<string, [string, CardDetails][]>();
                const archetypes = await getArchetypes();
        
                const input = await simulationCache.getSimulationInputById(simulationId);
                
                if (!input) {
                    console.error('Failed to get simulation input');
                    return null;
                }
    
                const cards = input.deck;
    
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

        fetchSimulation();
    }, [simulationId]);

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
                <Typography variant='body1'>{(result * 100).toFixed(2)}%</Typography>
                <IconButton size='large' onClick={() => onApply(simulationId)}>
                    <ForwardOutlined />
                </IconButton>
            </Stack>
        </Card>
    );
}