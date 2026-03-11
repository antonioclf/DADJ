
import React, { useState, useMemo, useRef } from 'react';
import { InventoryItem, InventoryItemType, CATALOG_ITEMS } from '../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Header from '../ui/Header';
import Modal from '../ui/Modal';

interface InventoryProps {
  inventory: InventoryItem[];
  onUpdate: (item: InventoryItem) => void;
  onDelete: (ids: string | string[]) => void;
}

const STANDARD_ITEMS = CATALOG_ITEMS;

const NUMERIC_SIZES = ['36', '38', '40', '42', '44', '46', '48', '50'];
const CAP_SIZES = Array.from({ length: 10 }, (_, i) => (i + 54).toString()); // 54-63
const SMALL_NUMERIC_SIZES = ['0', '1', '2', '3', '4', '5', '6', '7', '8'];
const BOOT_SIZES = Array.from({ length: 12 }, (_, i) => (i + 34).toString()); // 34-45
const DRESS_UNIFORM_SIZES = ['36', '38', '40', '42', '44', '46', '48', '50', '52', '54'];
const STANDARD_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG'];

const getAvailableSizes = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('tarjeta') || n.includes('joelheira') || n.includes('par') || n.includes('unidades')) return ['Único'];
  if (n.includes('calça')) return NUMERIC_SIZES;
  if (n.includes('gorro')) return CAP_SIZES;
  if (n.includes('coturno')) return BOOT_SIZES;
  if (n.includes('meia') || n.includes('meião')) return ['Único'];
  if (n.includes('túnica') || (n.includes('camisa') && n.includes('2º a'))) return DRESS_UNIFORM_SIZES;
  if (n.includes('blusa') || n.includes('gandola') || n.includes('camisa') || n.includes('camiseta') || n.includes('moletom')) {
    if (n.includes('camisa vermelha')) return STANDARD_SIZES;
    return SMALL_NUMERIC_SIZES;
  }
  return STANDARD_SIZES;
};

