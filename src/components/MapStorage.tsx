import { useState, useEffect } from 'react';

export default function useLocalStorageMap<K, V>(key: string, initialValue: Map<K, V> = new Map()): [Map<K, V>, (value: Map<K, V>) => void] {
    const readValue = (): Map<K, V> => {
        if (typeof window === 'undefined') {
        return initialValue;
        }
        try {
        const item = window.localStorage.getItem(key);
        return item ? new Map(JSON.parse(item)) : initialValue;
        } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error);
        return initialValue;
        }
    };

    const [storedValue, setStoredValue] = useState<Map<K, V>>(readValue);

    const setValue = (value: Map<K, V>) => {
        try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(Array.from(valueToStore.entries())));
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