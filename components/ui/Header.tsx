
import React from 'react';

interface HeaderProps {
    title: string;
    subtitle?: string;
    icon?: string;
    onBack?: () => void;
    className?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, icon, onBack, className = '' }) => {
    return (
        <header className={`flex items-center bg-white dark:bg-slate-900 p-4 border-b border-primary/10 sticky top-0 z-50 transition-colors ${className}`}>
            {onBack && (
                <button onClick={onBack} className="text-primary flex size-10 items-center justify-center hover:bg-primary/5 rounded-full transition-colors absolute left-2">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
            )}
            <div className="flex-1 text-center flex flex-col items-center justify-center">
                {icon && !onBack && (
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-1">
                        <span className="material-symbols-outlined">{icon}</span>
                    </div>
                )}
                <h1 className="text-[#111318] dark:text-white text-lg font-bold leading-tight tracking-tight uppercase truncate max-w-[200px]">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-primary text-[10px] font-bold uppercase tracking-widest truncate">
                        {subtitle}
                    </p>
                )}
            </div>
            {(onBack || icon) && <div className="size-10 invisible" />}
        </header>
    );
};

export default Header;
