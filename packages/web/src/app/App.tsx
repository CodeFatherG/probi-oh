import React from 'react';
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "@pages/HomePage";
import PrivacyPolicy from '@pages/PrivacyPolicy';
import Analytics from '@pages/Analytics';

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
