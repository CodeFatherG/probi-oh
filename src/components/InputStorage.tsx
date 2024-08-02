import { useState, useEffect } from 'react';
import { Card, CreateCard } from '../utils/card';
import { BaseCondition, Condition, AndCondition, OrCondition } from '../utils/condition';
import { parseCondition } from '../utils/parser';

const key = 'simulationInput';

export interface SimulationInput {
    deck: Card[];
    conditions: BaseCondition[];
}

// Function to serialize a Card object
function serializeCard(card: Card): string {
    return JSON.stringify({
        name: card.name,
        details: card.details,
        isFree: card.isFree
    });
}

// Function to deserialize a Card object
function deserializeCard(serializedCard: string): Card {
    const parsedCard = JSON.parse(serializedCard);
    return CreateCard(parsedCard.name, parsedCard.details);
}

// Function to serialize a BaseCondition object
function serializeCondition(condition: BaseCondition): string {
    if (condition instanceof Condition) {
        return JSON.stringify({
            type: 'Condition',
            cardName: condition.cardName,
            quantity: condition.quantity,
            operator: condition.operator,
            location: condition.location
        });
    } else if (condition instanceof AndCondition) {
        return JSON.stringify({
            type: 'AndCondition',
            conditions: condition.conditions.map(serializeCondition)
        });
    } else if (condition instanceof OrCondition) {
        return JSON.stringify({
            type: 'OrCondition',
            conditions: condition.conditions.map(serializeCondition)
        });
    } else {
        throw new Error('Unknown condition type');
    }
}

// Function to deserialize a BaseCondition object
function deserializeCondition(serializedCondition: string): BaseCondition {
    const parsedCondition = JSON.parse(serializedCondition);
    switch (parsedCondition.type) {
        case 'Condition':
            return new Condition(
                parsedCondition.cardName,
                parsedCondition.quantity,
                parsedCondition.operator,
                parsedCondition.location
            );
        case 'AndCondition':
            return new AndCondition(parsedCondition.conditions.map(deserializeCondition));
        case 'OrCondition':
            return new OrCondition(parsedCondition.conditions.map(deserializeCondition));
        default:
            throw new Error('Unknown condition type');
    }
}

// Function to serialize SimulationInput
function serializeSimulationInput(input: SimulationInput): string {
    return JSON.stringify({
        deck: input.deck.map(serializeCard),
        conditions: input.conditions.map(serializeCondition)
    });
}

// Function to deserialize SimulationInput
function deserializeSimulationInput(serializedInput: string): SimulationInput {
    const parsedInput = JSON.parse(serializedInput);
    return {
        deck: parsedInput.deck.map(deserializeCard),
        conditions: parsedInput.conditions.map(deserializeCondition)
    };
}

// Custom hook for SimulationInput localStorage
function useSimulationInputLocalStorage(initialValue: SimulationInput | null): [SimulationInput | null, (value: SimulationInput | null) => void] {
    const [storedValue, setStoredValue] = useState<SimulationInput | null>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            return item ? deserializeSimulationInput(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = (value: SimulationInput | null) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, serializeSimulationInput(valueToStore));
            }
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    };

    useEffect(() => {
        setStoredValue(storedValue);
    }, []);

    return [storedValue, setValue];
}

export { useSimulationInputLocalStorage, serializeSimulationInput, deserializeSimulationInput, parseCondition };