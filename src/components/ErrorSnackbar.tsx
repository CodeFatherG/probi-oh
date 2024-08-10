import React, { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';

export default function ErrorSnackbar ({ message, timeout = 5000, onClose }) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (message) {
        setOpen(true);
        }
    }, [message]);

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
        if (onClose) {
        onClose();
        }
    };

    return (
        <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            open={open}
            autoHideDuration={timeout}
            onClose={handleClose}
        >
        <Alert onClose={handleClose} severity="info" sx={{ width: '100%' }}>
            {message}
        </Alert>
        </Snackbar>
    );
}