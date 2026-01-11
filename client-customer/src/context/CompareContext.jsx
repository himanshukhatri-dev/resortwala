import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const CompareContext = createContext();

export const useCompare = () => useContext(CompareContext);

export const CompareProvider = ({ children }) => {
    const [compareList, setCompareList] = useState([]);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

    // Persist to local storage if desired, but for now session is fine.
    // Actually, persistence is nice.
    useEffect(() => {
        const saved = localStorage.getItem('resortwala_compare');
        if (saved) {
            try { setCompareList(JSON.parse(saved)); } catch (e) { }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('resortwala_compare', JSON.stringify(compareList));
    }, [compareList]);

    const addToCompare = (property) => {
        if (compareList.find(p => p.id === property.id || p.PropertyId === property.PropertyId)) {
            toast.error("Already in comparison list");
            return;
        }
        const limit = window.innerWidth < 768 ? 2 : 3;
        if (compareList.length >= limit) {
            toast.error(`You can compare up to ${limit} properties`);
            return;
        }

        // Store full property object to ensure all DB data is available for systematic comparison
        const normalized = {
            ...property,
            id: property.id || property.PropertyId,
            // Keep specific fields for quick access if needed, though ...property covers it
            Name: property.Name || property.name,
            PropertyType: property.PropertyType,
            Location: property.Location || property.CityName
        };

        setCompareList([...compareList, normalized]);
        toast.success("Added to comparison");
    };

    const removeFromCompare = (id) => {
        setCompareList(compareList.filter(p => p.id !== id));
    };

    const clearCompare = () => {
        setCompareList([]);
        setIsCompareModalOpen(false);
    };

    const toggleCompare = (property) => {
        const id = property.id || property.PropertyId;
        const exists = compareList.find(p => p.id === id);
        if (exists) removeFromCompare(id);
        else addToCompare(property);
    };

    const openCompareModal = () => setIsCompareModalOpen(true);
    const closeCompareModal = () => setIsCompareModalOpen(false);

    return (
        <CompareContext.Provider value={{
            compareList,
            addToCompare,
            removeFromCompare,
            clearCompare,
            toggleCompare,
            isCompareModalOpen,
            openCompareModal,
            closeCompareModal
        }}>
            {children}
        </CompareContext.Provider>
    );
};
