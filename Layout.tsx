
import React from 'react';
import { View } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  navigate: (view: View) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, navigate, onLogout }) => {
  return (
    <div className="relative flex flex-col min-h-screen max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl transition-colors duration-300">
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 px-4 pb-6 pt-2 z-50">
        <div className="flex justify-around items-center">
          <NavItem
            view={View.HOME}
            active={currentView === View.HOME}
            icon="home"
            label="Início"
            onClick={navigate}
          />
          <NavItem
            view={View.SALES}
            active={currentView === View.SALES}
            icon="receipt_long"
            label="Vendas"
            onClick={navigate}
          />
          <NavItem
            view={View.INVENTORY}
            active={currentView === View.INVENTORY}
            icon="inventory_2"
            label="Estoque"
            onClick={navigate}
          />
          <NavItem
            view={View.REPORTS}
            active={currentView === View.REPORTS}
            icon="analytics"
            label="Relatórios"
            onClick={navigate}
          />
          <button
            onClick={onLogout}
            className="flex flex-col items-center gap-1 text-rose-500 hover:text-rose-600 transition-all duration-200"
          >
            <span className="material-symbols-outlined">logout</span>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sair</p>
          </button>
        </div>
      </nav>
    </div>
  );
};

interface NavItemProps {
  view: View;
  active: boolean;
  icon: string;
  label: string;
  onClick: (view: View) => void;
}

const NavItem: React.FC<NavItemProps> = ({ view, active, icon, label, onClick }) => {
  return (
    <button
      onClick={() => onClick(view)}
      className={`flex flex-col items-center gap-1 transition-all duration-200 ${active ? 'text-primary' : 'text-slate-400 hover:text-primary/70'
        }`}
    >
      <span className={`material-symbols-outlined ${active ? 'font-fill' : ''}`}>
        {icon}
      </span>
      <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
    </button>
  );
};

export default Layout;
