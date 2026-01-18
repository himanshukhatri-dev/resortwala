import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

const CHECK_INTERVAL = 60 * 1000; // Check every 1 minute

export default function VersionChecker() {
    const [lastVersion, setLastVersion] = useState(localStorage.getItem('app_version'));

    useEffect(() => {
        const checkVersion = async () => {
            try {
                // Add timestamp to prevent browser caching of version.json itself
                const res = await fetch(`/version.json?t=${new Date().getTime()}`);
                if (!res.ok) return;

                const data = await res.json();
                const serverVersion = data.version;

                if (lastVersion && serverVersion !== lastVersion) {
                    console.log(`New version detected: ${serverVersion} (Old: ${lastVersion})`);

                    // Update storage
                    localStorage.setItem('app_version', serverVersion);
                    setLastVersion(serverVersion);

                    // Notify and Reload
                    toast.success("New update available! Refreshing...", { duration: 3000 });

                    setTimeout(() => {
                        window.location.reload(true);
                    }, 1000);
                } else if (!lastVersion) {
                    // First load, just save current version
                    localStorage.setItem('app_version', serverVersion);
                    setLastVersion(serverVersion);
                }
            } catch (error) {
                console.error("Failed to check version:", error);
            }
        };

        // Check immediately on mount
        checkVersion();

        // Then interval
        const interval = setInterval(checkVersion, CHECK_INTERVAL);
        return () => clearInterval(interval);
    }, [lastVersion]);

    return null; // Renderless component
}
