import React, { useCallback, useEffect, useState } from 'react';
import '@/styles/HomePage.css';
import SimulationRunner from '@components/SimulationView/SimulationRunner';
import { CardDetails } from '@probi-oh/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import useLocalStorageMap from '@/hooks/useLocalStorageMap';
import ErrorBoundary from '@components/ErrorBoundary';
import { Box, IconButton, Stack } from '@mui/material';
import SettingsDialog from '@components/Settings/SettingsDialog';
import SettingsIcon from '@mui/icons-material/Settings';
import GitLink from '@components/GitLink';
import ConfigBuilder from '@components/ConfigurationView/ConfigView';
import MobileDialog from '@components/MobileDialog';
import SimulationDrawer from '@components/SimulationDrawer/SimulationDrawer';
import { simulationCache } from '@/db/simulations/simulation-cache';
import { useLocation, useNavigate } from 'react-router-dom';
import { simulationEventManager } from '@/db/simulations/simulation-event-manager';
import { acceptAllCookies, acceptNecessaryCookies, isConsentGiven } from '@/analytics/cookieConsent';
import DataConsentDialog from '@/analytics/CookieConsentDialog';
import logo from '@/assets/dtlogo.png';

export default function HomePage() {
    const [cardData, setCardData] = useLocalStorageMap<string, CardDetails>("cardDataStore", new Map<string, CardDetails>());
    const [conditionData, setConditionData] = useLocalStorage<string[]>("conditionDataStore", []);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [cookieConsentOpen, setCookieConsentOpen] = useState(isConsentGiven() === false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const id = params.get('id');
        if (id) {
            handleApplySimulation(id);
        }
    }, []);

    useEffect(() => {
        simulationEventManager.registerCallback((id: string) => {
            if (!isConsentGiven()) {
                navigate(`?id=${id}`, { replace: true });
            }
        })
    }, []);

    useEffect(() => {
        console.log('Starting App...');
    }, []);

    const handleCardsUpdate = useCallback((cards: Map<string, CardDetails>): void => {
        setCardData(cards);
        navigate('', { replace: true });
    }, [setCardData]);

    const handleConditionsUpdate = useCallback((conditions: string[]): void => {
        setConditionData(conditions);
        navigate('', { replace: true });
    }, [setConditionData]);

    const handleApplySimulation = async (simulationId: string) => {
        console.log('Applying simulation:', simulationId);
        const input = await simulationCache.getSimulationInputById(simulationId);
        if (input) {
            navigate(`?id=${simulationId}`, { replace: true });
            setCardData(input.deck);
            setConditionData(input.conditions);
        } else {
            throw new Error(`Simulation not found ${simulationId}`);
        }
    };

    return (
        <ErrorBoundary>
            <Box className="app">
                <Box
                    component="img"
                    src={logo}
                    alt="Logo"
                    sx={{
                        width: {
                            xs: 100,
                            sm: 150,
                            md: 280,
                        },
                        height: 'auto',
                        display: 'block',
                        margin: 'auto',
                    }}
                />
                <Stack spacing={2}>
                    <ConfigBuilder 
                        cardData={cardData}
                        conditionData={conditionData}
                        onCardsUpdate={handleCardsUpdate}
                        onConditionsUpdate={handleConditionsUpdate}
                    />
                    <SimulationRunner
                        disabled={(cardData.size ?? 0) === 0 || conditionData.length === 0}
                        cards={cardData}
                        conditions={conditionData}
                    />
                </Stack>
                <IconButton
                    onClick={() => setSettingsOpen(true)}
                    sx={{
                        position: 'fixed',
                        top: 16,
                        right: 16,
                        bgcolor: 'background.paper',
                        '&:hover': {
                            bgcolor: 'action.hover',
                        },
                    }}
                    aria-label="settings"
                >
                    <SettingsIcon />
                </IconButton>
                <SettingsDialog
                    open={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                />
            </Box>
            <GitLink link="https://github.com/CodeFatherG/probi-oh" text="Visit us on Github!" />
            <MobileDialog />
            <SimulationDrawer enabled={isConsentGiven()} onApply={handleApplySimulation}/>
            <DataConsentDialog
                open={cookieConsentOpen}
                onConsent={(type) => {
                    if (type) {
                        acceptAllCookies();
                    } else {
                        localStorage.clear();
                        
                        acceptNecessaryCookies();
                    }
                    
                    setCookieConsentOpen(false);
                }}
            />
        </ErrorBoundary>
    );
}