import React, { useState } from 'react';
import { Button, IconButton, Snackbar } from '@mui/material';
import { Check, ContentCopy } from '@mui/icons-material';

interface CopyButtonProps {
    getText: () => string;
    variant?: 'contained' | 'outlined' | 'text';
}

export default function CopyButton({ getText, variant = "outlined" }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);
    const [open, setOpen] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(getText());
            setCopied(true);
            setOpen(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    return (
        <>
            <Button
                onClick={handleCopy}
                variant={variant}
                startIcon={copied ? <Check /> : <ContentCopy />}
            >
                {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Snackbar
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                open={open}
                autoHideDuration={2000}
                onClose={handleClose}
                message="Copied to clipboard"
                action={
                    <IconButton
                        size="small"
                        aria-label="close"
                        color="inherit"
                        onClick={handleClose}
                    >
                        <Check fontSize="small" />
                    </IconButton>
                }
            />
        </>
    );
}