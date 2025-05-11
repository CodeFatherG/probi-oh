import { Box, Stack } from "@mui/material";
import React, { useMemo, useState } from "react";
import CardTable from "../CardTable/CardTable";
import ConditionList from "../ConditionList/ConditionList";
import { CardDetails } from "@probi-oh/types";
import LoadingOverlay from "./LoadingOverlay";
import { getCardDetails } from "@ygo/details-provider";
import { parseCondition } from "@probi-oh/core/src/parser";
import { SimulationInput } from "@probi-oh/types";
import { DataFileManager } from "@probi-oh/core/src/data-file";
import ydkManager from "@/ygo/ydk-manager";
import yamlManager from "@probi-oh/core/src/yaml-manager";
import ydkeManager from "@/ygo/ydke-manager";
import { ClipboardInput, FileInput } from "./IO/ImportButtons";
import {ClipboardOutput, FileOutput} from "./IO/ExportButtons";
import { getDeckName } from "@/ygo/archetype";
import { saveAs } from "file-saver";
import { getCard } from "@/ygo/card-api";

interface ConfigBuilderProps {
    cardData: Map<string, CardDetails>;
    conditionData: string[];
    onCardsUpdate: (cards: Map<string, CardDetails>) => void;
    onConditionsUpdate: (conditions: string[]) => void;
}

const fileManagerDict: { [key: string]: DataFileManager } = {
    '.yml':     yamlManager,
    '.yaml':    yamlManager,
    '.ydk':     ydkManager,
    '.ydke':    ydkeManager,
};

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

    const handleFileUpload = async (content: string, extension: string) => {
        setIsLoading(true);
        try {
            if (!fileManagerDict[extension]) {
                throw new Error(`Unsupported file type ${extension}`);
            }

            const simInput = await fileManagerDict[extension].importFromString(content);
            onCardsUpdate(simInput.deck);
            onConditionsUpdate(simInput.conditions);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClipboardUpload = async (content: string) => {
        setIsLoading(true);

        // Try to import as each supported file type
        for (const extension in fileManagerDict) {
            try {
                const simInput = await fileManagerDict[extension].importFromString(content);
                onCardsUpdate(simInput.deck);
                onConditionsUpdate(simInput.conditions);
                break;
            } catch (err) {
                console.error(`Failed to import from clipboard as ${extension}:`, err);
            }
        }

        setIsLoading(false);
    }

    const handleFileDownload = async (extension: string) => {
        if (extension in fileManagerDict) {
            const input: SimulationInput = {
                deck: cardData,
                conditions: conditionData,
            };

            const content = await fileManagerDict[extension].exportSimulationToString(input);
            const filename = `${await getDeckName(cardData)}${extension}$`

            saveAs(new Blob([content], {type: 'text/plain;charset=utf-8'}), filename);
        }
    };

    const handleClipboardCopy = async (extension: string): Promise<string> =>  {
        const input: SimulationInput = {
            deck: cardData,
            conditions: conditionData,
        };

        if (extension in fileManagerDict) {
            return await fileManagerDict[extension].exportSimulationToString(input);
        } else {
            throw new Error(`Unsupported file type ${extension}`);
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
        const cardInfo = await getCard(name);

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

    const acceptedExtensions = Object.keys(fileManagerDict);
    if (acceptedExtensions.includes('.yaml') && acceptedExtensions.includes('.yml')) {
        acceptedExtensions.splice(acceptedExtensions.indexOf('.yml'), 1);
    }

    return (
        <>
            <LoadingOverlay isLoading={isLoading} />
            <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex">
                        <FileInput 
                            onClick={handleFileUpload} 
                            acceptedExtensions={acceptedExtensions}
                        />
                        <ClipboardInput
                            onClick={handleClipboardUpload}
                        />
                    </Box>
                    <Box display='flex'>
                        <FileOutput
                            onClick={handleFileDownload}
                            acceptedExtensions={acceptedExtensions}
                        />
                        <ClipboardOutput 
                            getContent={handleClipboardCopy}
                            acceptedExtensions={acceptedExtensions}
                        />
                    </Box>
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