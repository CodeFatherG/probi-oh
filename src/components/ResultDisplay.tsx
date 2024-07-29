import React from 'react';

interface ResultDisplayProps {
    result: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
    return (
        <div id="result">
            {result}
        </div>
    );
};

export default ResultDisplay;