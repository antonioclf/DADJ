
import React, { useState, useMemo, useRef } from 'react';
import { InventoryItem } from '../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Header from '../ui/Header';
import Modal from '../ui/Modal';

interface InventoryProps {
  inventory: InventoryItem[];
  onUpdate: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

const Inventory: React.FC<InventoryProps> = ({ inventory, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<InventoryItem> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filters = ['Todos', 'Camiseta', 'Baby Look', 'Moletom', 'Acessório'];

  const filteredItems = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.color.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === 'Todos' || item.type === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [inventory, searchTerm, activeFilter]);

  const handleOpenAdd = () => {
    setEditingItem({
      id: Date.now().toString(),
      name: '',
      size: 'M',
      color: '',
      quantity: 0,
      price: 0,
      type: 'Camiseta',
      image: ''
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingItem && editingItem.name) {
      onUpdate(editingItem as InventoryItem);
      setIsModalOpen(false);
      setEditingItem(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingItem(prev => prev ? { ...prev, image: reader.result as string } : null);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen">
      <Header title="Controle de Estoque" icon="inventory_2" />

      <div className="px-4 py-4 space-y-4">
        <Input
          icon="search"
          placeholder="Pesquisar fardamento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
        />

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl px-5 text-sm font-bold transition-all whitespace-nowrap ${activeFilter === filter
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-slate-100 dark:border-slate-700'
                }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <main className="px-4 pb-32">
        <div className="flex items-center justify-between mb-4 mt-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Itens em Estoque</h2>
          <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-400 uppercase tracking-wider">Total: {filteredItems.length} tipos</span>
        </div>

        <div className="space-y-3">
          {filteredItems.map(item => (
            <div key={item.id} className="flex items-center p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:border-primary/30 transition-all group relative overflow-hidden">
              <div className="size-14 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mr-4 border border-slate-100 dark:border-slate-700 text-primary group-hover:scale-105 transition-transform overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined">{item.type === 'Moletom' ? 'apparel' : item.type === 'Acessório' ? 'diamond' : 'checkroom'}</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#111318] dark:text-white text-sm">{item.name}</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider opacity-70">Tamanho: {item.size} • {item.color}</p>
                <p className="text-primary font-bold text-xs mt-1">R$ {item.price.toFixed(2)}</p>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <span className={`text-xl font-bold ${item.quantity === 0 ? 'text-rose-500' :
                  item.quantity < 5 ? 'text-amber-500' : 'text-primary'
                  }`}>
                  {item.quantity.toString().padStart(2, '0')}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="text-slate-400 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button onClick={() => onDelete(item.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="py-20 text-center opacity-50 text-gray-500">
              <span className="material-symbols-outlined text-4xl mb-2">inventory</span>
              <p className="text-sm font-medium">Nenhum item encontrado</p>
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40">
        <Button onClick={handleOpenAdd} className="w-full">
          <span className="material-symbols-outlined">add_circle</span>
          Novo Fardamento
        </Button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Gerenciar Fardamento"
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="size-32 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden cursor-pointer group hover:border-primary transition-colors"
            >
              {editingItem?.image ? (
                <img src={editingItem.image} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-slate-400 group-hover:text-primary">
                  <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                  <span className="text-[10px] font-bold uppercase mt-1">Foto</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nome do Item"
              className="col-span-2"
              value={editingItem?.name || ''}
              onChange={e => setEditingItem(prev => prev ? { ...prev, name: (e.target as HTMLInputElement).value } : null)}
            />
            <Input
              label="Cor"
              value={editingItem?.color || ''}
              onChange={e => setEditingItem(prev => prev ? { ...prev, color: (e.target as HTMLInputElement).value } : null)}
            />
            <Input
              label="Tamanho"
              as="select"
              value={editingItem?.size || 'M'}
              onChange={e => setEditingItem(prev => prev ? { ...prev, size: (e.target as HTMLSelectElement).value } : null)}
            >
              {['PP', 'P', 'M', 'G', 'GG', 'XG', 'Único'].map(s => <option key={s} value={s}>{s}</option>)}
            </Input>
            <Input
              label="Quantidade"
              type="number"
              value={editingItem?.quantity || 0}
              onChange={e => setEditingItem(prev => prev ? { ...prev, quantity: parseInt((e.target as HTMLInputElement).value) || 0 } : null)}
            />
            <Input
              label="Preço (R$)"
              type="number"
              value={editingItem?.price || 0}
              onChange={e => setEditingItem(prev => prev ? { ...prev, price: parseFloat((e.target as HTMLInputElement).value) || 0 } : null)}
            />
            <Input
              label="Categoria"
              as="select"
              className="col-span-2"
              value={editingItem?.type || 'Camiseta'}
              onChange={e => setEditingItem(prev => prev ? { ...prev, type: (e.target as HTMLSelectElement).value as any } : null)}
            >
              {filters.filter(f => f !== 'Todos').map(f => <option key={f} value={f}>{f}</option>)}
            </Input>
          </div>

          <Button onClick={handleSave} className="w-full mt-4">
            Salvar Alterações
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Inventory;
