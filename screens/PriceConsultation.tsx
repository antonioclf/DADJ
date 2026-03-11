
import React, { useState } from 'react';
import { InventoryItem, CATALOG_ITEMS } from '../types';
import Input from '../ui/Input';

interface PriceConsultationProps {
    inventory: InventoryItem[];
    onBack: () => void;
}

const PriceConsultation: React.FC<PriceConsultationProps> = ({ inventory, onBack }) => {
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('Todos');
    const filters = ['Todos', '4º A', '3º A', '5º A/B'];

    const getPriority = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('4º a') || n.includes('tarjeta') || n.includes('joelheira') || n.includes('gorro')) return 1;
        if (n.includes('3º a')) return 2;
        if (n.includes('5º b')) return 3;
        if (n.includes('camisa vermelha')) return 4;
        if (n.includes('short')) return 5;
        if (n.includes('sunga')) return 6;
        if (n.includes('maiô')) return 7;
        if (n.includes('suquini')) return 8;
        if (n.includes('segunda pele')) return 9;
        return 10;
    };

    const mergedItems = CATALOG_ITEMS
        .filter(catItem => !(catItem as any).hideFromSales)
        .map(catItem => {
            const invMatch = inventory.find(i => i.name === catItem.name && i.color === catItem.color);
            return {
                id: `price-${catItem.name}`,
                name: catItem.name,
                type: catItem.type,
                price: invMatch?.price ?? catItem.price,
                discount: invMatch?.discount ?? catItem.discount ?? 0
            };
        });

    const filteredItems = mergedItems
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

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="size-10 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all text-slate-600 dark:text-slate-400"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-xl font-black dark:text-white uppercase tracking-tight">Tabela de Preços</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consulta Pública de Fardamentos</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-50 dark:border-slate-800 space-y-4">
                        <Input
                            icon="search"
                            placeholder="Pesquisar fardamento..."
                            value={search}
                            onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
                        />
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
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

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Desconto</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Preço Final</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {filteredItems.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold dark:text-white">{item.name}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {(item.discount ?? 0) > 0 ? (
                                                <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-1 rounded-lg uppercase shadow-sm">
                                                    {item.discount}% OFF
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-black text-slate-300 uppercase italic">---</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-sm font-black text-primary">R$ {item.price.toFixed(2)}</p>
                                        </td>
                                    </tr>
                                ))}
                                {filteredItems.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center">
                                            <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">search_off</span>
                                            <p className="text-sm font-bold text-slate-400 uppercase">Nenhum item encontrado</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PriceConsultation;
