import React, { useState, useEffect, useRef } from "react";
import { Box, Drawer, IconButton, Stack, Typography } from "@mui/material";
import { ChevronLeft, Menu } from "@mui/icons-material";
import SimulationSummary from "./SimulationSummary";
import { simulationEventManager } from "../../db/simulations/simulation-event-manager";
import useLocalStorage from "../../hooks/useLocalStorage";
import { isConsentGiven } from "@/analytics/cookieConsent";

interface SimulationDrawerProps {
    onApply: (simulationId: string) => void;
}

export default function SimulationDrawer({ onApply }: SimulationDrawerProps): JSX.Element {
    const [open, setOpen] = useState(false);
    const [drawerWidth, setDrawerWidth] = useState(0);
    const drawerRef = useRef<HTMLDivElement>(null);
    const [simulations, setSimulations] = useLocalStorage<string[]>('simulationDrawerArray', []);

    useEffect(() => {
        const callback = (simulationId: string) => {
            if (isConsentGiven()) {
                console.log('New simulation added:', simulationId);
                console.log('Current simulations:', simulations);
                const updatedSimulations = [simulationId, ...simulations.slice(0, 9)];
                setSimulations(updatedSimulations);
            }
        };
    
        simulationEventManager.registerCallback(callback);
    
        return () => {
            simulationEventManager.unregisterCallback(callback);
        };
    }, [simulations]);

    const measureDrawerWidth = () => {
        if (drawerRef.current && open) {
            setDrawerWidth(drawerRef.current.offsetWidth);
        }
    };

    useEffect(() => {
        if (open) {
            // Delay measurement to ensure drawer is rendered
            setTimeout(measureDrawerWidth, 0);
        }
    }, [open]);
    
    useEffect(() => {
        window.addEventListener('resize', measureDrawerWidth);
        return () => window.removeEventListener('resize', measureDrawerWidth);
    }, []);


    console.log('SimulationDrawer render', simulations);

    return (
        <Box sx={{ display: 'flex' }}>
            <IconButton
                color="primary"
                onClick={() => setOpen(!open)}
                disabled={simulations.length === 0}
                sx={{
                    position: 'fixed',
                    left: open ? `${drawerWidth + 20}px` : '10px',
                    top: 10,
                    zIndex: 1201,
                    transition: theme => theme.transitions.create(['left'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.shortest,
                    }),
                }}
            >
                {open ? <ChevronLeft /> : <Menu />}
            </IconButton>
            <Drawer
                anchor="left"
                open={open}
                variant="temporary"
                onClose={() => setOpen(false)}
            >
                <Stack
                    p='10px'
                    m='10px'
                    ref = {drawerRef}
                >
                    <Typography variant='h4' align="center" mb='2'>History</Typography>
                    {[...simulations].reverse().map(id => (
                        <SimulationSummary 
                            key={id} 
                            simulationId={id} 
                            onApply={(simulationId: string) => {
                                onApply(simulationId);
                                setOpen(false);
                            }} 
                        />
                    ))}
                </Stack>
            </Drawer>
        </Box>
    );
}