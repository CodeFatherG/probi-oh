import React, { useState } from "react";
import { getCurrencySymbol } from "@api/currency/currency";
import { Box, Dialog, DialogContent, DialogTitle, Grid, IconButton, Link, Stack, Typography } from "@mui/material";
import { getSettings } from "@services/settings";
import { Close, Help } from "@mui/icons-material";

function SummaryDialog({open, onClose}: {open: boolean, onClose: () => void}) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 2 }}>
                <DialogTitle sx={{padding: 0}}>Price Summary</DialogTitle>
                <IconButton 
                    onClick={onClose}
                    sx={{padding: 0}}
                >
                    <Close />
                </IconButton>
            </Box>
            <DialogContent sx={{pt: 0}}>
                <Box>
                    <Typography variant='body1'>
                        These prices are sourced by <Link href="https://ygoprodeck.com/" target="_blank" rel="noopener">https://ygoprodeck.com/</Link>. 
                        These prices are the lowest price from each source where rarity is not considered. The summary should be used as a guide only.
                        Summaries are based on the lowest of these sources, average of all lowest prices from sources, and the highest of these sources.
                        Outliers are removed to avoid one seller skewing results. The currency shown can be changed in settings (default USD).
                    </Typography>
                </Box>
            </DialogContent>
        </Dialog>
    );
}

function PriceSummary({ prices }: { prices: Record<string, number> }) {
    const [open, setOpen] = useState(false);
    
    return (
        <Grid container>
            <Grid item>
                <Stack>
                    {Object.entries(prices).map(([source, price]) => (
                        <Typography key={source} variant='caption'>{`${source}: ${getCurrencySymbol(getSettings().selectedCurrency)}${price.toFixed(2)}`}</Typography>
                    ))}
                </Stack>
            </Grid>
            <Grid item pl='10px'>
                <IconButton
                    onClick={() => setOpen(true)}
                    sx={{ padding: 0 }}
                >
                    <Help />
                </IconButton>
            </Grid>
            <SummaryDialog open={open} onClose={() => setOpen(false)} />
        </Grid>
    );
}

export default PriceSummary;