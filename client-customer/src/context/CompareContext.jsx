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
        if (compareList.length >= 3) {
            toast.error("You can compare up to 3 properties");
            return;
        }

        // Normalize property object for consistent storage
        const normalized = {
            id: property.id || property.PropertyId,
            name: property.Name || property.name,
            image: property.ImageUrl || property.image_url || property.primary_image?.image_url || (property.images?.[0]?.image_url),
            price: property.Price || property.PricePerNight || property.ResortWalaRate,
            rating: property.Rating,
            location: property.Location || property.CityName,
            type: property.PropertyType,
            amenities: property.onboarding_data?.amenities || {},
            bedrooms: property.NoofRooms || property.Bedrooms,
            capacity: property.MaxCapacity || property.MaxGuests,
            bathrooms: property.Bathrooms,
            originalData: property // Keep full data just in case
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
