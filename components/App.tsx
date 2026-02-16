
import React, { useState, useEffect, useCallback } from 'react';
import { View, InventoryItem, SaleRecord } from './types';
import Home from './screens/Home';
import Sales from './screens/Sales';
import Inventory from './screens/Inventory';
import Reports from './screens/Reports';
import Login from './screens/Login';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { dataService } from './lib/dataService';

const AppContent: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

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
    } catch (error) {
      console.error('Error loading data:', error);
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

  const renderContent = () => {
    switch (currentView) {
      case View.HOME:
        return <Home navigate={navigate} inventory={inventory} sales={sales} />;
      case View.SALES:
        return <Sales onBack={() => navigate(View.HOME)} inventory={inventory} onAddSale={handleAddSale} />;
      case View.INVENTORY:
        return <Inventory inventory={inventory} onUpdate={handleUpdateInventory} onDelete={handleDeleteItem} />;
      case View.REPORTS:
        return <Reports sales={sales} />;
      default:
        return <Home navigate={navigate} inventory={inventory} sales={sales} />;
    }
  };

  return (
    <Layout currentView={currentView} navigate={navigate} onLogout={signOut}>
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
