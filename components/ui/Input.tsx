
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement> {
    label?: string;
    icon?: string;
    className?: string;
    as?: 'input' | 'select';
}

const Input: React.FC<InputProps> = ({
    label,
    icon,
    className = '',
    as = 'input',
    children,
    ...props
}) => {
    const Component = as;

    return (
        <label className={`flex flex-col w-full ${className}`}>
            {label && <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider pb-1 ml-1">{label}</p>}
            <div className="relative">
                {icon && (
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                        {icon}
                    </span>
                )}
                <Component
                    className={`w-full h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none px-4 text-sm dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all ${icon ? 'pl-10' : ''}`}
                    {...props as any}
                >
                    {children}
                </Component>
            </div>
        </label>
    );
};

export default Input;
