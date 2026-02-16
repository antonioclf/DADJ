
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "font-bold py-4 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90",
    secondary: "bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800",
    ghost: "bg-primary/10 text-primary hover:bg-primary/20",
    danger: "bg-rose-500 text-white shadow-lg shadow-rose-500/30 hover:bg-rose-600"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
