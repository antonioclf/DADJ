
import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SaleRecord, InventoryItem, OrderItem } from '../types';
import Button from '../ui/Button';
import Header from '../ui/Header';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ItemPickerModal from '../ui/ItemPickerModal';
import { dataService } from '../lib/dataService';
import { supabase } from '../lib/supabase';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsProps {
  sales: SaleRecord[];
  inventory: InventoryItem[];
  onDeleteSale: (id: string) => void;
  onRefresh: () => Promise<void>;
}

const Reports: React.FC<ReportsProps> = ({ sales, inventory, onDeleteSale, onRefresh }) => {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [expandedSale, setExpandedSale] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);
  const [editForm, setEditForm] = useState({ customerName: '', customerPhone: '', customerBM: '', seller: '' });
  const [isUpdatingSale, setIsUpdatingSale] = useState(false);

  const handleEditClick = (sale: SaleRecord) => {
    setEditingSale(sale);
    setEditForm({
      customerName: sale.customerName || '',
      customerPhone: sale.customerPhone || '',
      customerBM: sale.customerBM || '',
      seller: sale.seller || ''
    });
  };

  const handleSaveSaleEdit = async () => {
    if (!editingSale) return;
    setIsUpdatingSale(true);
    try {
      await dataService.updateSaleInfo(editingSale.id, editForm);
      await onRefresh();
      setEditingSale(null);
    } catch (error) {
      console.error('Error updating sale info:', error);
      alert('Erro ao atualizar informações da venda.');
    } finally {
      setIsUpdatingSale(false);
    }
  };

  const [addingToSaleId, setAddingToSaleId] = useState<string | null>(null);

  const handleAddToCart = async (item: InventoryItem, size: string) => {
    if (!addingToSaleId) return;

    const targetSale = sales.find(s => s.id === addingToSaleId);
    if (!targetSale) return;

    const qtyStr = window.prompt(`Quantidade para ${item.name} (Tamanho: ${size}):`, "1");
    if (!qtyStr) {
      setAddingToSaleId(null);
      return;
    }
    const quantity = parseInt(qtyStr, 10);
    if (isNaN(quantity) || quantity <= 0) {
      alert("Quantidade inválida.");
      setAddingToSaleId(null);
      return;
    }

    const isEstoque = window.confirm(`A origem deste item é do Estoque (com baixa automática)?\n\nOK = Estoque\nCancelar = Loja (Compra Direta)`);
    const source = isEstoque ? 'Estoque' : 'Loja';

    const orderItem: OrderItem = {
      id: Date.now().toString(),
      inventoryId: item.id,
      name: item.name,
      size: size,
      quantity: quantity,
      price: item.price,
      discount: item.discount,
      source: source,
      status: targetSale.status,
      totalInstallments: 1,
      paidInstallments: 0
    };

    try {
      await dataService.addItemToSale(targetSale.id, orderItem, targetSale.total);
      await onRefresh();
      alert("Item adicionado com sucesso!");
    } catch (error) {
      console.error("Error adding item to sale:", error);
      alert("Erro ao adicionar item.");
    } finally {
      setAddingToSaleId(null);
    }
  };

  const formatPhone = (val?: string) => {
    if (!val) return '';
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) return raw;
    if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  };

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

  const generatePDFDoc = () => {
    const doc = new jsPDF();

    // Calculate separated stats
    let lojaTotal = 0;
    let lojaPaid = 0;
    let estoqueTotal = 0;
    let estoquePaid = 0;

    const tableDataEstoque: any[] = [];
    const tableDataLoja: any[] = [];

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        const paidPortion = itemTotal * (item.paidInstallments / (item.totalInstallments || 1));
        
        if (item.source === 'Loja') {
          lojaTotal += itemTotal;
          lojaPaid += paidPortion;
        } else {
          estoqueTotal += itemTotal;
          estoquePaid += paidPortion;
        }

        const row = [
          sale.date.split(',')[0],
          sale.customerName,
          formatPhone(sale.customerPhone) || 'N/A',
          sale.seller,
          item.name,
          item.quantity,
          `R$ ${item.price.toFixed(2)}`,
          `R$ ${itemTotal.toFixed(2)}`,
          `${item.status}${item.totalInstallments > 1 ? ` [${item.paidInstallments}/${item.totalInstallments}]` : ''}${item.status === 'Entregue' && item.deliveredAt ? ` (${item.deliveredAt.split(',')[0]})` : item.status === 'Pago' && item.paidAt ? ` (${item.paidAt.split(',')[0]})` : ''}`
        ];

        if (item.source === 'Loja') {
          tableDataLoja.push(row);
        } else {
          tableDataEstoque.push(row);
        }
      });
    });

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
        ['Total Bruto (Geral)', `R$ ${stats.total.toFixed(2)}`],
        ['  -> Total Estoque', `R$ ${estoqueTotal.toFixed(2)}`],
        ['  -> Total Loja', `R$ ${lojaTotal.toFixed(2)}`],
        ['Total Recebido (Geral)', `R$ ${stats.paid.toFixed(2)}`],
        ['  -> Recebido Estoque', `R$ ${estoquePaid.toFixed(2)}`],
        ['  -> Recebido Loja', `R$ ${lojaPaid.toFixed(2)}`],
        ['Total Pendente (Geral)', `R$ ${stats.pending.toFixed(2)}`],
        ['Quantidade de Vendas Gerais', stats.count.toString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }
    });

    // Sales Details - Estoque
    doc.setFontSize(14);
    doc.text('Itens Vendidos Pelo Estoque (DA)', 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Data', 'Cliente', 'Tel', 'Vend.', 'Item', 'Qtd', 'Un.', 'Total', 'Status']],
      body: tableDataEstoque.length > 0 ? tableDataEstoque : [['-', '-', '-', '-', 'Livre/Nenhum item', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 8 }
    });

    // Sales Details - Loja
    doc.setFontSize(14);
    doc.text('Itens de Compra Direta (Loja)', 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Data', 'Cliente', 'Tel', 'Vend.', 'Item', 'Qtd', 'Un.', 'Total', 'Status']],
      body: tableDataLoja.length > 0 ? tableDataLoja : [['-', '-', '-', '-', 'Livre/Nenhum item', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] }, // Indigo header to distinguish
      styles: { fontSize: 8 }
    });

    return { doc, periodText };
  };

  const handleExportPDF = () => {
    const { doc } = generatePDFDoc();
    doc.save(`relatorio_vendas_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleEmailReport = async () => {
    const email = prompt("Digite o e-mail para envio do relatório:");
    if (!email) return;

    try {
      const { doc, periodText } = generatePDFDoc();
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

  const handleExportIndividualPDF = (sale: SaleRecord) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Recibo de Venda - DA Dois de Julho', 14, 22);

    doc.setFontSize(10);
    doc.text(`Data da Venda: ${sale.date.split(',')[0]}`, 14, 30);
    doc.text(`Cliente: ${sale.customerName}${sale.customerBM ? ` (BM: ${sale.customerBM})` : ''}`, 14, 35);
    let currentY = 40;
    if (sale.customerPhone) {
      doc.text(`Telefone: ${formatPhone(sale.customerPhone)}`, 14, currentY);
      currentY += 5;
    }
    doc.text(`Vendedor: ${sale.seller}`, 14, currentY);
    currentY += 15;

    // Items table
    const tableData = sale.items.map(item => [
      item.name,
      item.size || '-',
      item.quantity.toString(),
      `R$ ${item.price.toFixed(2)}`,
      `R$ ${(item.price * item.quantity).toFixed(2)}`,
      item.status
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Item', 'Tam.', 'Qtd', 'Un.', 'Total', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
    });

    // Financial calculations
    const total = sale.total;
    const paid = sale.items.reduce((acc, item) => acc + (item.price * item.quantity * (item.paidInstallments / (item.totalInstallments || 1))), 0);
    const pending = total - paid;

    const finalY = (doc as any).lastAutoTable.finalY + 15;

    doc.setFontSize(14);
    doc.text('Resumo Financeiro', 14, finalY);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total do Pedido', `R$ ${total.toFixed(2)}`],
        ['Total Pago', `R$ ${paid.toFixed(2)}`],
        ['Saldo Pendente', `R$ ${pending.toFixed(2)}`],
        ['Situação', sale.items.every(i => i.paidInstallments >= i.totalInstallments) ? 'Pago Totalmente' : 'Pendente']
      ],
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save(`recibo_${sale.customerName.replace(/\s+/g, '_')}_${sale.date.split(',')[0].replace(/\//g, '-')}.pdf`);
  };

  const handleExportDeliveryPDF = (sale: SaleRecord) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Guia de Entrega - DA Dois de Julho', 14, 22);

    doc.setFontSize(10);
    doc.text(`Data: ${sale.date.split(',')[0]}`, 14, 30);
    doc.text(`Cliente: ${sale.customerName}${sale.customerBM ? ` (BM: ${sale.customerBM})` : ''}`, 14, 35);
    let currentY = 40;
    if (sale.customerPhone) {
      doc.text(`Telefone: ${formatPhone(sale.customerPhone)}`, 14, currentY);
      currentY += 5;
    }
    doc.text(`Vendedor: ${sale.seller}`, 14, currentY);
    currentY += 15;

    // Items table (No prices)
    const tableData = sale.items.map(item => [
      item.name,
      item.size || '-',
      item.quantity.toString(),
      item.status
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Item', 'Tam.', 'Qtd', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105] }, // Slate color for delivery
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text('Documento gerado para controle interno de entrega.', 14, finalY);

    doc.save(`guia_entrega_${sale.customerName.replace(/\s+/g, '_')}_${sale.date.split(',')[0].replace(/\//g, '-')}.pdf`);
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

  const handleUpdatePaidCountBulk = async (sale: SaleRecord, newCount: number) => {
    try {
      await Promise.all(sale.items.map(item => dataService.updateItemInstallments(item.id, newCount)));
      await onRefresh();
    } catch (error) {
      console.error('Error updating sale installments:', error);
      alert('Erro ao atualizar parcelas do pedido.');
    }
  };

  const handleUpdateTotalInstallmentsBulk = async (sale: SaleRecord, newTotal: number) => {
    try {
      await Promise.all(sale.items.map(item => 
        supabase.from('sale_items').update({ total_installments: newTotal }).eq('id', item.id)
      ));
      await onRefresh();
    } catch (error) {
      console.error('Error updating total installments bulk:', error);
      alert('Erro ao atualizar total de parcelas do pedido.');
    }
  };

  const handleUpdateStatusBulk = async (sale: SaleRecord, status: string) => {
    try {
      await Promise.all(sale.items.map(item => dataService.updateItemStatus(item.id, status)));
      await onRefresh();
    } catch (error) {
      console.error('Error updating status bulk:', error);
      alert('Erro ao atualizar status do pedido.');
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{sale.date}</p>
                          {sale.customerBM && (
                            <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-md uppercase">BM: {sale.customerBM}</span>
                          )}
                          <span className="text-[9px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-md uppercase">Vend: {sale.seller}</span>
                          {sale.customerPhone && (
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <span className="material-symbols-outlined text-[10px]">call</span>
                              <span className="text-[9px] font-black uppercase tracking-widest">{formatPhone(sale.customerPhone)}</span>
                            </div>
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
                          handleExportIndividualPDF(sale);
                        }}
                        className="p-2 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-xl transition-all"
                        title="Gerar PDF (Recibo Local)"
                      >
                        <span className="material-symbols-outlined text-lg">receipt_long</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportDeliveryPDF(sale);
                        }}
                        className="p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                        title="Gerar Guia de Entrega (Sem Valores)"
                      >
                        <span className="material-symbols-outlined text-lg">bedtime</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(sale);
                        }}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-all"
                        title="Editar Informações Básicas"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
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
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Situação dos Itens</p>
                      {sale.items.map(item => {
                        return (
                          <div key={item.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-50 dark:border-slate-800 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-[10px] font-black dark:text-white uppercase tracking-tight">{item.quantity}x {item.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold">Total do Item: R$ {(item.price * item.quantity).toFixed(2)}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl">
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
                            </div>

                            <div className="flex items-center justify-between px-1">
                              <p className={`text-[8px] font-black uppercase tracking-widest ${item.status === 'Pago' ? 'text-emerald-500' :
                                item.status === 'Entregue' ? 'text-blue-500' :
                                  'text-slate-400'
                                }`}>
                                Status: {item.status}
                                {item.status === 'Entregue' && item.deliveredAt && ` (${item.deliveredAt.split(',')[0]})`}
                                {item.status === 'Pago' && item.paidAt && ` (${item.paidAt.split(',')[0]})`}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      <Button
                        variant="secondary"
                        onClick={() => setAddingToSaleId(sale.id)}
                        className="w-full mt-2 !bg-primary/5 hover:!bg-primary/10 !text-primary border border-primary/20 flex items-center justify-center gap-2 py-3"
                      >
                        <span className="material-symbols-outlined text-sm">add_circle</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Adicionar Item a Esta Venda</span>
                      </Button>

                      {/* Sale Level Payment Situation */}
                      {(() => {
                        const referenceItem = sale.items[0];
                        if (!referenceItem) return null;
                        
                        const totalInstallments = referenceItem.totalInstallments || 1;
                        const paidInstallments = referenceItem.paidInstallments || 0;
                        const isFullyPaid = paidInstallments >= totalInstallments;
                        
                        return (
                          <div className="mt-4 p-4 bg-primary/5 dark:bg-primary/10 rounded-[1.5rem] border border-primary/20 space-y-3 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-[10px] font-black text-primary dark:text-primary-light uppercase tracking-widest ml-1">Pagamento do Pedido Total</p>
                                <p className="text-[13px] font-bold text-slate-800 dark:text-white mt-1 ml-1">Total: R$ {sale.total.toFixed(2)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-primary hover:text-primary-dark transition-all">Saldo a Pagar: R$ {(sale.total * (1 - paidInstallments / totalInstallments)).toFixed(2)}</p>
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">referente ao pedido</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between bg-white/60 dark:bg-slate-900/60 p-3 rounded-2xl gap-3">
                              <div className="space-y-1 w-1/3">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Parcelas Totais:</span>
                                <select
                                  value={totalInstallments}
                                  onChange={(e) => handleUpdateTotalInstallmentsBulk(sale, parseInt(e.target.value))}
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-[10px] font-black dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all block"
                                >
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                    <option key={n} value={n}>{n}x</option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex flex-col items-end gap-1 flex-1">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mr-1">Parcelas Pagas:</span>
                                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl shadow-inner border border-slate-100 dark:border-slate-800">
                                  <button
                                    disabled={paidInstallments <= 0}
                                    onClick={() => handleUpdatePaidCountBulk(sale, paidInstallments - 1)}
                                    className={`size-8 rounded-lg flex items-center justify-center transition-all ${paidInstallments <= 0 ? 'opacity-30 text-slate-300' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-500 hover:scale-110 active:scale-95'}`}
                                  >
                                    <span className="material-symbols-outlined text-sm">remove</span>
                                  </button>
                                  <div className="px-4 py-1">
                                    <p className="text-[11px] font-black dark:text-white">{paidInstallments} / {totalInstallments}</p>
                                  </div>
                                  <button
                                    disabled={isFullyPaid}
                                    onClick={() => handleUpdatePaidCountBulk(sale, paidInstallments + 1)}
                                    className={`size-8 rounded-lg flex items-center justify-center transition-all ${isFullyPaid ? 'opacity-30 text-slate-300' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 hover:scale-110 active:scale-95'}`}
                                  >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between px-1 pt-1">
                              <div className="space-y-1">
                                {referenceItem.installmentHistory && referenceItem.installmentHistory.length > 0 && (
                                  <div className="space-y-0.5 ml-2 border-l-2 border-primary/30 pl-2">
                                    {referenceItem.installmentHistory.map((payment, idx) => (
                                      <p key={idx} className="text-[7px] font-bold text-slate-600 dark:text-slate-400 italic">
                                        Parcela {payment.installmentNumber}: {payment.paidAt.split(',')[0]}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              {isFullyPaid && sale.items.some(i => i.status !== 'Pago') && (
                                <button
                                  onClick={() => handleUpdateStatusBulk(sale, 'Pago')}
                                  className="text-[8px] font-black text-emerald-500 uppercase tracking-widest hover:underline bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md"
                                >
                                  Marcar Itens como Pago
                                </button>
                              )}
                            </div>

                            <div className="w-full bg-primary/20 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                              <div
                                className={`h-full transition-all duration-500 ${isFullyPaid ? 'bg-emerald-500' : 'bg-primary'}`}
                                style={{ width: `${(paidInstallments / totalInstallments) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}

                      {(sale.deliveredAt || sale.paidAt) && (
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-50 dark:border-slate-800 shadow-sm space-y-2 mt-2">
                          <div className="flex items-center gap-2 text-primary">
                            <span className="material-symbols-outlined text-sm">history</span>
                            <span className="text-[9px] font-black uppercase tracking-widest">Atualizações de Status</span>
                          </div>
                          <div className="grid grid-cols-1 gap-1">
                            {sale.deliveredAt && (
                              <p className="text-[10px] font-bold text-slate-500">
                                <span className="text-blue-500">●</span> Entregue no dia <span className="text-slate-900 dark:text-white">{sale.deliveredAt.split(',')[0]}</span>
                              </p>
                            )}
                            {sale.paidAt && (
                              <p className="text-[10px] font-bold text-slate-500">
                                <span className="text-emerald-500">●</span> Pago Total no dia <span className="text-slate-900 dark:text-white">{sale.paidAt.split(',')[0]}</span>
                              </p>
                            )}
                            {sale.items.some(i => i.lastPaymentAt) && (
                              <p className="text-[10px] font-bold text-slate-500">
                                <span className="text-amber-500">●</span> Última Parcela em <span className="text-slate-900 dark:text-white">{[...sale.items].sort((a, b) => (b.lastPaymentAt || '').localeCompare(a.lastPaymentAt || ''))[0].lastPaymentAt?.split(',')[0]}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      )}
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

      <Modal
        isOpen={!!editingSale}
        onClose={() => setEditingSale(null)}
        title="Editar Informações da Venda"
      >
        <div className="space-y-4 pb-4">
          <Input
            label="Nome do Aluno (Comprador)"
            value={editForm.customerName}
            onChange={(e) => setEditForm({ ...editForm, customerName: (e.target as HTMLInputElement).value })}
          />
          <Input
            label="Número BM do Comprador"
            value={editForm.customerBM}
            onChange={(e) => setEditForm({ ...editForm, customerBM: (e.target as HTMLInputElement).value })}
          />
          <Input
            label="Telefone / WhatsApp"
            value={editForm.customerPhone}
            onChange={(e) => setEditForm({ ...editForm, customerPhone: (e.target as HTMLInputElement).value })}
          />
          <Input
            label="Vendedor"
            value={editForm.seller}
            onChange={(e) => setEditForm({ ...editForm, seller: (e.target as HTMLInputElement).value })}
          />
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditingSale(null)}>Cancelar</Button>
            <Button onClick={handleSaveSaleEdit} disabled={isUpdatingSale}>
              {isUpdatingSale ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </Modal>

      <ItemPickerModal
        isOpen={!!addingToSaleId}
        onClose={() => setAddingToSaleId(null)}
        inventory={inventory}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
};

export default Reports;
