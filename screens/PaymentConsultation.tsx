
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
                .order('date', { ascending: false })
                .order('created_at', { foreignTable: 'sale_items', ascending: true })
                .order('id', { foreignTable: 'sale_items', ascending: true });

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
                    price: item.price,
                    status: item.status,
                    totalInstallments: item.total_installments || 1,
                    paidInstallments: item.paid_installments || 0
                })).filter((item: any) => item.paidInstallments < item.totalInstallments),
                deliveryForecast: sale.delivery_forecast ? new Date(sale.delivery_forecast).toLocaleDateString('pt-BR') : undefined
            })).filter((sale: any) => sale.items.length > 0));
        } catch (error) {
            console.error('Error searching payments:', error);
            alert('Erro ao consultar pagamentos.');
        } finally {
            setLoading(false);
        }
    };

    const totalPending = results.reduce((acc, sale) =>
        acc + sale.items.reduce((itemAcc, item) => itemAcc + (item.price * item.quantity * (1 - item.paidInstallments / item.totalInstallments)), 0)
        , 0);

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
                                                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">Total Pendente Desta Venda</p>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight ml-1">Original: R$ {sale.items.reduce((acc: any, item: any) => acc + (item.price * item.quantity), 0).toFixed(2)}</p>
                                                        {sale.deliveryForecast && (
                                                            <div className="flex items-center gap-1.5 mt-2 bg-amber-50 dark:bg-amber-900/40 px-3 py-1.5 rounded-xl border border-amber-100/50 dark:border-amber-800/50 w-fit">
                                                                <span className="material-symbols-outlined text-[14px] text-amber-600">calendar_today</span>
                                                                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Previsão: {sale.deliveryForecast}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-black text-rose-500">R$ {sale.items.reduce((acc: any, item: any) => acc + (item.price * item.quantity * (1 - item.paidInstallments / item.totalInstallments)), 0).toFixed(2)}</p>
                                                </div>
                                                <div className="space-y-4">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Itens do Pedido (Saldos em Aberto)</p>
                                                    {sale.items.map((item: any, idx) => {
                                                        const itemTotal = item.price * item.quantity;
                                                        const itemPaid = itemTotal * (item.paidInstallments / item.totalInstallments);
                                                        const itemPending = itemTotal - itemPaid;

                                                        return (
                                                            <div key={idx} className="p-5 rounded-3xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div>
                                                                        <p className="text-xs font-black dark:text-white uppercase tracking-tight">{item.quantity}x {item.name}</p>
                                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total do Item: R$ {itemTotal.toFixed(2)}</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-sm font-black text-amber-600">Falta: R$ {itemPending.toFixed(2)}</p>
                                                                        <span className="text-[8px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-md mt-1 inline-block">
                                                                            Parcelas: {item.paidInstallments} / {item.totalInstallments}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="bg-amber-500 h-full transition-all duration-500"
                                                                        style={{ width: `${(item.paidInstallments / item.totalInstallments) * 100}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
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
        </div >
    );
};

export default PaymentConsultation;
