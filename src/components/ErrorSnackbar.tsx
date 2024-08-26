import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, Link } from '@mui/material';

interface ErrorSnackbar {
    message: string;
    timeout?: number;
}

export default function ErrorSnackbar ({ message, timeout = 5000}: ErrorSnackbar) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (message) {
            setOpen(true);
        }
    }, [message]);

    return (
        <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            open={open}
            autoHideDuration={timeout}
        >
            <Alert severity='error' sx={{ width: '100%' }}>
                {message}
                <br />
                <Link 
                    href="https://github.com/CodeFatherG/probi-oh/issues/new/choose" 
                    className="text-blue-500 hover:text-blue-700" 
                    variant='caption'
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Experienced an issue? Let us know!
                </Link>
            </Alert>
        </Snackbar>
    );
}
