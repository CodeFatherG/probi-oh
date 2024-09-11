import React, { useState, useEffect, ReactNode } from 'react';
import ReactGA from 'react-ga4';
import { Snackbar, Alert, Link } from '@mui/material';

interface ErrorBoundaryProps {
  children: ReactNode;
  timeout?: number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children, timeout = 5000 }) => {
    const [state, setState] = useState<ErrorBoundaryState>({
        hasError: false,
        error: null,
    });

    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (state.hasError) {
            setOpen(true);
        }
    }, [state.hasError]);

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    const handleError = (error: Error) => {
        setState({ hasError: true, error });
        trackError(error.name, error.message);
    };

    useEffect(() => {
        window.addEventListener('error', (event) => handleError(event.error));
        return () => {
            window.removeEventListener('error', (event) => handleError(event.error));
        };
    }, []);

    const trackError = (errorName: string, errorMessage: string)  =>{
        ReactGA.event({
            category: "Error",
            action: errorName,
            label: errorMessage
        });
    }

    if (state.hasError) {
        return (
            <>
                {children}
                <Snackbar
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    open={open}
                    onClose={handleClose}
                    autoHideDuration={timeout}
                >
                    <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
                        {state.error?.message || 'An error occurred'}
                        <br />
                        <Link
                            href="https://github.com/CodeFatherG/probi-oh/issues/new/choose"
                            className="text-blue-500 hover:text-blue-700"
                            variant="caption"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Experienced an issue? Let us know!
                        </Link>
                    </Alert>
                </Snackbar>
            </>
        );
    }

    return <>{children}</>;
};

export default ErrorBoundary;