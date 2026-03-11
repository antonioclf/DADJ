
import React, { useState, useMemo } from 'react';
import { InventoryItem, View } from '../types';
import Input from '../ui/Input';

interface InventoryConsultationProps {
    inventory: InventoryItem[];
    onBack: () => void;
}

const InventoryConsultation: React.FC<InventoryConsultationProps> = ({ inventory, onBack }) => {
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('Todos');
    const filters = ['Todos', '1º e 2º A', '3º A', '4º A', '5º A/B', 'Meias', 'Calçados'];

    const getPriority = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('1º a') || n.includes('2º a')) return 1;
        if (n.includes('3º a')) return 2;
        if (n.includes('4º a') || n.includes('tarjeta') || n.includes('joelheira') || n.includes('gorro')) return 3;
        if (n.includes('5º b')) return 4;
        if (n.includes('camisa vermelha')) return 5;
        if (n.includes('short')) return 6;
        if (n.includes('sunga')) return 7;
        if (n.includes('maiô')) return 8;
        if (n.includes('suquini')) return 9;
        if (n.includes('segunda pele')) return 10;
        if (n.includes('meia') || n.includes('meião')) return 11;
        if (n.includes('coturno')) return 12;
        return 13;
    };

    const groupedInventory = useMemo(() => {
        const groups: Record<string, { type: string, sizes: Record<string, number> }> = {};

        inventory.forEach(item => {
            if (!groups[item.name]) {
                groups[item.name] = { type: item.type, sizes: {} };
            }
            groups[item.name].sizes[item.size] = (groups[item.name].sizes[item.size] || 0) + item.quantity;
        });

        return Object.entries(groups)
            .map(([name, data]) => ({
                name,
                type: data.type,
                sizes: data.sizes
            }))
            .filter(item => {
                const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                    item.type.toLowerCase().includes(search.toLowerCase());
                const matchesFilter = activeFilter === 'Todos' || item.type === activeFilter;
                return matchesSearch && matchesFilter;
            })
            .sort((a, b) => {
                const pA = getPriority(a.name);
                const pB = getPriority(b.name);
                if (pA !== pB) return pA - pB;
                return a.name.localeCompare(b.name);
            });
    }, [inventory, search, activeFilter]);

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark p-6">
            <div className="max-w-4xl mx-auto space-y-6 pb-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="size-10 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all text-slate-600 dark:text-slate-400"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-xl font-black dark:text-white uppercase tracking-tight">Consulta de Estoque</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Disponibilidade de Fardamentos</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-50 dark:border-slate-800 space-y-4">
                        <Input
                            icon="search"
                            placeholder="Pesquisar item no estoque..."
                            value={search}
                            onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
                        />
                        <div className="flex gap-2 overflow-x-auto pb-4">
                            {filters.map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`flex h-9 shrink-0 items-center justify-center rounded-xl px-5 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === filter
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-slate-100 dark:border-slate-700'
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        {groupedInventory.map(item => (
                            <div key={item.name} className="p-6 hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-black dark:text-white uppercase tracking-tight">{item.name}</h3>
                                        <span className="inline-block text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                            {item.type}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Object.entries(item.sizes)
                                            .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
                                            .map(([size, qty]) => {
                                                const count = qty as number;
                                                return (
                                                    <div
                                                        key={size}
                                                        className={`flex flex-col items-center min-w-[40px] p-2 rounded-xl border transition-all ${count > 0
                                                            ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm'
                                                            : 'bg-slate-50 dark:bg-slate-900 border-transparent opacity-40 grayscale'
                                                            }`}
                                                    >
                                                        <span className="text-[10px] font-black dark:text-white">{size}</span>
                                                        <span className={`text-[8px] font-bold ${count > 10 ? 'text-emerald-500' : count > 0 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                            {count > 0 ? `${count} un` : 'Esgotado'}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {groupedInventory.length === 0 && (
                            <div className="py-20 text-center">
                                <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">inventory_2</span>
                                <p className="text-sm font-bold text-slate-400 uppercase">Nenhum item disponível</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryConsultation;
