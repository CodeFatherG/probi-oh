import React, { useCallback, useEffect, useState } from 'react';
import '@/styles/HomePage.css';
import SimulationRunner from '@features/simulation/components/SimulationRunner';
import { CardDetails, Condition } from '@probi-oh/types';
import useLocalStorage from '@shared/hooks/useLocalStorage';
import useLocalStorageMap from '@shared/hooks/useLocalStorageMap';
import ErrorBoundary from '@shared/components/ErrorBoundary';
import { Box, IconButton, Stack } from '@mui/material';
import SettingsDialog from '@shared/components/SettingsDialog';
import SettingsIcon from '@mui/icons-material/Settings';
import GitLink from '@shared/components/GitLink';
import ConfigBuilder from '@features/config/components/ConfigView';
import MobileDialog from '@shared/components/MobileDialog';
import SimulationDrawer from '@features/simulation/components/SimulationDrawer';
import { simulationCache } from '@api/database/simulations/simulation-cache';
import { useLocation, useNavigate } from 'react-router-dom';
import { simulationEventManager } from '@api/database/simulations/simulation-event-manager';
import { acceptAllCookies, acceptNecessaryCookies, isConsentGiven } from '@services/analytics/cookieConsent';
import DataConsentDialog from '@services/analytics/CookieConsentDialog';
import logo from '@/assets/dtlogo.png';
import { parseCondition } from 'core/src/parser';

export default function HomePage() {
    const [cardData, setCardData] = useLocalStorageMap<string, CardDetails>("cardDataStore", new Map<string, CardDetails>());
    const [stringConditions, setStringConditions] = useLocalStorage<string[]>("conditionDataStore", []);
    const [conditionData, setConditionData] = useLocalStorage<Condition[]>("conditionDataStoreObj", []);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [cookieConsentOpen, setCookieConsentOpen] = useState(isConsentGiven() === false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (stringConditions.length > 0) {
            const conditions: Condition[] = stringConditions.map((condition) => {
                try {
                    return parseCondition(condition);
                } catch (e) {
                    console.error('Error parsing condition:', condition, e);
                    return null;
                }
            }).filter((condition) => condition !== null);

            setConditionData(conditions);
            setStringConditions([]);
        }
    }, []);

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

    const handleConditionsUpdate = useCallback((conditions: Condition[]): void => {
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