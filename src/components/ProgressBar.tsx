import React from 'react';

interface ProgressBarProps {
    progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
    return (
        <div id="progressBarContainer">
            <div id="progressBar" style={{ width: `${progress}%` }}></div>
            <div id="progressText">{`${Math.round(progress)}%`}</div>
        </div>
    );
};

export default ProgressBar;