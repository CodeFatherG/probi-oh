import React, { useState, useEffect } from "react";
import { Box, Card, Stack, Typography, CircularProgress, IconButton, Snackbar } from "@mui/material";
import CardImage from './../CardTable/CardImage';
import { ForwardOutlined, Share } from "@mui/icons-material";
import { simulationCache } from "../../db/simulations/simulation-cache";
import { getDeckArchetypes, getDeckName } from "../../core/ygo/archetype";

interface SimulationSummaryProps {
    simulationId: string;
    onApply: (simulationId: string) => void;
}

export default function SimulationSummary({ simulationId, onApply }: SimulationSummaryProps): JSX.Element {
    const [selectedCardName, setSelectedCardName] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<number>(0);
    const [linkShared, setLinkShared] = useState<boolean>(false);
    const [deckName, setDeckName] = useState<string | null>(null);

    useEffect(() => {
        const fetchSimulation = async () => {
            console.log('Fetching simulation:', simulationId);
            const data = await simulationCache.getSimulationById(simulationId);
            if (data) {
                fetchEntryImage();
                fetchDeckName();
                setResult(data.result);
            } else {
                console.error(`Failed to get simulation ${simulationId}`);
            }
        };

        const fetchDeckName = async () => {
            const input = await simulationCache.getSimulationInputById(simulationId);
                
            if (!input) {
                console.error('Failed to get simulation input');
                return null;
            }

            const cards = input.deck;

            let deckName = await getDeckName(cards);

            console.log(`Deck name: ${deckName}`);

            const sim = await simulationCache.getSimulationById(simulationId);
            if (sim) {
                deckName = `${deckName} - ${sim.data_hash.substring(sim.data_hash.length - 4)}`;
            }

            setDeckName(deckName);
        };

        const fetchEntryImage = async () => {
            const entryImage = async (): Promise<string | null> => {
                const input = await simulationCache.getSimulationInputById(simulationId);
                
                if (!input) {
                    console.error('Failed to get simulation input');
                    return null;
                }
    
                const cards = input.deck;

                const archetypeList = await getDeckArchetypes(cards);
                const maxArchetype = Object.keys(archetypeList).reduce((a, b) => archetypeList[a].length > archetypeList[b].length ? a : b);
            
                // If we found an archetype, randomly select a card from it
                if (maxArchetype) {
                    console.log(`Found archetype: ${maxArchetype} with ${archetypeList[maxArchetype]} cards`);
                    const cardsInArchetype = archetypeList[maxArchetype]!;
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
                position: 'relative',
            }}
        >
            <IconButton 
                    size='small' 
                    onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/?id=${simulationId}`);
                        setLinkShared(true);
                    }}
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 1,
                        bgcolor: 'background.paper',
                        '&:hover': {
                            bgcolor: 'background.paper',
                        },
                    }}
                >
                    <Share fontSize="small" />
            </IconButton>
            <Stack
                alignItems='center'
            >
                <Box
                    display='flex'
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
                                    borderRadius: '8px',
                                }}
                            />
                        ) : (
                            <Typography>No card available</Typography>
                        )}
                    </Box>
                    <Stack
                        justifyContent='center'
                        alignItems='center'
                        ml={2}
                    >
                            <Typography variant='body1'>{(result * 100).toFixed(2)}%</Typography>
                            <IconButton size='large' onClick={() => onApply(simulationId)}>
                                <ForwardOutlined />
                            </IconButton>
                    </Stack>
                </Box>
                <Typography 
                    variant='body1' 
                    mt={1} 
                    sx={{
                        textOverflow:'ellipsis'
                    }}
                >
                    {deckName}
                </Typography>
            </Stack>
            <Snackbar
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                open={linkShared}
                autoHideDuration={3000}
                onClose={() => setLinkShared(false)}
                message="Link copied to clipboard"
            />
        </Card>
    );
}