
import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SaleRecord } from '../types';
import Button from '../ui/Button';
import Header from '../ui/Header';

interface ReportsProps {
  sales: SaleRecord[];
  onDeleteSale: (id: string) => void;
}

const Reports: React.FC<ReportsProps> = ({ sales, onDeleteSale }) => {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = sales.reduce((acc, curr) => acc + curr.total, 0);
    const paid = sales.filter(s => s.status === 'Pago').reduce((acc, curr) => acc + curr.total, 0);
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
            {sales.map(sale => (
              <div key={sale.id} className="bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] flex items-center justify-between shadow-sm border border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black dark:text-white uppercase tracking-tight">{sale.customerName}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{sale.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black dark:text-white">R$ {sale.total.toFixed(2)}</p>
                  <p className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg inline-block mt-1 ${sale.status === 'Pago' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {sale.status}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm("Deseja realmente excluir esta venda?")) {
                      onDeleteSale(sale.id);
                    }
                  }}
                  className="ml-4 p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all flex items-center justify-center shadow-sm border border-rose-100 dark:border-rose-900"
                  title="Excluir Venda"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            ))}
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
