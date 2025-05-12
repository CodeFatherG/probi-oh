import React from 'react';
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import PrivacyPolicy from './pages/PrivacyPolicy';

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>
    );
}
