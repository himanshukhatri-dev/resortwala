import React, { createContext, useContext, useState } from 'react';

const SearchContext = createContext();

export function SearchProvider({ children }) {
    const [location, setLocation] = useState("");
    const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
    const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0, pets: 0, rooms: 1 });
    const [activeCategory, setActiveCategory] = useState('all');

    const resetSearch = () => {
        setLocation("");
        setDateRange({ from: undefined, to: undefined });
        setGuests({ adults: 1, children: 0, infants: 0, pets: 0, rooms: 1 });
        setActiveCategory('all');
    };

    const value = React.useMemo(() => ({
        location, setLocation,
        dateRange, setDateRange,
        guests, setGuests,
        activeCategory, setActiveCategory,
        resetSearch
    }), [location, dateRange, guests, activeCategory]);

    return (
        <SearchContext.Provider value={value}>
            {children}
        </SearchContext.Provider>
    );
}

export function useSearch() {
    return useContext(SearchContext);
}
