
import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SaleRecord } from '../types';
import Button from '../ui/Button';
import Header from '../ui/Header';
import { dataService } from '../lib/dataService';
import { supabase } from '../lib/supabase';

interface ReportsProps {
  sales: SaleRecord[];
  onDeleteSale: (id: string) => void;
}

const Reports: React.FC<ReportsProps> = ({ sales, onDeleteSale }) => {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [expandedSale, setExpandedSale] = useState<string | null>(null);

  const stats = useMemo(() => {
    let total = 0;
    let paid = 0;

    sales.forEach(sale => {
      sale.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        const paidPortion = itemTotal * (item.paidInstallments / (item.totalInstallments || 1));
        paid += paidPortion;
      });
    });

    const pending = total - paid;
    return { total, paid, pending, count: sales.length };
  }, [sales]);

  const handleSmartSummary = async () => {
    if (isGeneratingAI || sales.length === 0) return;
    setIsGeneratingAI(true);
    setAiSummary(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const prompt = `Analise estes dados de vendas da loja de fardamento universitário:
      Vendas Totais Brutas: R$ ${stats.total.toFixed(2)}
      Total Recebido: R$ ${stats.paid.toFixed(2)}
      Valor em Aberto (Pendente): R$ ${stats.pending.toFixed(2)}
      Número de Pedidos: ${stats.count}
      
      Gere um resumo financeiro curto e profissional em Português com 3 pontos principais de foco para o administrador.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAiSummary(response.text || "Não foi possível gerar o resumo.");
    } catch (error) {
      console.error(error);
      setAiSummary("Erro ao conectar com a IA.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleUpdatePaidCount = async (itemId: string, newCount: number) => {
    try {
      await dataService.updateItemInstallments(itemId, newCount);
      window.location.reload();
    } catch (error) {
      console.error('Error updating item installments:', error);
      alert('Erro ao atualizar parcelas.');
    }
  };

  const handleUpdateTotalInstallments = async (itemId: string, newTotal: number) => {
    try {
      const { error } = await supabase
        .from('sale_items')
        .update({ total_installments: newTotal })
        .eq('id', itemId);

      if (error) throw error;
      window.location.reload();
    } catch (error) {
      console.error('Error updating total installments:', error);
      alert('Erro ao atualizar total de parcelas.');
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen">
      <Header title="Fluxo de Caixa" subtitle="Relatórios" />

      <div className="px-4 py-6 space-y-4">
        {/* Main Card */}
        <div className="bg-primary p-8 rounded-[3rem] text-white shadow-2xl shadow-primary/30 relative overflow-hidden group">
          <span className="material-symbols-outlined absolute top-8 right-8 opacity-20 text-4xl transform group-hover:rotate-12 transition-transform">payments</span>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-80 mb-2">Faturamento Bruto</p>
          <h2 className="text-4xl font-black mb-1">R$ {stats.total.toFixed(2)}</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Total acumulado de {stats.count} vendas</p>
        </div>

        {/* Breakdown Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-50 dark:border-slate-800">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Pago</p>
            <h3 className="text-lg font-black text-emerald-500">R$ {stats.paid.toFixed(2)}</h3>
            <div className="w-full bg-slate-50 dark:bg-slate-800 h-1 rounded-full mt-4 overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: `${(stats.paid / (stats.total || 1)) * 100}%` }} />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-50 dark:border-slate-800">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Pendente</p>
            <h3 className="text-lg font-black text-rose-500">R$ {stats.pending.toFixed(2)}</h3>
            <div className="w-full bg-slate-50 dark:bg-slate-800 h-1 rounded-full mt-4 overflow-hidden">
              <div className="bg-rose-500 h-full" style={{ width: `${(stats.pending / (stats.total || 1)) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-[2rem] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-lg">auto_awesome</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Análise de IA</span>
            </div>
            <Button
              variant="ghost"
              onClick={handleSmartSummary}
              disabled={isGeneratingAI || sales.length === 0}
              className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full !h-auto ${isGeneratingAI ? 'bg-slate-200 text-slate-400' : ''}`}
            >
              {isGeneratingAI ? 'Analisando...' : 'Resumir Agora'}
            </Button>
          </div>
          {aiSummary ? (
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {aiSummary}
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase leading-relaxed text-center">
              {sales.length > 0 ? 'Clique para gerar um resumo financeiro inteligente.' : 'Nenhuma venda registrada para análise.'}
            </p>
          )}
        </div>

        {/* History */}
        <div className="pt-4 space-y-4 pb-32">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico Recente</h2>
            <button className="text-primary text-[10px] font-black uppercase tracking-widest">Ver Tudo</button>
          </div>

          <div className="space-y-3">
            {sales.map(sale => {
              const isExpanded = expandedSale === sale.id;
              const salePaid = sale.items.every(i => i.status === 'Pago');
              const salePartial = !salePaid && sale.items.some(i => i.status === 'Pago');

              return (
                <div key={sale.id} className="flex flex-col gap-2">
                  <div
                    onClick={() => setExpandedSale(isExpanded ? null : sale.id)}
                    className="bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] flex items-center justify-between shadow-sm border border-slate-50 dark:border-slate-800 cursor-pointer hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined">{isExpanded ? 'expand_less' : 'person'}</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-black dark:text-white uppercase tracking-tight">{sale.customerName}</h3>
                        <div className="flex items-center gap-2">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{sale.date}</p>
                          {sale.customerBM && (
                            <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-md uppercase">BM: {sale.customerBM}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-black dark:text-white">R$ {sale.total.toFixed(2)}</p>
                        <p className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg inline-block mt-1 ${salePaid ? 'bg-emerald-500 text-white' :
                          salePartial ? 'bg-amber-500 text-white' :
                            'bg-blue-500 text-white'
                          }`}>
                          {salePaid ? 'Pago' : salePartial ? 'Parcial' : sale.status}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Deseja realmente excluir esta venda?")) {
                            onDeleteSale(sale.id);
                          }
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mx-4 p-4 bg-slate-50/50 dark:bg-slate-800/30 border-x border-b border-slate-100 dark:border-slate-800 rounded-b-[1.5rem] -mt-4 pt-6 space-y-3 animate-in slide-in-from-top-2 duration-200">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Itens do Pedido (Parcelamento)</p>
                      {sale.items.map(item => {
                        const isFullyPaid = item.paidInstallments >= item.totalInstallments;
                        return (
                          <div key={item.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-50 dark:border-slate-800 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-[10px] font-black dark:text-white uppercase tracking-tight">{item.quantity}x {item.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold">Total: R$ {(item.price * item.quantity).toFixed(2)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-primary">Saldo: R$ {(item.price * item.quantity * (1 - item.paidInstallments / item.totalInstallments)).toFixed(2)}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">A pagar</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Parcelas:</span>
                                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                                  <button
                                    onClick={() => handleUpdateTotalInstallments(item.id, Math.max(1, item.totalInstallments - 1))}
                                    className="px-2 py-1 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                  >-</button>
                                  <span className="px-3 py-1 text-[10px] font-black dark:text-white min-w-[30px] text-center">{item.totalInstallments}x</span>
                                  <button
                                    onClick={() => handleUpdateTotalInstallments(item.id, item.totalInstallments + 1)}
                                    className="px-2 py-1 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                  >+</button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pagas:</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    disabled={item.paidInstallments <= 0}
                                    onClick={() => handleUpdatePaidCount(item.id, item.paidInstallments - 1)}
                                    className={`size-7 rounded-lg flex items-center justify-center transition-all ${item.paidInstallments <= 0 ? 'opacity-30' : 'bg-rose-500 text-white shadow-sm'}`}
                                  >
                                    <span className="material-symbols-outlined text-sm">remove</span>
                                  </button>
                                  <div className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                                    <p className="text-[10px] font-black dark:text-white">{item.paidInstallments} / {item.totalInstallments}</p>
                                  </div>
                                  <button
                                    disabled={isFullyPaid}
                                    onClick={() => handleUpdatePaidCount(item.id, item.paidInstallments + 1)}
                                    className={`size-7 rounded-lg flex items-center justify-center transition-all ${isFullyPaid ? 'opacity-30' : 'bg-emerald-500 text-white shadow-sm'}`}
                                  >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${isFullyPaid ? 'bg-emerald-500' : 'bg-primary'}`}
                                style={{ width: `${(item.paidInstallments / item.totalInstallments) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {sales.length === 0 && (
              <p className="text-center py-20 text-slate-300 text-xs font-bold uppercase tracking-widest">Nenhum registro encontrado</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
