import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#018F85',
        },
        secondary: {
            main: '#C00086',
        },
        background: {
            default: '#18191D',
            paper: '#333436',
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
    },
});