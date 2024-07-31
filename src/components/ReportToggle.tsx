import React from 'react';

interface ReportToggleProps {
    onToggle: () => void;
    isVisible: boolean;
}

const ReportToggle: React.FC<ReportToggleProps> = ({ onToggle, isVisible }) => {
    return (
        <button onClick={onToggle}>
            {isVisible ? 'Hide Report' : 'Show Report'}
        </button>
    );
};

export default ReportToggle;