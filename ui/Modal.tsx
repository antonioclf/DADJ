
import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[2.5rem] sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6 shrink-0">
                    <h2 className="text-xl font-bold dark:text-white uppercase tracking-tight">{title}</h2>
                    <button onClick={onClose} className="text-slate-400 p-2">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
