import { createContext, useContext, useState, useCallback, useRef } from 'react';
import Modal from '../components/Modal';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
    const [modalState, setModalState] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        confirmText: 'OK',
        cancelText: 'Cancel',
        showCancel: false,
        onConfirm: () => { }
    });

    const resolverRef = useRef(null);

    const closeModal = useCallback(() => {
        setModalState(prev => ({ ...prev, isOpen: false }));
        if (resolverRef.current) {
            resolverRef.current(false);
            resolverRef.current = null;
        }
    }, []);

    const confirmModal = useCallback(() => {
        setModalState(prev => ({ ...prev, isOpen: false }));
        if (resolverRef.current) {
            resolverRef.current(true);
            resolverRef.current = null;
        }
    }, []);

    const showModal = useCallback((title, message, type = 'info', confirmText = 'OK', cancelText = 'Cancel', showCancel = false) => {
        return new Promise((resolve) => {
            // If a modal is already open/pending, resolve it as false (cancelled) before opening new one
            if (resolverRef.current) {
                resolverRef.current(false);
            }

            resolverRef.current = resolve;

            setModalState({
                isOpen: true,
                title,
                message,
                type,
                confirmText,
                cancelText,
                showCancel,
                onConfirm: confirmModal
            });
        });
    }, [confirmModal]);

    const showSuccess = (title, message) => showModal(title, message, 'success');
    const showError = (title, message) => showModal(title, message, 'error');
    const showInfo = (title, message) => showModal(title, message, 'info');
    const showConfirm = (title, message, confirmText = 'Yes', cancelText = 'No', type = 'confirm') => {
        return showModal(title, message, type, confirmText, cancelText, true);
    };

    return (
        <ModalContext.Provider value={{ showModal, showSuccess, showError, showInfo, showConfirm }}>
            {children}
            <Modal
                isOpen={modalState.isOpen}
                onClose={closeModal}
                onConfirm={modalState.onConfirm}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                showCancel={modalState.showCancel}
            />
        </ModalContext.Provider>
    );
};
