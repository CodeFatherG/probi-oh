import React, { useState, useRef, useEffect } from "react";
import { Box, Drawer, IconButton } from "@mui/material";
import { ChevronLeft, Menu } from "@mui/icons-material";

export default function SimulationDrawer() {
    const [open, setOpen] = useState(false);
    const [drawerWidth, setDrawerWidth] = useState(0);
    const drawerRef = useRef(null);

    useEffect(() => {
        if (drawerRef.current) {
            const resizeObserver = new ResizeObserver(entries => {
                for (const entry of entries) {
                    setDrawerWidth(entry.contentRect.width);
                }
            });

            resizeObserver.observe(drawerRef.current);

            return () => {
                resizeObserver.disconnect();
            };
        }
    }, []);

    return (
        <Box sx={{ display: 'flex' }}>
            <IconButton
                color="primary"
                onClick={() => setOpen(!open)}
                sx={{
                    position: 'fixed',
                    left: open ? `${drawerWidth}px` : '10px',
                    top: 10,
                    zIndex: 1201,
                    transition: theme => theme.transitions.create(['left'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                }}
            >
                {open ? <ChevronLeft /> : <Menu />}
            </IconButton>
            <Drawer
                anchor="left"
                open={open}
                variant="persistent"
            >
                <Box ref={drawerRef}>
                    <p>Drawer content</p>
                </Box>
            </Drawer>
        </Box>
    );
}