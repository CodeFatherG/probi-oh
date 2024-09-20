import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import { theme } from './styles/theme';
import { ThemeProvider } from '@emotion/react';
import { initialiseAnalytics } from './analytics/analytics';

initialiseAnalytics();

console.log('Logging is enabled', process.env.LOG);
if (!process.env.LOG) {
    console.log = () => {};
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <App />
        </ThemeProvider>
    </React.StrictMode>
);
