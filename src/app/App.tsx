import React from 'react';
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "@routes/HomePage";
import PrivacyPolicy from '@routes/PrivacyPolicy';

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
