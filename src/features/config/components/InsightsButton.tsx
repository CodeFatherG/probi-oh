import React from 'react';
import { BarChart, Insights } from '@mui/icons-material';
import { Chip, ChipProps } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface InsightsButtonProps extends ChipProps {
    cardName: string;
}

export default function InsightsButton({ cardName, ...props }: InsightsButtonProps) {
    const navigate = useNavigate();

    return (
        <Chip
            onClick={() => {
                const params = new URLSearchParams({ card: cardName });
                navigate(`/analytics?${params.toString()}`, { replace: true });
            }}
            icon={<BarChart />}
            sx={{ '& .MuiChip-label:empty': { paddingLeft: 0 } }}
            {...props}
        />
    );
}
