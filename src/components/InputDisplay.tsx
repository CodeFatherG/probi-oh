import React, { Component, ErrorInfo, ReactNode } from 'react';
import { SimulationInput } from '../utils/yaml-manager';
import { Card } from '../utils/card';
import { BaseCondition } from '../utils/condition';

interface InputDisplayProps {
    input: SimulationInput | null;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <h1>Something went wrong: {this.state.error?.message}</h1>;
        }

        return this.props.children;
    }
}

const InputDisplay = ({ input }: InputDisplayProps) => {
    if (!input) {
        return <div>No input loaded</div>;
    }

    console.log('Input received:', input);

    if (!Array.isArray(input.deck)) {
        return <div>Error: Deck is not an array</div>;
    }

    const cardCounts: { [key: string]: number } = {};
    input.deck.forEach((card: Card, index: number) => {
        console.log(`Card ${index}:`, card);
        const cardName = card.name || `Unknown Card ${index}`;
        cardCounts[cardName] = (cardCounts[cardName] || 0) + 1;
    });

    return (
        <ErrorBoundary>
            <div className="input-display">
                <h2>Loaded Input</h2>
                <div className="deck-display">
                    <h3>Deck ({input.deck.length} cards):</h3>
                    <ul>
                        {Object.entries(cardCounts).map(([cardName, count]) => (
                            <li key={cardName}>
                                {cardName}: {count}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="conditions-display">
                    <h3>Conditions:</h3>
                    <ul>
                        {input.conditions.map((condition: string, index: number) => (
                            <li key={index}>{condition}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default InputDisplay;