import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useWalkthrough } from '../context/WalkthroughContext';
import { learningService } from '../services/learningService';
import { toast } from 'react-hot-toast'; // Assuming toast exists or we'll use a simple alert/custom component

const SmartTriggerManager = () => {
    const location = useLocation();
    const { startWalkthrough, completedWalkthroughs } = useWalkthrough();

    useEffect(() => {
        const checkPageTriggers = async () => {
            try {
                // We pass current route and context (e.g. completed IDs)
                const context = {
                    completed_walkthroughs: completedWalkthroughs,
                    // valid_until: ... other context?
                };

                const triggerResult = await learningService.checkTriggers(location.pathname, context);

                if (triggerResult) {
                    handleTriggerAction(triggerResult);
                }
            } catch (error) {
                console.error('Trigger check failed:', error);
            }
        };

        // Debounce or verify if we should check immediately
        const timer = setTimeout(() => {
            checkPageTriggers();
        }, 1000); // Check 1 second after navigation to let page load

        return () => clearTimeout(timer);
    }, [location.pathname, completedWalkthroughs]);

    const handleTriggerAction = (action) => {
        // action structure: { type: 'walkthrough'|'notification'|'tooltip', payload: { id: ..., message: ... } }

        switch (action.type) {
            case 'start_walkthrough':
                if (action.payload?.id) {
                    startWalkthrough(action.payload.id);
                }
                break;

            case 'notification':
                if (action.payload?.message) {
                    // Using standard alert or toast
                    // toast(action.payload.message); 
                    // For now, console log or alert
                    console.log('Trigger Notification:', action.payload.message);
                }
                break;

            case 'tooltip':
                // Tooltips usually attach to DOM elements. 
                // Maybe dispatch a custom event that HelpTooltip listens to?
                // window.dispatchEvent(new CustomEvent('show-help-tooltip', { detail: action.payload.target_id }));
                break;

            default:
                break;
        }
    };

    return null; // Renderless component
};

export default SmartTriggerManager;
