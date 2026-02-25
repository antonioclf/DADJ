
import React, { useState } from 'react';
import { SaleRecord } from '../types';
import { supabase } from '../lib/supabase';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface PaymentConsultationProps {
    onBack: () => void;
}

const PaymentConsultation: React.FC<PaymentConsultationProps> = ({ onBack }) => {
    const [bm, setBm] = useState('');
    const [results, setResults] = useState<SaleRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!bm) return;
        setLoading(true);
        setSearched(true);
        try {
            // Fetch only non-paid sales for this BM
            const { data, error } = await supabase
                .from('sales')
                .select(`
                    *,
                    items:sale_items(*)
                `)
                .eq('customer_bm', bm)
                .neq('status', 'Pago')
                .order('date', { ascending: false });

            if (error) throw error;

            setResults(data.map((sale: any) => ({
                id: sale.id,
                customerName: sale.customer_name,
                customerBM: sale.customer_bm,
                date: new Date(sale.date).toLocaleString('pt-BR'),
                total: sale.total,
                status: sale.status,
                seller: sale.seller,
                items: sale.items.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    size: item.size,
                    quantity: item.quantity,
                    price: item.price
                }))
            })));
        } catch (error) {
            console.error('Error searching payments:', error);
            alert('Erro ao consultar pagamentos.');
        } finally {
            setLoading(false);
        }
    };

    const totalPending = results.reduce((acc, curr) => acc + curr.total, 0);

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark p-6">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="size-10 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all text-slate-600 dark:text-slate-400"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-xl font-black dark:text-white uppercase tracking-tight">Pagamentos em Aberto</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consulta por Número BM</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800 space-y-6">
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <Input
                                icon="badge"
                                label="Seu Número BM"
                                placeholder="Digite seu BM..."
                                value={bm}
                                onChange={(e) => setBm((e.target as HTMLInputElement).value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={loading}
                            className="size-[52px] !p-0 rounded-2xl shrink-0"
                        >
                            {loading ? (
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="material-symbols-outlined">search</span>
                            )}
                        </Button>
                    </div>

                    {searched && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {results.length > 0 ? (
                                <>
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl text-center">
                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Total em Aberto</p>
                                        <p className="text-3xl font-black text-amber-700 dark:text-amber-400 tracking-tight">R$ {totalPending.toFixed(2)}</p>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detalhamento dos Pedidos</p>
                                        {results.map(sale => (
                                            <div key={sale.id} className="p-5 rounded-3xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <p className="text-xs font-black dark:text-white uppercase tracking-tight">{sale.date}</p>
                                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mt-1 inline-block ${sale.status === 'Entregue' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                                                            {sale.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-black dark:text-white">R$ {sale.total.toFixed(2)}</p>
                                                </div>
                                                <div className="space-y-2">
                                                    {sale.items.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
                                                            <span>{item.quantity}x {item.name} ({item.size})</span>
                                                            <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : !loading && (
                                <div className="text-center py-12">
                                    <div className="size-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-800">
                                        <span className="material-symbols-outlined text-4xl text-emerald-500">check_circle</span>
                                    </div>
                                    <h3 className="text-lg font-black dark:text-white uppercase tracking-tight">Nada pendente!</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Nenhum pagamento em aberto para este BM.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentConsultation;
