import { createContext, useContext, useState, useCallback } from 'react';
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

    const [resolvePromise, setResolvePromise] = useState(null);

    const closeModal = useCallback(() => {
        setModalState(prev => ({ ...prev, isOpen: false }));
        if (resolvePromise) {
            resolvePromise(false); // Resolve false if closed/cancelled without confirm
            setResolvePromise(null);
        }
    }, [resolvePromise]);

    const confirmModal = useCallback(() => {
        setModalState(prev => ({ ...prev, isOpen: false }));
        if (resolvePromise) {
            resolvePromise(true);
            setResolvePromise(null);
        }
    }, [resolvePromise]);

    const showModal = useCallback((title, message, type = 'info', confirmText = 'OK', cancelText = 'Cancel', showCancel = false) => {
        return new Promise((resolve) => {
            setResolvePromise(() => resolve);
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
