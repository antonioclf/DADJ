
import React from 'react';
import { View, InventoryItem, SaleRecord } from '../types';

interface HomeProps {
  navigate: (view: View) => void;
  inventory: InventoryItem[];
  sales: SaleRecord[];
}

const Home: React.FC<HomeProps> = ({ navigate, inventory, sales }) => {
  const totalItems = inventory.reduce((acc, curr) => acc + curr.quantity, 0);
  const lowStock = inventory.filter(i => i.quantity < 5).length;
  const monthSales = sales.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="p-4 space-y-6">
      {/* Header Branding */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-slate-900 p-1 rounded-xl shadow-lg shadow-primary/20 size-10 overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-primary dark:text-white uppercase leading-none">DIRETÓRIO ACADÊMICO DOIS DE JULHO</h1>
            <p className="text-[9px] font-bold text-slate-400 tracking-[0.3em] uppercase mt-1">Sistema de Gestão - CBMMG/ABM</p>
          </div>
        </div>
        <button className="size-10 flex items-center justify-center bg-white dark:bg-slate-800 text-gray-500 rounded-full shadow-sm">
          <span className="material-symbols-outlined text-xl">notifications</span>
        </button>
      </div>

      {/* Quick Stats Banner */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-800">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stock Total</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black dark:text-white">{totalItems}</span>
            <span className="text-[10px] text-slate-400 font-bold">Unidades</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-800">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vendas (Total)</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-primary">R$ {monthSales.toFixed(0)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-black tracking-tight dark:text-white">Seja bem-vindo.</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">O que deseja gerenciar agora?</p>
      </div>

      {/* Main Modules */}
      <div className="grid grid-cols-1 gap-4">
        <ModuleCard
          title="Vendas de Fardamento"
          description="Registre pedidos e receba pagamentos."
          image="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800"
          icon="shopping_cart"
          buttonLabel="Iniciar Venda"
          onClick={() => navigate(View.SALES)}
        />

        <ModuleCard
          title="Controle de Estoque"
          description={`${lowStock} itens precisam de reposição.`}
          image="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800"
          icon="inventory_2"
          buttonLabel="Abrir Estoque"
          onClick={() => navigate(View.INVENTORY)}
          alert={lowStock > 0}
        />
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-4 gap-3">
        <QuickAction icon="bar_chart" label="Stats" onClick={() => navigate(View.REPORTS)} />
        <QuickAction icon="groups" label="Equipe" onClick={() => navigate(View.TEAM)} />
        <QuickAction icon="receipt" label="Recibos" onClick={() => { }} />
        <QuickAction icon="settings" label="Ajustes" onClick={() => { }} />
      </div>

      <footer className="pt-6 text-center">
        <p className="text-[9px] text-gray-400 dark:text-gray-600 uppercase tracking-[0.4em] font-bold">
          DIRETÓRIO ACADÊMICO DOIS DE JULHO • Sistema de Gestão
        </p>
      </footer>
    </div>
  );
};

const ModuleCard: React.FC<{
  title: string;
  description: string;
  image: string;
  icon: string;
  buttonLabel: string;
  onClick: () => void;
  alert?: boolean;
}> = ({ title, description, image, icon, buttonLabel, onClick, alert }) => (
  <div className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-all hover:shadow-xl hover:shadow-primary/5 active:scale-[0.98]">
    <div
      className="h-32 w-full bg-cover bg-center grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500"
      style={{ backgroundImage: `url('${image}')` }}
    />
    <div className="p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">{icon}</span>
          </div>
          <h3 className="text-md font-black dark:text-white uppercase tracking-tight">{title}</h3>
        </div>
        {alert && <div className="size-3 rounded-full bg-rose-500 animate-pulse" />}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 font-medium leading-relaxed">{description}</p>
      <button
        onClick={onClick}
        className="w-full bg-slate-900 dark:bg-primary text-white font-bold py-4 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all hover:gap-4"
      >
        <span className="text-xs uppercase tracking-[0.2em]">{buttonLabel}</span>
        <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </button>
    </div>
  </div>
);

const QuickAction: React.FC<{ icon: string; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center aspect-square bg-white dark:bg-slate-900 rounded-3xl border border-slate-50 dark:border-slate-800 hover:border-primary/30 transition-all active:scale-90"
  >
    <span className="material-symbols-outlined text-slate-400 mb-1 text-xl">{icon}</span>
    <span className="text-[8px] font-black dark:text-gray-400 uppercase tracking-widest">{label}</span>
  </button>
);

export default Home;
