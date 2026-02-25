
import React, { useState } from 'react';
import { InventoryItem } from '../types';
import Input from '../ui/Input';

interface PriceConsultationProps {
    inventory: InventoryItem[];
    onBack: () => void;
}

const PriceConsultation: React.FC<PriceConsultationProps> = ({ inventory, onBack }) => {
    const [search, setSearch] = useState('');

    const filteredItems = inventory.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.type.toLowerCase().includes(search.toLowerCase())
    );

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
                    <div className="p-6 border-b border-slate-50 dark:border-slate-800">
                        <Input
                            icon="search"
                            placeholder="Pesquisar fardamento ou categoria..."
                            value={search}
                            onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Desconto</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Preço Final</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {filteredItems.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold dark:text-white">{item.name}</p>
                                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{item.color} - {item.size}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded-lg uppercase">
                                                {item.type}
                                            </span>
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
