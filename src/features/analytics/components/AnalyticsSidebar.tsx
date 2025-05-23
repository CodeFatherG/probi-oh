import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Autocomplete,
  Divider,
} from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker } from "@mui/x-date-pickers";
import { AnalyticsSummary, getAnalyticsSummary } from "@/api/database/analytics/GET-analytics";
import { AnalyticsDateRange } from '../../../api/database/analytics/analytics-daterange';

interface AnalyticsSidebarProps {
    cardOptions: string[];
    onRunAnalysis: (filters: {
        startDate: string;
        endDate: string;
        selectedCard?: string;
    }) => void;
}


export default function AnalyticsSidebar({ cardOptions, onRunAnalysis }: AnalyticsSidebarProps) {
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().subtract(7, "day"));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  

    useEffect(() => {
        if (startDate && endDate) {
            onRunAnalysis({
                startDate: startDate.format("YYYY-MM-DD HH:mm:ss"),
                endDate: endDate.format("YYYY-MM-DD HH:mm:ss"),
                selectedCard: selectedCard || undefined,
            });
        }
    }, [startDate, endDate, selectedCard]);

  return (
    <Box
        sx={{
            width: "100%",
            maxWidth: 360,
            padding: 2,
            display: "flex",
            flexDirection: "column",
            borderRight: { xs: "none", sm: "1px solid #ccc" },
            height: "100vh",
            boxSizing: "border-box",
        }}
    >
        <Typography variant="h6" gutterBottom>
            Filters
        </Typography>

        <Box sx={{ mb: 2 }}>
            <DatePicker<Dayjs>
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                renderInput={(params) => <TextField {...params} fullWidth />}
            />
        </Box>

        <Box sx={{ mb: 2 }}>
            <DatePicker<Dayjs>
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                renderInput={(params) => <TextField {...params} fullWidth />}
            />
        </Box>

        <Autocomplete
            options={cardOptions}
            value={selectedCard}
            onChange={(e, newValue) => setSelectedCard(newValue)}
            renderInput={(params) => <TextField {...params} label="Card Name" />}
            sx={{ mb: 2 }}
        />

        <Divider sx={{ my: 2 }} />
    </Box>
  );
}
