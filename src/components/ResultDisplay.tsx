import React from 'react';

interface ResultDisplayProps {
    result: string;
}

const ResultDisplay = ({ result }: ResultDisplayProps) => {
    return (
        <div id="result">
            {result}
        </div>
    );
};

export default ResultDisplay;