const Inventory: React.FC<InventoryProps> = ({ inventory, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{
    name: string;
    color: string;
    type: InventoryItemType;
    gender: 'Masculino' | 'Feminino' | 'Unissex';
    price: number;
    discount?: number;
    image?: string;
    sizes: { [key: string]: { id?: string; quantity: number } };
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filters = ['Todos', '1º e 2º A', '3º A', '4º A', '5º A/B', 'Meias', 'Calçados'];

  const groupedInventory = useMemo(() => {
    const groups: {
      [key: string]: {
        name: string,
        color: string,
        type: InventoryItemType,
        price: number,
        discount?: number,
        image?: string,
        items: InventoryItem[]
      }
    } = {};

    inventory.forEach(item => {
      const key = `${item.name}-${item.color}`;
      if (!groups[key]) {
        groups[key] = {
          name: item.name,
          color: item.color,
          type: item.type,
          price: item.price,
          discount: item.discount,
          image: item.image,
          items: []
        };
      }
      groups[key].items.push(item);
    });

    return Object.values(groups).filter(group => {
      const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.color.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === 'Todos' || group.type === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [inventory, searchTerm, activeFilter]);

  const handleOpenAdd = () => {
    const sizes = getAvailableSizes('').reduce((acc, size) => ({ ...acc, [size]: { quantity: 0 } }), {});
    setEditingGroup({
      name: '',
      color: 'Padrão',
      type: 'Fardamento',
      gender: 'Unissex',
      price: 0,
      discount: 0,
      image: '',
      sizes
    });
    setIsModalOpen(true);
  };

  const handleEditGroup = (group: any, gender: string) => {
    const categorySizes = getAvailableSizes(group.name);
    const sizeMap = categorySizes.reduce((acc, size) => {
      const existing = group.items.find((i: any) => i.size === size && (i.gender || 'Unissex') === gender);
      return {
        ...acc,
        [size]: existing ? { id: existing.id, quantity: existing.quantity } : { quantity: 0 }
      };
    }, {});

    setEditingGroup({
      name: group.name,
      color: group.color,
      type: group.type,
      gender: gender as any,
      price: group.price,
      discount: group.discount,
      image: group.image,
      sizes: sizeMap
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (editingGroup && editingGroup.name) {
      setIsSaving(true);
      try {
        const updates = Object.entries(editingGroup.sizes)
          .filter(([_, data]: [string, any]) => data.id || data.quantity >= 0)
          .map(([size, data]: [string, any]) =>
            onUpdate({
              id: data.id || `temp-${size}-${editingGroup.gender}-${Date.now()}`,
              name: editingGroup.name,
              size,
              color: editingGroup.color,
              gender: editingGroup.gender,
              quantity: data.quantity,
              type: editingGroup.type,
              price: editingGroup.price,
              discount: editingGroup.discount || 0,
              image: editingGroup.image || ''
            })
          );

        await Promise.all(updates);
        setIsModalOpen(false);
        setEditingGroup(null);
      } catch (err) {
        console.error("Erro ao salvar estoque:", err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSelectStandard = (name: string) => {
    const standard = STANDARD_ITEMS.find(s => s.name === name);
    if (standard && editingGroup) {
      const newSizes: { [key: string]: { quantity: number } } = {};
      const categorySizes = getAvailableSizes(standard.name);
      categorySizes.forEach(s => newSizes[s] = { quantity: 0 });

      setEditingGroup({
        ...editingGroup,
        name: standard.name,
        type: standard.type,
        price: standard.price,
        color: standard.color,
        gender: 'Masculino',
        sizes: newSizes
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingGroup(prev => prev ? { ...prev, image: reader.result as string } : null);
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
          placeholder="Pesquisar estoque..."
          value={searchTerm}
          onChange={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
        />

        <div className="flex gap-2 overflow-x-auto pb-4">
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
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Produtos</h2>
          <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-400 uppercase tracking-wider">Total: {groupedInventory.length} tipos</span>
        </div>

        <div className="space-y-4">
          {groupedInventory.map(group => {
            const totalQty = group.items.reduce((sum, i) => sum + i.quantity, 0);
            const genders = Array.from(new Set(group.items.map(i => i.gender || 'Unissex'))) as ('Masculino' | 'Feminino' | 'Unissex')[];

            return (
              <div key={`${group.name}-${group.color}`} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 flex items-center gap-4">
                  <div className="size-14 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 text-primary overflow-hidden">
                    {group.image ? (
                      <img src={group.image} alt={group.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined">{group.type === 'Moletom' ? 'apparel' : group.type === 'Acessório' ? 'diamond' : 'checkroom'}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#111318] dark:text-white text-sm">{group.name}</h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider opacity-70">{group.type} • {group.color}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-primary font-bold text-xs">R$ {group.price.toFixed(2)}</p>
                      {group.discount && group.discount > 0 ? (
                        <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-900/30 text-rose-500 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter">
                          {group.discount}% OFF
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary">{totalQty.toString().padStart(2, '0')}</div>
                    <div className="text-[9px] font-bold uppercase text-slate-400">Total</div>
                  </div>
                </div>

                <div className="px-4 pb-4 space-y-4">
                  {genders.sort((a, b) => a === 'Masculino' ? -1 : 1).map(gender => (
                    <div key={gender} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-xs ${gender === 'Feminino' ? 'text-rose-400' : gender === 'Masculino' ? 'text-blue-400' : 'text-slate-400'}`}>
                          {gender === 'Feminino' ? 'female' : gender === 'Masculino' ? 'male' : 'wc'}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{gender}</span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {getAvailableSizes(group.name).map(size => {
                          const matchingItems = group.items.filter(i => i.size === size && (i.gender || 'Unissex') === gender);
                          const qty = matchingItems.reduce((sum, i) => sum + i.quantity, 0);
                          return (
                            <div key={size} className={`flex flex-col items-center p-2 rounded-xl border ${qty > 0 ? 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700' : 'opacity-30 border-dashed border-slate-200'}`}>
                              <span className="text-[10px] font-black text-slate-400 mb-1">{size}</span>
                              <span className={`text-xs font-bold ${qty === 0 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>{qty}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-end gap-3 pt-1">
                        <button
                          onClick={() => onDelete(group.items.filter(i => (i.gender || 'Unissex') === gender).map(i => i.id))}
                          className="text-[9px] font-bold flex items-center gap-x-1 opacity-50 hover:opacity-100 text-rose-500 transition-all hover:scale-105 active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[10px]">delete</span> EXCLUIR {gender.toUpperCase()}
                        </button>
                        <button onClick={() => handleEditGroup(group, gender)} className="text-[9px] font-bold flex items-center gap-x-1 opacity-60 hover:opacity-100 text-primary transition-all">
                          <span className="material-symbols-outlined text-[10px]">edit</span> EDITAR {gender.toUpperCase()}
                        </button>
                      </div>
                    </div>
                  ))}

                </div>
              </div>
            );
          })}

          {groupedInventory.length === 0 && (
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
          Adicionar ao Estoque
        </Button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Gerenciar Estoque"
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="size-32 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden cursor-pointer group hover:border-primary transition-colors"
            >
              {editingGroup?.image ? (
                <img src={editingGroup.image} alt="Preview" className="w-full h-full object-cover" />
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
            <div className="col-span-2 space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catálogo de Produtos</label>
                <span className="text-[8px] font-bold text-primary px-2 py-0.5 bg-primary/5 rounded-full uppercase">Seleção Rápida</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STANDARD_ITEMS.map(item => (
                  <button
                    key={item.name}
                    onClick={() => handleSelectStandard(item.name)}
                    className={`flex h-12 items-center px-4 rounded-2xl text-[10px] font-bold transition-all border text-left leading-tight ${editingGroup?.name === item.name
                      ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-primary/30'
                      }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Nome Personalizado"
              className="col-span-2"
              value={editingGroup?.name || ''}
              onChange={e => setEditingGroup(prev => prev ? { ...prev, name: (e.target as HTMLInputElement).value } : null)}
            />

            <Input
              label="Categoria"
              as="select"
              value={editingGroup?.type || 'Camiseta'}
              onChange={e => setEditingGroup(prev => prev ? { ...prev, type: (e.target as HTMLSelectElement).value as any } : null)}
            >
              {filters.filter(f => f !== 'Todos').map(f => <option key={f} value={f}>{f}</option>)}
            </Input>

            <Input
              label="Cor"
              value={editingGroup?.color || ''}
              onChange={e => setEditingGroup(prev => prev ? { ...prev, color: (e.target as HTMLInputElement).value } : null)}
            />

            <div className="col-span-2 space-y-4">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider pb-1 ml-1">Gênero</p>
              <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-800 rounded-2xl w-full">
                {['Masculino', 'Feminino', 'Unissex'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setEditingGroup(prev => prev ? { ...prev, gender: g as any } : null)}
                    className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${editingGroup?.gender === g ? 'bg-white dark:bg-slate-700 text-primary shadow-sm border border-slate-100 dark:border-slate-600' : 'text-slate-400 opacity-60'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Preço (R$)"
              type="number"
              value={editingGroup?.price || 0}
              onChange={e => setEditingGroup(prev => prev ? { ...prev, price: parseFloat((e.target as HTMLInputElement).value) || 0 } : null)}
            />
            <Input
              label="Desconto (%)"
              type="number"
              value={editingGroup?.discount || 0}
              onChange={e => setEditingGroup(prev => prev ? { ...prev, discount: parseFloat((e.target as HTMLInputElement).value) || 0 } : null)}
            />

            <div className="col-span-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Quantidades por Tamanho</label>
              <div className="grid grid-cols-4 gap-3">
                {getAvailableSizes(editingGroup?.name || '').map(size => (
                  <div key={size} className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-slate-500 text-center uppercase">{size}</span>
                    <input
                      type="number"
                      className="w-full h-10 rounded-xl bg-white dark:bg-slate-800 border-none text-center text-xs font-bold focus:ring-2 focus:ring-primary shadow-sm"
                      value={editingGroup?.sizes[size]?.quantity || 0}
                      onChange={e => setEditingGroup(prev => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          sizes: {
                            ...prev.sizes,
                            [size]: { ...prev.sizes[size], quantity: parseInt(e.target.value) || 0 }
                          }
                        };
                      })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full mt-4" disabled={isSaving}>
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                Salvando...
              </div>
            ) : 'Salvar no Estoque'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Inventory;
