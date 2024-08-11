import React from 'react';

interface ReportToggleProps {
    onToggle: () => void;
    isVisible: boolean;
}

const ReportToggle = ({ onToggle, isVisible }: ReportToggleProps) => {
    return (
        <button onClick={onToggle}>
            {isVisible ? 'Hide Report' : 'Show Report'}
        </button>
    );
};

export default ReportToggle;