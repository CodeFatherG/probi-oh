import { Box, Stack } from "@mui/material";
import React, { useMemo, useState } from "react";
import CardTable from "./CardTable";
import ConditionList from "./ConditionList";
import { CardDetails, Condition } from "@probi-oh/types";
import LoadingOverlay from "@shared/components/LoadingOverlay";
import { getCardDetails } from "@services/yugioh/details-provider";
import { SimulationInput } from "@probi-oh/types";
import { DataFileManager } from "@probi-oh/core/src/data-file";
import ydkManager from "@services/ydk-manager";
import yamlManager from "@probi-oh/core/src/yaml-manager";
import ydkeManager from "@services/ydke-manager";
import jsonManager from "@probi-oh/core/src/json-manager";
import { ClipboardInput, FileInput } from "./IO/ImportButtons";
import {ClipboardOutput, FileOutput} from "./IO/ExportButtons";
import { getDeckName } from "@services/yugioh/archetype";
import { saveAs } from "file-saver";
import { getCard } from "@api/ygopro/card-api";

interface ConfigBuilderProps {
    cardData: Record<string, CardDetails>;
    conditionData: Condition[];
    onCardsUpdate: (cards: Record<string, CardDetails>) => void;
    onConditionsUpdate: (conditions: Condition[]) => void;
}

const fileManagerDictInput: { [key: string]: DataFileManager } = {
    '.yml':     yamlManager,
    '.yaml':    yamlManager,
    '.ydk':     ydkManager,
    '.ydke':    ydkeManager,
    '.json':   jsonManager,
};

const fileManagerDictOutput: { [key: string]: DataFileManager } = {
    '.ydk':     ydkManager,
    '.ydke':    ydkeManager,
    '.json':   jsonManager,
};

export default function ConfigBuilder({ cardData, conditionData, onCardsUpdate, onConditionsUpdate }: ConfigBuilderProps) {
    const [isLoading, setIsLoading] = useState(false);
    
    const autocompleteOptions = useMemo(() => {
        const options = new Set<string>();
        Object.entries(cardData).forEach(([name, details]) => {
            options.add(name);
            details.tags?.forEach(tag => options.add(tag));
        });
        return Array.from(options);
    }, [cardData]);

    const handleFileUpload = async (content: string, extension: string) => {
        setIsLoading(true);
        try {
            if (!fileManagerDictInput[extension]) {
                throw new Error(`Unsupported file type ${extension}`);
            }

            const simInput = await fileManagerDictInput[extension].importFromString(content);
            onCardsUpdate(simInput.deck);
            onConditionsUpdate(simInput.conditions);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClipboardUpload = async (content: string) => {
        setIsLoading(true);

        // Try to import as each supported file type
        for (const extension in fileManagerDictInput) {
            try {
                const simInput = await fileManagerDictInput[extension].importFromString(content);
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
        if (extension in fileManagerDictOutput) {
            const input: SimulationInput = {
                deck: cardData,
                conditions: conditionData,
            };

            const content = await fileManagerDictOutput[extension].exportSimulationToString(input);
            const filename = `${await getDeckName(cardData)}${extension}`;

            saveAs(new Blob([content], {type: 'text/plain;charset=utf-8'}), filename);
        }
    };

    const handleClipboardCopy = async (extension: string): Promise<string> =>  {
        const input: SimulationInput = {
            deck: cardData,
            conditions: conditionData,
        };

        if (extension in fileManagerDictOutput) {
            return await fileManagerDictOutput[extension].exportSimulationToString(input);
        } else {
            throw new Error(`Unsupported file type ${extension}`);
        }
    };

    // CardTable callback hooks
    const handleUpdateCard = (name: string, details: CardDetails) => {
        const newData = { ...cardData };
        newData[name] = details;
        onCardsUpdate(newData);
    };

    const handleCreateCard = async (name: string) => {
        if (cardData[name]) {
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
        const cards = cardData;
        names.forEach(name => delete cards[name]);
        onCardsUpdate(cards);
    };

    const handleReorderCards = (reorderedCards: Record<string, CardDetails>) => {
        onCardsUpdate(reorderedCards);
    };

    const handleConditionsChange = (newConditions: Condition[]) => {
        const conditions: Condition[] = [];
        for (const condition of newConditions) {
            conditions.push(condition);
            onConditionsUpdate(conditions);
        }
    };

    return (
        <>
            <LoadingOverlay isLoading={isLoading} />
            <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex">
                        <FileInput 
                            onClick={handleFileUpload} 
                            acceptedExtensions={Object.keys(fileManagerDictInput)}
                        />
                        <ClipboardInput
                            onClick={handleClipboardUpload}
                        />
                    </Box>
                    <Box display='flex'>
                        <FileOutput
                            onClick={handleFileDownload}
                            acceptedExtensions={Object.keys(fileManagerDictOutput)}
                        />
                        <ClipboardOutput 
                            getContent={handleClipboardCopy}
                            acceptedExtensions={Object.keys(fileManagerDictOutput)}
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