import { Box, Stack } from "@mui/material";
import React, { useMemo, useState } from "react";
import FileInput from "./FileInput";
import SaveFileComponent from "./SaveFile";
import CopyButton from "./CopyButton";
import CardTable from "../CardTable/CardTable";
import ConditionList from "../ConditionList/ConditionList";
import { CardDetails } from "../../../core/data/card-details";
import { loadFromYamlFile, serialiseSimulationInputToYaml } from "../../../core/data/yaml-manager";
import { loadFromYdkFile } from "../../../core/data/ydk-manager";
import LoadingOverlay from "./LoadingOverlay";
import { getCardByName } from "../../../core/ygo/card-api";
import { getCardDetails } from "../../../core/ygo/details-provider";
import { parseCondition } from "../../../core/data/parser";
import { SimulationInput } from "../../../core/data/simulation-input";

interface ConfigBuilderProps {
    cardData: Map<string, CardDetails>;
    conditionData: string[];
    onCardsUpdate: (cards: Map<string, CardDetails>) => void;
    onConditionsUpdate: (conditions: string[]) => void;
}

export default function ConfigBuilder({ cardData, conditionData, onCardsUpdate, onConditionsUpdate }: ConfigBuilderProps) {
    const [isLoading, setIsLoading] = useState(false);

    const autocompleteOptions = useMemo(() => {
        const options = new Set<string>();
        cardData.forEach((details, name) => {
            options.add(name);
            details.tags?.forEach(tag => options.add(tag));
        });
        return Array.from(options);
    }, [cardData]);

    const handleFileUpload = async (file: File) => {
        setIsLoading(true);
        try {
            if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
                const input = await loadFromYamlFile(file);
                onCardsUpdate(input.deck);
                onConditionsUpdate(input.conditions);
            }
            else if (file.name.endsWith('.ydk')) {
                onCardsUpdate(await loadFromYdkFile(file));
                onConditionsUpdate([]);
            }
            
            console.log('File loaded successfully:', file.name);
        } finally {
            setIsLoading(false);
        }
    };

    // CardTable callback hooks
    const handleUpdateCard = (name: string, details: CardDetails) => {
        const newData = new Map(cardData);
        newData.set(name, details);
        onCardsUpdate(newData);
    };

    const handleCreateCard = async (name: string) => {
        if (cardData.has(name)) {
            console.warn(`Card "${name}" already exists`);
            return;
        }

        let cardDetails: CardDetails = {qty: 1};
        const cardInfo = await getCardByName(name);

        if (cardInfo !== null) {
            // We have Card Info, lets make some populated data
            cardDetails = await getCardDetails(cardInfo);
            cardDetails.qty = 1;
        }

        handleUpdateCard(name, cardDetails);
    };

    const handleDeleteCards = (names: string[]) => {
        const cards = new Map(cardData);
        names.forEach(name => cards.delete(name));
        onCardsUpdate(cards);
    };

    const handleReorderCards = (reorderedCards: Map<string, CardDetails>) => {
        onCardsUpdate(reorderedCards);
    };

    const handleConditionsChange = (newConditions: string[]) => {
        const conditions: string[] = [];
        for (const condition of newConditions) {
            if (condition.trim() !== '') {
                // Will throw if fatal error
                parseCondition(condition);

                // If we made it here then valid condition
                conditions.push(condition);
            }
        }

        onConditionsUpdate(conditions);
    };

    return (
        <>
            <LoadingOverlay isLoading={isLoading} />
            <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" gap={2}>
                        <FileInput 
                            onFileUpload={handleFileUpload} 
                            acceptedExtensions={[".yaml", ".yml", ".ydk"]} 
                            importPrompt="Import File" 
                        />
                        <SaveFileComponent 
                            cardData={cardData} 
                            conditionData={conditionData} 
                        />
                    </Box>
                    <CopyButton 
                        getText={() => {
                            const input: SimulationInput = {
                                deck: cardData,
                                conditions: conditionData,
                            };
            
                            return serialiseSimulationInputToYaml(input);
                        }}
                    />
                </Box>
                <CardTable
                    cards={cardData}
                    onUpdateCard={handleUpdateCard}
                    onCreateCard={handleCreateCard}
                    onDeleteCards={handleDeleteCards}
                    onReorderCards={handleReorderCards}
                />
                <ConditionList 
                    conditions={conditionData} 
                    onConditionsChange={handleConditionsChange}
                    autocompleteOptions={autocompleteOptions}
                />
            </Stack>
        </>
    );
}