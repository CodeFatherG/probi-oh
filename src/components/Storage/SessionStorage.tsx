import { useState, useEffect } from 'react';

export default function useSessionStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
    const readValue = (): T => {
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            const item = window.sessionStorage.getItem(key);
            if (item) {
                const parsedItem = JSON.parse(item);
                if (Array.isArray(initialValue)) {
                    // If initialValue is an array, ensure parsedItem is also an array
                    return (Array.isArray(parsedItem) ? parsedItem : []) as T;
                } else if (typeof initialValue === 'object' && initialValue !== null) {
                    // If initialValue is an object, merge missing properties
                    return { ...initialValue, ...parsedItem } as T;
                }
                // For primitive types, return the parsed item as is
                return parsedItem as T;
            }
            return initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    };

    const [storedValue, setStoredValue] = useState<T>(readValue);

    const setValue = (value: T) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== 'undefined') {
                window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    };

    useEffect(() => {
        setStoredValue(readValue());
    }, []);

    return [storedValue, setValue];
}
