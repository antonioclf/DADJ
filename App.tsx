
import React, { useState, useEffect, useCallback } from 'react';
import { View, InventoryItem, SaleRecord, TeamMember } from './types';
import Home from './screens/Home';
import Sales from './screens/Sales';
import Inventory from './screens/Inventory';
import Reports from './screens/Reports';
import Team from './screens/Team';
import Login from './screens/Login';
import Layout from './Layout';
import PriceConsultation from './screens/PriceConsultation';
import PaymentConsultation from './screens/PaymentConsultation';
import InventoryConsultation from './screens/InventoryConsultation';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { dataService } from './lib/dataService';
import { supabase } from './lib/supabase';

const AppContent: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);

  useEffect(() => {
    // Atualização forçada dos preços do 4º A no banco de dados existente
    const updateDB = async () => {
      try {
        await supabase.from('inventory').update({ price: 430.00, discount: 6.5 }).eq('name', '4º A Completo');
        await supabase.from('inventory').update({ price: 205.00, discount: 5 }).eq('name', 'Calça 4º A');
        await supabase.from('inventory').update({ price: 50.00, discount: 9 }).eq('name', 'Joelheira 4º A (par)');
        await supabase.from('inventory').update({ price: 29.40, discount: 3 }).eq('name', 'Tarjeta (3 unidades)');
        await supabase.from('inventory').update({ price: 37.70, discount: 5.5 }).eq('name', 'Gorro flexível 4º A');
        await supabase.from('inventory').update({ price: 54.00, discount: 0 }).eq('name', 'Gorro rígido 4º A');
        await supabase.from('inventory').update({ price: 16.50, type: 'Outros' }).eq('name', 'Par de meião preto');
        await supabase.from('inventory').update({ price: 50.00, discount: 9 }).eq('name', 'Camisa Vermelha Bordada');
        await supabase.from('inventory').update({ price: 45.00, discount: 10 }).eq('name', 'Camisa Vermelha sem Bordado');
        await supabase.from('inventory').update({ price: 32.00, discount: 8.5 }).eq('name', 'Short');
        await supabase.from('inventory').update({ price: 55.00, discount: 8 }).eq('name', 'Sunga');
        await supabase.from('inventory').update({ price: 97.00, discount: 0 }).eq('name', 'Maiô');
        await supabase.from('inventory').update({ price: 99.00, discount: 0 }).eq('name', 'Suquini');
        await supabase.from('inventory').update({ price: 260.00, discount: 2 }).eq('name', '3º A Completo');
        await supabase.from('inventory').update({ price: 142.00, discount: 2 }).eq('name', 'Calça 3º A');
        await supabase.from('inventory').update({ price: 118.00, discount: 1.5 }).eq('name', 'Camisa 3º A');
        await supabase.from('inventory').update({ price: 82.00, discount: 3.5 }).eq('name', 'Segunda Pele Bordada');
        await supabase.from('inventory').update({ price: 225.00, discount: 10 }).eq('name', '5º B Bordado');
        await supabase.from('inventory').update({ price: 220.00, discount: 8.5 }).eq('name', '5º B sem Bordado');
        await supabase.from('inventory').update({ name: 'Florão para boina CFO/CHO', price: 58.40 }).eq('name', 'Florão CFO/CHO');
        // Reverter tamanho da luva
        await supabase.from('inventory').update({ size: 'M' }).eq('name', 'Luva preta de couro').eq('size', 'Único');
        
        // Inserir novos itens se não existirem
        const newItems = [
          { name: 'Par de Divisas', size: 'Único', color: 'Padrão', quantity: 0, type: '4º A', price: 11.00, discount: 8, gender: 'Unissex' },
          { name: 'Gorro flexível Oficial Superior', size: 'M', color: 'Padrão', quantity: 0, type: '4º A', price: 48.20, discount: 3.5, gender: 'Unissex' },
          { name: 'Gorro rígido Oficial Superior', size: 'M', color: 'Padrão', quantity: 0, type: '4º A', price: 57.65, discount: 4, gender: 'Unissex' },
          { name: 'Passadeira Cad/CHO/Asp', size: 'Único', color: 'Padrão', quantity: 0, type: '4º A', price: 47.25, discount: 5.5, gender: 'Unissex' },
          { name: 'Passadeira SubTen - par', size: 'Único', color: 'Padrão', quantity: 0, type: '4º A', price: 47.25, discount: 5.5, gender: 'Unissex' },
          { name: 'Passadeira 2º Ten - par', size: 'Único', color: 'Padrão', quantity: 0, type: '4º A', price: 52.00, discount: 5.5, gender: 'Unissex' },
          { name: 'Passadeira 1º Ten - par', size: 'Único', color: 'Padrão', quantity: 0, type: '4º A', price: 56.70, discount: 5.5, gender: 'Unissex' },
          { name: 'Passadeira Cap - par', size: 'Único', color: 'Padrão', quantity: 0, type: '4º A', price: 61.50, discount: 5.5, gender: 'Unissex' },
          { name: 'Passadeira Maj - par', size: 'Único', color: 'Padrão', quantity: 0, type: '4º A', price: 66.15, discount: 5.5, gender: 'Unissex' },
          { name: 'Passadeira Ten Cel - par', size: 'Único', color: 'Padrão', quantity: 0, type: '4º A', price: 71.00, discount: 5.5, gender: 'Unissex' },
          { name: 'Passadeira Cel - par', size: 'Único', color: 'Padrão', quantity: 0, type: '4º A', price: 71.00, discount: 5.5, gender: 'Unissex' },
          { name: 'Cinto vermelho', size: 'M', color: 'Vermelho', quantity: 0, type: '4º A', price: 41.90, discount: 2.5, gender: 'Unissex' },
          { name: 'Chapéu de selva', size: 'M', color: 'Padrão', quantity: 0, type: '4º A', price: 79.90, discount: 0, gender: 'Unissex' },
          { name: 'Platina Cad/CHO/Asp - par', size: 'Único', color: 'Padrão', quantity: 0, type: '3º A', price: 61.50, discount: 5.5, gender: 'Unissex' },
          { name: 'Platina SubTen - par', size: 'Único', color: 'Padrão', quantity: 0, type: '3º A', price: 61.50, discount: 5.5, gender: 'Unissex' },
          { name: 'Platina 2º Ten - par', size: 'Único', color: 'Padrão', quantity: 0, type: '3º A', price: 66.15, discount: 5.5, gender: 'Unissex' },
          { name: 'Platina 1º Ten - par', size: 'Único', color: 'Padrão', quantity: 0, type: '3º A', price: 71.00, discount: 5.5, gender: 'Unissex' },
          { name: 'Platina Cap - par', size: 'Único', color: 'Padrão', quantity: 0, type: '3º A', price: 80.00, discount: 6, gender: 'Unissex' },
          { name: 'Platina Maj - par', size: 'Único', color: 'Padrão', quantity: 0, type: '3º A', price: 80.00, discount: 6, gender: 'Unissex' },
          { name: 'Platina Ten Cel - par', size: 'Único', color: 'Padrão', quantity: 0, type: '3º A', price: 85.00, discount: 5.5, gender: 'Unissex' },
          { name: 'Platina Cel - par', size: 'Único', color: 'Padrão', quantity: 0, type: '3º A', price: 85.00, discount: 5.5, gender: 'Unissex' },
          { name: 'Segunda pele sem bordar', size: 'M', color: 'Padrão', quantity: 0, type: '5º A/B', price: 74.90, discount: 0, gender: 'Unissex' },
          { name: 'Tensor preto', size: 'M', color: 'Preto', quantity: 0, type: '5º A/B', price: 41.90, discount: 7, gender: 'Unissex' },
          { name: 'Top preto', size: 'M', color: 'Preto', quantity: 0, type: '5º A/B', price: 52.40, discount: 4.5, gender: 'Unissex' },
          { name: 'Machadinha - par', size: 'Único', color: 'Padrão', quantity: 0, type: '3º A', price: 14.70, discount: 2, gender: 'Unissex' },
          { name: 'Boina Defenser', size: 'M', color: 'Padrão', quantity: 0, type: '3º A', price: 187.00, discount: 0, gender: 'Unissex' },
          { name: 'Boina Lyon/Pralana', size: 'M', color: 'Padrão', quantity: 0, type: '3º A', price: 143.00, discount: 0, gender: 'Unissex' },
          { name: 'Florão para boina CFO/CHO', size: 'Único', color: 'Padrão', quantity: 0, type: '3º A', price: 58.40, discount: 0, gender: 'Unissex' },
          { name: 'Machadão', size: 'Único', color: 'Padrão', quantity: 0, type: '1º e 2º A', price: 19.00, discount: 5, gender: 'Unissex' },
          { name: 'Florão para quepe CFO/CHO', size: 'Único', color: 'Padrão', quantity: 0, type: '1º e 2º A', price: 85.40, discount: 0, gender: 'Unissex' },
          { name: 'Luva preta de couro', size: 'P', color: 'Preto', quantity: 0, type: 'Acessórios', price: 99.90, discount: 0, gender: 'Unissex' },
          { name: 'Luva preta de couro', size: 'M', color: 'Preto', quantity: 0, type: 'Acessórios', price: 99.90, discount: 0, gender: 'Unissex' },
          { name: 'Luva preta de couro', size: 'G', color: 'Preto', quantity: 0, type: 'Acessórios', price: 99.90, discount: 0, gender: 'Unissex' },
          { name: 'Cantil', size: 'Único', color: 'Padrão', quantity: 0, type: 'Acessórios', price: 27.90, discount: 0, gender: 'Unissex' },
          { name: 'Capa de cantil', size: 'Único', color: 'Padrão', quantity: 0, type: 'Acessórios', price: 39.90, discount: 0, gender: 'Unissex' },
          { name: 'Hinário', size: 'Único', color: 'Padrão', quantity: 0, type: 'Acessórios', price: 7.00, discount: 0, gender: 'Unissex' },
          { name: 'Touca de natação', size: 'Único', color: 'Padrão', quantity: 0, type: 'Acessórios', price: 27.50, discount: 0, gender: 'Unissex' },
          { name: 'Par de meião preto', size: 'Único', color: 'Preto', quantity: 0, type: 'Outros', price: 16.50, discount: 0, gender: 'Unissex' },
        ];
        
        for (const it of newItems) {
            const { data } = await supabase.from('inventory').select('id').eq('name', it.name).maybeSingle();
            if (!data) await supabase.from('inventory').insert(it);
        }
      } catch (e) {}
    };
    updateDB();
  }, []);

  const handleSeedInventory = useCallback(async () => {
    const fardamentoItems = [
      { name: '3º A Completo', size: 'M', color: 'Padrão', quantity: 999, type: '3º A', price: 260.00, discount: 2 },
      { name: 'Camisa 3º A', size: 'M', color: 'Padrão', quantity: 999, type: '3º A', price: 118.00, discount: 1.5 },
      { name: 'Calça 3º A', size: 'M', color: 'Padrão', quantity: 999, type: '3º A', price: 142.00, discount: 2 },
      { name: 'Machadinha - par', size: 'Único', color: 'Padrão', quantity: 999, type: '3º A', price: 14.70, discount: 2 },
      { name: 'Boina Defenser', size: 'M', color: 'Padrão', quantity: 999, type: '3º A', price: 187.00, discount: 0 },
      { name: 'Boina Lyon/Pralana', size: 'M', color: 'Padrão', quantity: 999, type: '3º A', price: 143.00, discount: 0 },
      { name: 'Florão para boina CFO/CHO', size: 'Único', color: 'Padrão', quantity: 999, type: '3º A', price: 58.40, discount: 0 },
      { name: 'Platina Cad/CHO/Asp - par', size: 'Único', color: 'Padrão', quantity: 999, type: '3º A', price: 61.50, discount: 5.5 },
      { name: 'Platina SubTen - par', size: 'Único', color: 'Padrão', quantity: 999, type: '3º A', price: 61.50, discount: 5.5 },
      { name: 'Platina 2º Ten - par', size: 'Único', color: 'Padrão', quantity: 999, type: '3º A', price: 66.15, discount: 5.5 },
      { name: 'Platina 1º Ten - par', size: 'Único', color: 'Padrão', quantity: 999, type: '3º A', price: 71.00, discount: 5.5 },
      { name: 'Platina Cap - par', size: 'Único', color: 'Padrão', quantity: 999, type: '3º A', price: 80.00, discount: 6 },
      { name: 'Platina Maj - par', size: 'Único', color: 'Padrão', quantity: 999, type: '3º A', price: 80.00, discount: 6 },
      { name: 'Platina Ten Cel - par', size: 'Único', color: 'Padrão', quantity: 999, type: '3º A', price: 85.00, discount: 5.5 },
      { name: 'Platina Cel - par', size: 'Único', color: 'Padrão', quantity: 999, type: '3º A', price: 85.00, discount: 5.5 },
      { name: 'Meião preto com logo do bombeiro (par)', size: 'Único', color: 'Preto', quantity: 999, type: 'Meias', price: 20.79, discount: 0 },
      { name: 'Gorro flexível 4º A', size: 'M', color: 'Padrão', quantity: 999, type: '4º A', price: 37.70, discount: 5.5 },
      { name: 'Gorro rígido Oficial Superior', size: 'M', color: 'Padrão', quantity: 999, type: '4º A', price: 57.65, discount: 4 },
      { name: 'Gorro flexível Oficial Superior', size: 'M', color: 'Padrão', quantity: 999, type: '4º A', price: 48.20, discount: 3.5 },
      { name: 'Tarjeta (3 unidades)', size: 'Único', color: 'Padrão', quantity: 999, type: '4º A', price: 29.40, discount: 3 },
      { name: 'Par de Divisas', size: 'Único', color: 'Padrão', quantity: 999, type: '4º A', price: 11.00, discount: 8 },
      { name: '4º A Completo', size: 'M', color: 'Padrão', quantity: 999, type: '4º A', price: 430.00, discount: 6.5 },
      { name: 'Calça 4º A', size: 'M', color: 'Padrão', quantity: 999, type: '4º A', price: 205.00, discount: 5 },
      { name: 'Joelheira 4º A (par)', size: 'Único', color: 'Preto', quantity: 999, type: '4º A', price: 50.00, discount: 9 },
      { name: 'Gorro rígido 4º A', size: 'M', color: 'Padrão', quantity: 999, type: '4º A', price: 54.00, discount: 0 },
      { name: 'Passadeira Cad/CHO/Asp', size: 'Único', color: 'Padrão', quantity: 999, type: '4º A', price: 47.25, discount: 5.5 },
      { name: 'Passadeira SubTen - par', size: 'Único', color: 'Padrão', quantity: 999, type: '4º A', price: 47.25, discount: 5.5 },
      { name: 'Passadeira 2º Ten - par', size: 'Único', color: 'Padrão', quantity: 999, type: '4º A', price: 52.00, discount: 5.5 },
      { name: 'Passadeira 1º Ten - par', size: 'Único', color: 'Padrão', quantity: 999, type: '4º A', price: 56.70, discount: 5.5 },
      { name: 'Passadeira Cap - par', size: 'Único', color: 'Padrão', quantity: 999, type: '4º A', price: 61.50, discount: 5.5 },
      { name: 'Passadeira Maj - par', size: 'Único', color: 'Padrão', quantity: 999, type: '4º A', price: 66.15, discount: 5.5 },
      { name: 'Passadeira Ten Cel - par', size: 'Único', color: 'Padrão', quantity: 999, type: '4º A', price: 71.00, discount: 5.5 },
      { name: 'Passadeira Cel - par', size: 'Único', color: 'Padrão', quantity: 999, type: '4º A', price: 71.00, discount: 5.5 },
      { name: 'Cinto vermelho', size: 'M', color: 'Vermelho', quantity: 999, type: '4º A', price: 41.90, discount: 2.5 },
      { name: 'Chapéu de selva', size: 'M', color: 'Padrão', quantity: 999, type: '4º A', price: 79.90, discount: 0 },
      { name: '5º B Bordado', size: 'M', color: 'Padrão', quantity: 999, type: '5º A/B', price: 225.00, discount: 10 },
      { name: '5º B sem Bordado', size: 'M', color: 'Padrão', quantity: 999, type: '5º A/B', price: 220.00, discount: 8.5 },
      { name: 'Camisa Vermelha Bordada', size: 'M', color: 'Vermelho', quantity: 999, type: '5º A/B', price: 50.00, discount: 9 },
      { name: 'Camisa Vermelha sem Bordado', size: 'M', color: 'Vermelho', quantity: 999, type: '5º A/B', price: 45.00, discount: 10 },
      { name: 'Short', size: 'M', color: 'Padrão', quantity: 999, type: '5º A/B', price: 32.00, discount: 8.5 },
      { name: 'Sunga', size: 'M', color: 'Padrão', quantity: 999, type: '5º A/B', price: 55.00, discount: 8 },
      { name: 'Maiô', size: 'M', color: 'Padrão', quantity: 999, type: '5º A/B', price: 97.00 },
      { name: 'Suquini', size: 'M', color: 'Padrão', quantity: 999, type: '5º A/B', price: 99.00 },
      { name: 'Segunda Pele Bordada', size: 'M', color: 'Padrão', quantity: 999, type: '5º A/B', price: 82.00, discount: 3.5 },
      { name: 'Segunda pele sem bordar', size: 'M', color: 'Padrão', quantity: 999, type: '5º A/B', price: 74.90, discount: 0 },
      { name: 'Tensor preto', size: 'M', color: 'Preto', quantity: 999, type: '5º A/B', price: 41.90, discount: 7 },
      { name: 'Top preto', size: 'M', color: 'Preto', quantity: 999, type: '5º A/B', price: 52.40, discount: 4.5 },
      { name: 'Camisa 2º A', size: 'M', color: 'Padrão', quantity: 999, type: '1º e 2º A', price: 0.00, discount: 0 },
      { name: 'Túnica 2º A', size: 'M', color: 'Padrão', quantity: 999, type: '1º e 2º A', price: 0.00, discount: 0 },
      { name: 'Machadão', size: 'Único', color: 'Padrão', quantity: 999, type: '1º e 2º A', price: 19.00, discount: 5 },
      { name: 'Florão para quepe CFO/CHO', size: 'Único', color: 'Padrão', quantity: 999, type: '1º e 2º A', price: 85.40, discount: 0 },
      { name: 'Luva preta de couro', size: 'P', color: 'Preto', quantity: 999, type: 'Acessórios', price: 99.90, discount: 0 },
      { name: 'Luva preta de couro', size: 'M', color: 'Preto', quantity: 999, type: 'Acessórios', price: 99.90, discount: 0 },
      { name: 'Luva preta de couro', size: 'G', color: 'Preto', quantity: 999, type: 'Acessórios', price: 99.90, discount: 0 },
      { name: 'Cantil', size: 'Único', color: 'Padrão', quantity: 999, type: 'Acessórios', price: 27.90, discount: 0 },
      { name: 'Capa de cantil', size: 'Único', color: 'Padrão', quantity: 999, type: 'Acessórios', price: 39.90, discount: 0 },
      { name: 'Hinário', size: 'Único', color: 'Padrão', quantity: 999, type: 'Acessórios', price: 7.00, discount: 0 },
      { name: 'Touca de natação', size: 'Único', color: 'Padrão', quantity: 999, type: 'Acessórios', price: 27.50, discount: 0 },
      { name: 'Par de meião preto', size: 'Único', color: 'Preto', quantity: 999, type: 'Outros', price: 16.50, discount: 0 }
    ];

    try {
      console.log('Inserting fardamento items...');
      const { error } = await supabase
        .from('inventory')
        .upsert(fardamentoItems.map(item => ({
          name: item.name,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          type: item.type,
          price: item.price,
          discount: item.discount,
          gender: 'Unissex'
        })), { onConflict: 'name,size,color,gender' });

      if (error) throw error;

      const invData = await dataService.getInventory();

      const hasFardamento = invData.some(i => i.type === '4º A' || i.type === '3º A' || i.type === '5º A/B');
      if (!hasFardamento || invData.length === 0) {
        await handleSeedInventory();
      } else {
        setInventory(invData);
      }
    } catch (error: any) {
      console.error('Error seeding inventory:', error);
      setGlobalError('Erro ao cadastrar itens automaticamente: ' + (error.message || 'Erro desconhecido'));
    }
  }, []);

  const handleSeedTeam = useCallback(async () => {
    const officialMembers = [
      { name: 'Cad Barreto', role: 'CFO III', active: true },
      { name: 'Cad Carneiro', role: 'CFO III', active: true },
      { name: 'Cad Natália Machado', role: 'CFO III', active: true },
      { name: 'Cad Araújo', role: 'CFO II', active: true },
      { name: 'Cad Bahia', role: 'CFO II', active: true },
      { name: 'Cad Lima', role: 'CFO II', active: true },
      { name: 'Cad Azalim', role: 'CFO II', active: true },
      { name: 'Cad Samir', role: 'CFO II', active: true }
    ];

    try {
      for (const member of officialMembers) {
        await dataService.addTeamMember(member as any);
      }
      // Note: loadData is not available here yet if declared after, but we can call loadData manually or wait for effect
      const [invData, salesData] = await Promise.all([
        dataService.getInventory(),
        dataService.getSales()
      ]);
      setInventory(invData);
      setSales(salesData);
      alert('Vendedores cadastrados com sucesso! ✅');
    } catch (error: any) {
      console.error('Error seeding team:', error);
      alert('Erro ao cadastrar: ' + (error.message || 'Erro desconhecido'));
    }
  }, []);

  // Load data from Supabase
  const loadData = useCallback(async () => {
    // If we're on public consultation, we need inventory even without login
    const needsInventory = currentView === View.PRICE_LIST || currentView === View.INVENTORY_CONSULTATION;
    if (!user && !needsInventory) return;
    setDataLoading(true);
    try {
      const [invData, salesData] = await Promise.all([
        dataService.getInventory(),
        user ? dataService.getSales() : Promise.resolve([])
      ]);
      setInventory(invData);
      setSales(salesData);
      setGlobalError(null);

      // Auto-populate inventory if empty
      if (invData.length === 0) {
        console.log('Inventory is empty, triggering auto-seed...');
        await handleSeedInventory();
      }

      // Fetch team separately
      try {
        const teamData = await dataService.getTeam();
        setTeam(teamData);
        setTeamError(null);

        // Auto-populate if empty and no error
        if (teamData.length === 0) {
          console.log('Team is empty, triggering auto-seed...');
          await handleSeedTeam(); // Await the seeding process
        }
      } catch (err: any) {
        console.error('Error loading team data:', err);
        if (err.message?.includes('relation "public.team" does not exist') || err.message?.includes('relation "team" does not exist')) {
          setTeamError('A tabela "team" não foi encontrada. Por favor, execute o SQL no Supabase.');
        } else {
          setTeamError('Erro ao carregar equipe.');
        }
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      const msg = error.message || '';
      if (msg.includes('relation "public.inventory" does not exist') || msg.includes('relation "inventory" does not exist')) {
        setGlobalError('A tabela "inventory" não foi encontrada no banco de dados.');
      } else if (msg.includes('relation "public.sales" does not exist') || msg.includes('relation "sales" does not exist')) {
        setGlobalError('A tabela "sales" não foi encontrada no banco de dados.');
      } else if (msg.includes('relation "public.sale_items" does not exist') || msg.includes('relation "sale_items" does not exist')) {
        setGlobalError('A tabela "sale_items" não foi encontrada no banco de dados.');
      } else {
        setGlobalError('Erro técnico: ' + (error.message || 'Falha na conexão com Supabase'));
      }
    } finally {
      setDataLoading(false);
    }
  }, [user, currentView, handleSeedInventory, handleSeedTeam]);

  useEffect(() => {
    loadData();
  }, [loadData, currentView]);

  const navigate = (view: View) => {
    window.location.hash = view;
    setCurrentView(view);
  };

  // Expose navigate to window for Login.tsx buttons
  useEffect(() => {
    (window as any).navigate = navigate;
  }, []);

  const handleUpdateInventory = async (newItem: InventoryItem) => {
    try {
      const updated = await dataService.updateInventoryItem(newItem);
      setInventory(prev => {
        const exists = prev.find(i => i.id === updated.id);
        if (exists) return prev.map(i => i.id === updated.id ? updated : i);
        return [...prev, updated];
      });
    } catch (error: any) {
      console.error('Error updating inventory:', error);
      alert(`Erro ao atualizar estoque: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleDeleteItem = async (ids: string | string[]) => {
    const idList = Array.isArray(ids) ? ids : [ids];
    if (idList.length === 0) return;

    const message = idList.length > 1
      ? `Deseja excluir todos os ${idList.length} itens deste produto?`
      : 'Deseja excluir este item?';

    if (!confirm(message)) return;

    try {
      await dataService.deleteInventoryItems(idList);
      setInventory(prev => prev.filter(i => !idList.includes(i.id)));
    } catch (error: any) {
      console.error('Error deleting items:', error);
      let errorMsg = `Erro ao excluir item(ns): ${error.message || 'Erro desconhecido'}`;
      if (error.code === '23503') {
        errorMsg = 'Não foi possível excluir. Verifique se existem registros dependentes.';
      }
      alert(errorMsg);
    }
  };

  const handleAddSale = async (sale: SaleRecord) => {
    try {
      await dataService.addSale(sale);
      await loadData();
      alert("Venda registrada com sucesso!");
      navigate(View.HOME);
    } catch (error) {
      console.error('Error adding sale:', error);
      alert('Erro ao registrar venda.');
    }
  };

  const handleAddTeamMember = async (member: Partial<TeamMember>) => {
    try {
      const newMember = await dataService.addTeamMember(member);
      setTeam(prev => [...prev, newMember]);
    } catch (error) {
      console.error('Error adding team member:', error);
      alert('Erro ao adicionar membro.');
    }
  };

  const handleDeleteTeamMember = async (id: string) => {
    if (!confirm('Deseja remover este membro da equipe?')) return;
    try {
      await dataService.deleteTeamMember(id);
      setTeam(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting team member:', error);
      alert('Erro ao remover membro.');
    }
  };

  const needsData = user || currentView === View.PRICE_LIST || currentView === View.INVENTORY_CONSULTATION;
  if (authLoading || (dataLoading && inventory.length === 0 && needsData)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (currentView === View.PRICE_LIST) return <PriceConsultation inventory={inventory} onBack={() => navigate(View.HOME)} />;
    if (currentView === View.PAYMENT_LOOKUP) return <PaymentConsultation onBack={() => navigate(View.HOME)} />;
    if (currentView === View.INVENTORY_CONSULTATION) return <InventoryConsultation inventory={inventory} onBack={() => navigate(View.HOME)} />;
    return <Login />;
  }


  const handleDeleteSale = async (id: string) => {
    try {
      await dataService.deleteSale(id);
      const salesData = await dataService.getSales();
      setSales(salesData);
      const invData = await dataService.getInventory();
      setInventory(invData);
    } catch (error: any) {
      console.error('Error deleting sale:', error);
      setGlobalError('Erro ao excluir venda: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case View.HOME:
        return <Home navigate={navigate} inventory={inventory} sales={sales} />;
      case View.SALES:
        return <Sales onBack={() => navigate(View.HOME)} inventory={inventory} team={team} onAddSale={handleAddSale} />;
      case View.INVENTORY:
        return <Inventory inventory={inventory} onUpdate={handleUpdateInventory} onDelete={handleDeleteItem} />;
      case View.REPORTS:
        return <Reports sales={sales} inventory={inventory} onDeleteSale={handleDeleteSale} onRefresh={loadData} />;
      case View.TEAM:
        return <Team
          onBack={() => navigate(View.HOME)}
          team={team}
          error={teamError}
          onAdd={handleAddTeamMember}
          onDelete={handleDeleteTeamMember}
          onSeed={handleSeedTeam}
        />;
      default:
        return <Home navigate={navigate} inventory={inventory} sales={sales} />;
    }
  };

  return (
    <Layout currentView={currentView} navigate={navigate} onLogout={signOut}>
      {globalError && (
        <div className="mx-4 mt-4 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl">
          <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
            <span className="material-symbols-outlined">error</span>
            <div>
              <p className="text-sm font-bold">{globalError}</p>
              <p className="text-xs opacity-80 mt-1">Por favor, execute o script SQL de criação das tabelas no Supabase.</p>
            </div>
          </div>
        </div>
      )}
      {renderContent()}
    </Layout>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
