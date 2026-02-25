
import React, { useState, useEffect, useCallback } from 'react';
import { View, InventoryItem, SaleRecord, TeamMember } from './types';
import Home from './screens/Home';
import Sales from './screens/Sales';
import Inventory from './screens/Inventory';
import Reports from './screens/Reports';
import Team from './screens/Team';
import Login from './screens/Login';
import Layout from './Layout';
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

  // Load data from Supabase
  const loadData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [invData, salesData] = await Promise.all([
        dataService.getInventory(),
        dataService.getSales()
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
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const navigate = (view: View) => {
    window.location.hash = view;
    setCurrentView(view);
  };

  const handleUpdateInventory = async (newItem: InventoryItem) => {
    try {
      const updated = await dataService.updateInventoryItem(newItem);
      setInventory(prev => {
        const exists = prev.find(i => i.id === updated.id);
        if (exists) return prev.map(i => i.id === updated.id ? updated : i);
        return [...prev, updated];
      });
    } catch (error) {
      console.error('Error updating inventory:', error);
      alert('Erro ao atualizar estoque.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Deseja excluir este item?')) return;
    try {
      await dataService.deleteInventoryItem(id);
      setInventory(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Erro ao excluir item.');
    }
  };

  const handleAddSale = async (sale: SaleRecord) => {
    try {
      await dataService.addSale(sale);
      await loadData();
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

  if (authLoading || (user && dataLoading && inventory.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleSeedInventory = async () => {
    const fardamentoItems = [
      { name: '4º A Completo', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento' as const, price: 408.45, discount: 11 },
      { name: 'Calça 4º A', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento' as const, price: 209.00, discount: 3 },
      { name: 'Joelheira 4º A (par)', size: 'Único', color: 'Preto', quantity: 10, type: 'Fardamento' as const, price: 47.15, discount: 14 },
      { name: 'Gorro rígido 4º A', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento' as const, price: 44.00, discount: 12 },
      { name: 'Gorro flexível 4º A', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento' as const, price: 37.70, discount: 5 },
      { name: 'Tarjeta (3 unidades)', size: 'Único', color: 'Padrão', quantity: 10, type: 'Fardamento' as const, price: 29.40, discount: 2 },
      { name: '5º B Bordado', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento' as const, price: 199.40, discount: 20 },
      { name: '5º B sem Bordado', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento' as const, price: 194.15, discount: 9 },
      { name: 'Camisa Vermelha Bordada', size: 'M', color: 'Vermelho', quantity: 10, type: 'Fardamento' as const, price: 52.40, discount: 5 },
      { name: 'Camisa Vermelha sem Bordado', size: 'M', color: 'Vermelho', quantity: 10, type: 'Fardamento' as const, price: 47.15, discount: 5 },
      { name: 'Short', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento' as const, price: 31.40, discount: 10 },
      { name: 'Sunga', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento' as const, price: 52.40, discount: 12 },
      { name: 'Maiô', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento' as const, price: 97.00, discount: 0 },
      { name: 'Suquini', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento' as const, price: 100.00, discount: 0 },
      { name: 'Segunda Pele Bordada', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento' as const, price: 83.90, discount: 1 },
      { name: '3º A', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento' as const, price: 264.90, discount: 0 },
      { name: 'Camisa 3º A', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento' as const, price: 119.90, discount: 0 },
      { name: 'Calça 3º A', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento' as const, price: 145.00, discount: 0 }
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
          discount: item.discount
        })), { onConflict: 'name,size,color' });

      if (error) throw error;

      const invData = await dataService.getInventory();

      const hasFardamento = invData.some(i => i.type === 'Fardamento');
      if (!hasFardamento) {
        await handleSeedInventory();
      } else {
        setInventory(invData);
      }
    } catch (error: any) {
      console.error('Error seeding inventory:', error);
      setGlobalError('Erro ao cadastrar itens automaticamente: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleSeedTeam = async () => {
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
      await loadData();
      alert('Vendedores cadastrados com sucesso! ✅');
    } catch (error: any) {
      console.error('Error seeding team:', error);
      alert('Erro ao cadastrar: ' + (error.message || 'Erro desconhecido'));
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
        return <Reports sales={sales} />;
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
