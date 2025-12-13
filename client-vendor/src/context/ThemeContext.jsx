import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    // Theme logic: Check cookie -> default 'website'
    const getInitialTheme = () => {
        const match = document.cookie.match(new RegExp('(^| )theme=([^;]+)'));
        if (match) return match[2];
        return 'website';
    };

    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
        // Save to cookie
        document.cookie = `theme=${theme}; path=/; max-age=31536000`; // 1 year
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
