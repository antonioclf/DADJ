
import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SaleRecord } from '../types';
import Button from '../ui/Button';
import Header from '../ui/Header';
import { dataService } from '../lib/dataService';
import { supabase } from '../lib/supabase';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsProps {
  sales: SaleRecord[];
  onDeleteSale: (id: string) => void;
  onRefresh: () => Promise<void>;
}

const Reports: React.FC<ReportsProps> = ({ sales, onDeleteSale, onRefresh }) => {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [expandedSale, setExpandedSale] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filteredSales = useMemo(() => {
    if (!startDate && !endDate) return sales;

    return sales.filter(sale => {
      // Parse DD/MM/YYYY to dynamic Date
      const [datePart] = sale.date.split(', ');
      const [day, month, year] = datePart.split('/').map(Number);
      const saleDate = new Date(year, month - 1, day);

      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);

      if (start && saleDate < start) return false;
      if (end && saleDate > end) return false;
      return true;
    });
  }, [sales, startDate, endDate]);

  const stats = useMemo(() => {
    let total = 0;
    let paid = 0;

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        const paidPortion = itemTotal * (item.paidInstallments / (item.totalInstallments || 1));
        paid += paidPortion;
      });
    });

    const pending = total - paid;
    return { total, paid, pending, count: filteredSales.length };
  }, [filteredSales]);

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

  const setPeriodShortcut = (period: 'thisMonth' | 'lastMonth' | 'thisYear' | 'all') => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (period === 'thisMonth') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (period === 'lastMonth') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (period === 'thisYear') {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
    } else if (period === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text('Relatório de Vendas - DA Dois de Julho', 14, 22);

    doc.setFontSize(10);
    const periodText = startDate || endDate
      ? `Período: ${startDate ? new Date(startDate).toLocaleDateString() : 'Início'} até ${endDate ? new Date(endDate).toLocaleDateString() : 'Hoje'}`
      : 'Período: Completo';
    doc.text(periodText, 14, 30);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 35);

    // Financial Summary
    doc.setFontSize(14);
    doc.text('Resumo Financeiro', 14, 45);

    autoTable(doc, {
      startY: 50,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total Bruto', `R$ ${stats.total.toFixed(2)}`],
        ['Total Recebido', `R$ ${stats.paid.toFixed(2)}`],
        ['Total Pendente', `R$ ${stats.pending.toFixed(2)}`],
        ['Quantidade de Vendas', stats.count.toString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }
    });

    // Sales Details
    doc.setFontSize(14);
    doc.text('Detalhamento de Vendas', 14, (doc as any).lastAutoTable.finalY + 15);

    const tableData = filteredSales.flatMap(sale =>
      sale.items.map(item => [
        sale.date.split(',')[0],
        sale.customerName,
        item.name,
        item.quantity,
        `R$ ${item.price.toFixed(2)}`,
        `R$ ${(item.price * item.quantity).toFixed(2)}`,
        item.status
      ])
    );

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Data', 'Cliente', 'Item', 'Qtd', 'Un.', 'Total', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 8 }
    });

    doc.save(`relatorio_vendas_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleEmailReport = async () => {
    const email = prompt("Digite o e-mail para envio do relatório:");
    if (!email) return;

    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text('Relatório de Vendas - DA Dois de Julho', 14, 22);

      const periodText = startDate || endDate
        ? `Período: ${startDate ? new Date(startDate).toLocaleDateString() : 'Início'} até ${endDate ? new Date(endDate).toLocaleDateString() : 'Hoje'}`
        : 'Período: Completo';
      doc.setFontSize(10);
      doc.text(periodText, 14, 30);
      doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 35);

      autoTable(doc, {
        startY: 50,
        head: [['Métrica', 'Valor']],
        body: [
          ['Total Bruto', `R$ ${stats.total.toFixed(2)}`],
          ['Total Recebido', `R$ ${stats.paid.toFixed(2)}`],
          ['Total Pendente', `R$ ${stats.pending.toFixed(2)}`],
          ['Quantidade de Vendas', stats.count.toString()],
        ],
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] }
      });

      const tableData = filteredSales.flatMap(sale =>
        sale.items.map(item => [
          sale.date.split(',')[0],
          sale.customerName,
          item.name,
          item.quantity,
          `R$ ${item.price.toFixed(2)}`,
          `R$ ${(item.price * item.quantity).toFixed(2)}`,
          item.status
        ])
      );

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Data', 'Cliente', 'Item', 'Qtd', 'Un.', 'Total', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 8 }
      });

      const pdfBase64 = doc.output('datauristring').split(',')[1];

      const { data, error: invokeError } = await supabase.functions.invoke('send-report', {
        body: {
          pdfBase64,
          recipientEmail: email,
          subject: `Relatório de Vendas (${periodText})`,
          filename: `relatorio_${new Date().toISOString().split('T')[0]}.pdf`
        }
      });

      if (invokeError) {
        console.error('Invoke Error Details:', invokeError);
        // Supabase invoke error often has context in the message or data
        let errorMsg = 'Erro na comunicação com o servidor';

        if (invokeError.context) {
          try {
            const body = await invokeError.context.json();
            errorMsg = body.error || body.message || JSON.stringify(body);
          } catch {
            errorMsg = invokeError.message;
          }
        } else {
          errorMsg = invokeError.message;
        }

        throw new Error(errorMsg);
      }

      alert("E-mail enviado com sucesso!");
    } catch (error: any) {
      console.error('Error sending email:', error);
      const message = error.message || 'Erro desconhecido';
      alert(`Erro ao enviar e-mail: ${message}\n\nNota: No plano gratuito do Resend, você só pode enviar para o seu próprio e-mail de cadastro.`);
    }
  };

  const handleUpdatePaidCount = async (itemId: string, newCount: number) => {
    try {
      await dataService.updateItemInstallments(itemId, newCount);
      await onRefresh();
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
      await onRefresh();
    } catch (error) {
      console.error('Error updating total installments:', error);
      alert('Erro ao atualizar total de parcelas.');
    }
  };

  const handleUpdateStatus = async (itemId: string, newStatus: string) => {
    try {
      await dataService.updateItemStatus(itemId, newStatus);
      await onRefresh();
    } catch (error) {
      console.error('Error updating item status:', error);
      alert('Erro ao atualizar status.');
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen">
      <Header title="Fluxo de Caixa" subtitle="Relatórios" />

      <div className="px-4 py-6 space-y-4">
        {/* Date Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-50 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar por Período</h3>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleEmailReport}
                className="text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full !h-auto flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">mail</span>
                Enviar por E-mail
              </Button>
              <Button
                variant="ghost"
                onClick={handleExportPDF}
                className="text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full !h-auto flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Fim</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {[
              { id: 'thisMonth', label: 'Este Mês' },
              { id: 'lastMonth', label: 'Mês Passado' },
              { id: 'thisYear', label: 'Este Ano' },
              { id: 'all', label: 'Tudo' }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setPeriodShortcut(s.id as any)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        {/* Main Card */}
        <div className="bg-primary p-8 rounded-[3rem] text-white shadow-2xl shadow-primary/30 relative overflow-hidden group">
          <span className="material-symbols-outlined absolute top-8 right-8 opacity-20 text-4xl transform group-hover:rotate-12 transition-transform">payments</span>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-80 mb-2">Faturamento Bruto</p>
          <h2 className="text-4xl font-black mb-1">R$ {stats.total.toFixed(2)}</h2>
          <div className="mt-4 flex items-center gap-2 bg-white/20 w-fit px-3 py-1.5 rounded-xl backdrop-blur-md">
            <span className="material-symbols-outlined text-sm text-white">savings</span>
            <p className="text-[10px] font-black uppercase tracking-widest text-white">Recebido: R$ {stats.paid.toFixed(2)}</p>
          </div>
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
            {filteredSales.map(sale => {
              const isExpanded = expandedSale === sale.id;
              const salePaid = sale.items.every(i => i.paidInstallments >= i.totalInstallments);
              const salePartial = !salePaid && sale.items.some(i => i.paidInstallments > 0);

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
                        <p className="text-xs font-black dark:text-white">
                          R$ {sale.items.reduce((acc, i) => acc + (i.price * i.quantity * (i.paidInstallments / i.totalInstallments)), 0).toFixed(2)}
                          <span className="text-slate-400 text-[9px] font-bold"> / R$ {sale.total.toFixed(2)}</span>
                        </p>
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

                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                              <div className="space-y-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Parcelas Totais:</span>
                                <select
                                  value={item.totalInstallments}
                                  onChange={(e) => handleUpdateTotalInstallments(item.id, parseInt(e.target.value))}
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-[10px] font-black dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                >
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                    <option key={n} value={n}>{n}x</option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex-1 space-y-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Item:</span>
                                <div className="flex gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                  {[
                                    { id: 'Pedido no DA', icon: 'assignment', color: 'text-purple-500' },
                                    { id: 'Pedido na loja', icon: 'storefront', color: 'text-indigo-500' },
                                    { id: 'Entregue', icon: 'package_2', color: 'text-blue-500' }
                                  ].map((s) => (
                                    <button
                                      key={s.id}
                                      onClick={() => handleUpdateStatus(item.id, s.id)}
                                      title={s.id}
                                      className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-all ${item.status === s.id ? `bg-slate-50 dark:bg-slate-800 ${s.color} shadow-inner` : 'text-slate-300 hover:text-slate-400'}`}
                                    >
                                      <span className="material-symbols-outlined text-sm font-black">{s.icon}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mr-1">Parcelas Pagas:</span>
                                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl shadow-inner border border-slate-100 dark:border-slate-800">
                                  <button
                                    disabled={item.paidInstallments <= 0}
                                    onClick={() => handleUpdatePaidCount(item.id, item.paidInstallments - 1)}
                                    className={`size-8 rounded-lg flex items-center justify-center transition-all ${item.paidInstallments <= 0 ? 'opacity-30 text-slate-300' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-500 hover:scale-110 active:scale-95'}`}
                                  >
                                    <span className="material-symbols-outlined text-sm">remove</span>
                                  </button>
                                  <div className="px-4 py-1">
                                    <p className="text-[11px] font-black dark:text-white">{item.paidInstallments} / {item.totalInstallments}</p>
                                  </div>
                                  <button
                                    disabled={isFullyPaid}
                                    onClick={() => handleUpdatePaidCount(item.id, item.paidInstallments + 1)}
                                    className={`size-8 rounded-lg flex items-center justify-center transition-all ${isFullyPaid ? 'opacity-30 text-slate-300' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 hover:scale-110 active:scale-95'}`}
                                  >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between px-1">
                              <p className={`text-[8px] font-black uppercase tracking-widest ${item.status === 'Pago' ? 'text-emerald-500' :
                                item.status === 'Entregue' ? 'text-blue-500' :
                                  'text-slate-400'
                                }`}>
                                Status: {item.status}
                              </p>
                              {isFullyPaid && item.status !== 'Pago' && (
                                <button
                                  onClick={() => handleUpdateStatus(item.id, 'Pago')}
                                  className="text-[8px] font-black text-emerald-500 uppercase tracking-widest hover:underline"
                                >
                                  Marcar como Pago
                                </button>
                              )}
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
            {filteredSales.length === 0 && (
              <p className="text-center py-20 text-slate-300 text-xs font-bold uppercase tracking-widest">Nenhum registro encontrado</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
