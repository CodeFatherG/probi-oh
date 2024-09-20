import React, { useState, useEffect, useRef } from "react";
import { Box, Drawer, IconButton, Stack, Typography } from "@mui/material";
import { ChevronLeft, Menu } from "@mui/icons-material";
import SimulationSummary from "./SimulationSummary";
import { simulationRepository } from '../../core/data/simulation-repository';

interface SimulationDrawerProps {
    onApply: (simulationId: string) => void;
}

export default function SimulationDrawer({ onApply }: SimulationDrawerProps): JSX.Element {
    const [open, setOpen] = useState(false);
    const [simulations, setSimulations] = useState(simulationRepository.getAllRecords());
    const [drawerWidth, setDrawerWidth] = useState(0);
    const drawerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updateSimulations = () => {
            try {
                // check if the simulation repository has changed at all
                const newSimulations = simulationRepository.getAllRecords();
                if (newSimulations.length === simulations.length) {
                    for (let i = 0; i < newSimulations.length; i++) {
                        if (newSimulations[i].id !== simulations[i].id) {
                            setSimulations(newSimulations);
                            return;
                        }
                    }
                } else {
                    setSimulations(newSimulations);
                }
            } catch (error) {
                console.error("Error loading simulations:", error);
                setSimulations([]);
            }
        };

        // Update simulations every second
        const intervalId = setInterval(updateSimulations, 1000);
        return () => clearInterval(intervalId);
    }, []);

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
    }, [open, simulations]);
    
    useEffect(() => {
        window.addEventListener('resize', measureDrawerWidth);
        return () => window.removeEventListener('resize', measureDrawerWidth);
    }, []);

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
                    {[...simulations].reverse().map(record => (
                        <SimulationSummary 
                            key={record.id} 
                            record={record} 
                            onApply={() => {
                                onApply(record.id);
                                setOpen(false);
                            }} 
                        />
                    ))}
                </Stack>
            </Drawer>
        </Box>
    );
}