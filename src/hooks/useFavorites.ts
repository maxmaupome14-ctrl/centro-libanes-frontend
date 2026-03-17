import { useState, useCallback } from 'react';

const STORAGE_KEY = 'cl-favorites';

function loadFavorites(): Set<string> {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
        return new Set();
    }
}

function saveFavorites(favs: Set<string>) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...favs]));
    } catch { /* empty */ }
}

export function useFavorites() {
    const [favorites, setFavorites] = useState<Set<string>>(loadFavorites);

    const toggleFavorite = useCallback((id: string) => {
        setFavorites(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            saveFavorites(next);
            return next;
        });
    }, []);

    const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

    return { favorites, toggleFavorite, isFavorite };
}
