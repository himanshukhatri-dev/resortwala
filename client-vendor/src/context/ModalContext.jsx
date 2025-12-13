import React, { createContext, useContext, useState, useCallback } from 'react';
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
        onConfirm: null,
        onCancel: null
    });

    const showModal = useCallback(({ title, message, type = 'info', confirmText = 'OK', cancelText = 'Cancel' }) => {
        return new Promise((resolve, reject) => {
            setModalState({
                isOpen: true,
                title,
                message,
                type,
                confirmText,
                cancelText,
                onConfirm: () => {
                    setModalState(prev => ({ ...prev, isOpen: false }));
                    resolve(true); // Resolved with true for confirmed
                },
                onCancel: () => {
                    setModalState(prev => ({ ...prev, isOpen: false }));
                    resolve(false); // Resolved with false for cancelled
                }
            });
        });
    }, []);

    const showSuccess = (title, message) => showModal({ title, message, type: 'success' });
    const showError = (title, message) => showModal({ title, message, type: 'error' });
    const showInfo = (title, message) => showModal({ title, message, type: 'info' });
    const showConfirm = (title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'confirm') =>
        showModal({ title, message, type, confirmText, cancelText });

    return (
        <ModalContext.Provider value={{ showSuccess, showError, showInfo, showConfirm }}>
            {children}
            <Modal
                isOpen={modalState.isOpen}
                onClose={modalState.onCancel}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                onConfirm={modalState.onConfirm}
            />
        </ModalContext.Provider>
    );
};
