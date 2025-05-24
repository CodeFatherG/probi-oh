import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Autocomplete,
  Divider,
} from "@mui/material";
import { Dayjs } from "dayjs";
import { DatePicker } from "@mui/x-date-pickers";

interface AnalyticsSidebarProps {
    cardOptions: string[];
    startDate: Dayjs | null;
    endDate: Dayjs | null;
    card: string | null;
    onFilterAnalytics: (filters: {
        startDate: Dayjs | null;
        endDate: Dayjs | null;
        selectedCard?: string;
    }) => void;
}


export default function AnalyticsSidebar({ cardOptions, startDate, endDate, card, onFilterAnalytics }: AnalyticsSidebarProps) {
    const [selectedStart, setSelectedStart] = useState<Dayjs | null>(startDate);
    const [selectedEnd, setSelectedEnd] = useState<Dayjs | null>(endDate);
    const [selectedCard, setSelectedCard] = useState<string | null>(card);
    const [cardInput, setCardInput] = useState<string>(card || '');

    useEffect(() => {
        if (selectedStart && selectedEnd) {
            onFilterAnalytics({
                startDate: selectedStart,
                endDate: selectedEnd,
                selectedCard: selectedCard || undefined,
            });
        }
    }, [selectedStart, selectedEnd, selectedCard]);

    useEffect(() => {
        if (card) {
            setCardInput(card);
        } else {
            setCardInput('');
        }
    }, [card]);

    const handleCardInput = async (event: React.ChangeEvent<object>, value: string, reason: string) => {
        if (reason === 'input') {
            setCardInput(value);
        } else if (reason === 'clear') {
            setCardInput('');
            setSelectedCard('');
        }
    };

  return (
    <Box
        sx={{
            width: "100%",
            maxWidth: 360,
            padding: 2,
            display: "flex",
            flexDirection: "column",
            borderRight: { xs: "none", sm: "1px solid #ccc" },
            boxSizing: "border-box",
        }}
    >
        <Typography variant="h6" gutterBottom>
            Filters
        </Typography>

        <Box sx={{ mb: 2 }}>
            <DatePicker<Dayjs>
                label="Start Date"
                value={selectedStart}
                onChange={setSelectedStart}
                renderInput={(params) => <TextField {...params} fullWidth />}
            />
        </Box>

        <Box sx={{ mb: 2 }}>
            <DatePicker<Dayjs>
                label="End Date"
                value={selectedEnd}
                onChange={setSelectedEnd}
                renderInput={(params) => <TextField {...params} fullWidth />}
            />
        </Box>

        <Autocomplete
            options={cardOptions}
            inputValue={cardInput}
            value={card}
            onInputChange={handleCardInput}
            onChange={(e, newValue) => {
                setSelectedCard(newValue);
                setCardInput(newValue || '');
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && cardOptions.includes(cardInput)) {
                            setSelectedCard(cardInput);
                        }
                    }}
                    placeholder="Card Name"
                />
            )}
            sx={{ mb: 2 }}
        />
    </Box>
  );
}
