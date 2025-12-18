import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
    const { user } = useAuth();
    const [wishlist, setWishlist] = useState([]); // Array of property IDs
    const [loading, setLoading] = useState(false);

    // Fetch wishlist on load
    useEffect(() => {
        if (user) {
            fetchWishlist();
        } else {
            setWishlist([]);
        }
    }, [user]);

    const fetchWishlist = async () => {
        try {
            const token = localStorage.getItem('token');
            // We fetch the full list of wishlisted properties to get IDs
            // Optimally, backend could just return IDs if we only need to check status
            // But if we want to show a "Wishlist Page", we need details. 
            // Let's assume endpoint returns array of objects with PropertyId
            const res = await fetch('/api/customer/wishlist', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            if (res.ok) {
                const data = await res.json();
                // Store IDs for easy lookup
                const ids = data.map(p => p.PropertyId || p.id);
                setWishlist(ids);
            }
        } catch (err) {
            console.error("Failed to fetch wishlist", err);
        }
    };

    const toggleWishlist = async (propertyId) => {
        if (!user) {
            // alert("Please login to save properties!");
            // return false; 
            // Return false to indicate failure/action needed
            return { success: false, message: "Please login to save properties" };
        }

        // Optimistic UI update
        const isCurrentlyWishlisted = wishlist.includes(propertyId);
        setWishlist(prev =>
            isCurrentlyWishlisted
                ? prev.filter(id => id !== propertyId)
                : [...prev, propertyId]
        );

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/customer/wishlist/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ property_id: propertyId })
            });

            if (!res.ok) {
                // Revert if failed
                setWishlist(prev =>
                    isCurrentlyWishlisted
                        ? [...prev, propertyId]
                        : prev.filter(id => id !== propertyId)
                );
                return { success: false, message: "Failed to update wishlist" };
            }

            return { success: true, message: isCurrentlyWishlisted ? "Removed from Wishlist" : "Added to Wishlist" };

        } catch (err) {
            console.error("Wishlist toggle error", err);
            // Revert if failed
            setWishlist(prev =>
                isCurrentlyWishlisted
                    ? [...prev, propertyId]
                    : prev.filter(id => id !== propertyId)
            );
            return { success: false, message: "Network error" };
        }
    };

    const isWishlisted = (propertyId) => {
        return wishlist.includes(propertyId);
    };

    return (
        <WishlistContext.Provider value={{ wishlist, toggleWishlist, isWishlisted, fetchWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    return useContext(WishlistContext);
}
