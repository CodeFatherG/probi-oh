import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#018F85',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#C00086',
        },
        background: {
            default: '#18191D',
            paper: '#1D1C18',
        },
        text: {
            primary: '#ffffff',
            secondary: '#ffffff',
        },
    },
    components: {
        MuiTypography: {
            styleOverrides: {
                root: {
                    color: '#ffffff',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '4px',
                },
            },
        },
    },
});