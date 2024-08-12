import React, { useState, useEffect } from 'react';
import { CircularProgress, Box } from '@mui/material';

interface LoadingOverlayProps {
    isLoading: boolean;
    minDisplayTime?: number;
}

export default function LoadingOverlay({ isLoading, minDisplayTime = 1400 }: LoadingOverlayProps) {
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isLoading) {
            setShouldRender(true);
        } else if (shouldRender) {
            timer = setTimeout(() => {
                setShouldRender(false);
            }, minDisplayTime);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [isLoading, minDisplayTime, shouldRender]);

    if (!shouldRender) return null;

    return (
        <Box
        sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
        }}
        >
            <CircularProgress />
        </Box>
    );
}
