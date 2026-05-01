import React, { useState } from 'react';
import { InventoryItem, CATALOG_ITEMS } from '../types';
import Modal from './Modal';
import Button from './Button';

interface ItemPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  onAddToCart: (item: InventoryItem, size: string) => void;
}

const ItemPickerModal: React.FC<ItemPickerModalProps> = ({ isOpen, onClose, inventory, onAddToCart }) => {
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [selectedSecSizes, setSelectedSecSizes] = useState<Record<string, string>>({});
  const [selectedGenders, setSelectedGenders] = useState<Record<string, 'M' | 'F'>>({});

  const filters = ['Todos', '1º e 2º A', '3º A', '4º A', '5º A/B', 'Meias', 'Calçados', 'Acessórios'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Selecionar Fardamento"
    >
      <div className="space-y-4 pb-10">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            type="text"
            placeholder="Pesquisar fardamento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-10 pr-4 py-3 text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-1 px-1">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex h-8 shrink-0 items-center justify-center rounded-xl px-4 text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === filter
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-slate-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-transparent'
                }`}
            >
              {filter}
            </button>
          ))}
        </div>
        {(() => {
          // Group the actual inventory for quick lookup
          const inventoryGroups: Record<string, InventoryItem[]> = {};
          inventory.forEach(item => {
            const key = `${item.name}-${item.color}`;
            if (!inventoryGroups[key]) inventoryGroups[key] = [];
            inventoryGroups[key].push(item);
          });

          // Map CATALOG_ITEMS to their inventory counterparts
          const catalogWithInventory = CATALOG_ITEMS
            .filter(catItem => {
              const isHidden = (catItem as any).hideFromSales;
              const matchesFilter = activeFilter === 'Todos' || catItem.type === activeFilter || (catItem.name === 'Cinto vermelho' && activeFilter === '3º A');
              const matchesSearch = catItem.name.toLowerCase().includes(searchQuery.toLowerCase());
              return !isHidden && matchesFilter && matchesSearch;
            })
            .map(catItem => ({
              base: { ...catItem, id: `cat-${catItem.name}-${catItem.type}-${catItem.color}` } as unknown as InventoryItem,
              inventoryItems: inventoryGroups[`${catItem.name}-${catItem.color}`] || []
            }));

          return catalogWithInventory.sort((a, b) => {
            const getPriority = (name: string) => {
              const n = name.toLowerCase();
              if (n.includes('price list')) return 0;
              if (n.includes('1º a') || n.includes('2º a')) return 1;
              if (n.includes('3º a')) return 2;
              if (n.includes('4º a') || n.includes('tarjeta') || n.includes('joelheira') || n.includes('gorro')) return 3;
              if (n.includes('5º b')) return 4;
              if (n.includes('camisa vermelha')) return 5;
              if (n.includes('short')) return 6;
              if (n.includes('sunga')) return 7;
              if (n.includes('maiô')) return 8;
              if (n.includes('suquini')) return 9;
              if (n.includes('segunda pele')) return 10;
              if (n.includes('meia') || n.includes('meião')) return 11;
              if (n.includes('coturno')) return 12;
              return 13;
            };
            const pA = getPriority(a.base.name);
            const pB = getPriority(b.base.name);
            if (pA !== pB) return pA - pB;
            return a.base.name.localeCompare(b.base.name);
          }).map(group => {
            const item = group.base;
            const nameLower = item.name.toLowerCase();
            const is3A = (nameLower.includes('3º a') || nameLower.includes('3ºa') || nameLower.includes('3 a')) && !nameLower.includes('calça') && !nameLower.includes('camisa');
            const is4A = nameLower.includes('4º a completo') || nameLower.includes('4ºa completo') || nameLower.includes('4 a completo');
            const isCalca = nameLower.includes('calça');
            const isGorro = nameLower.includes('gorro') || nameLower.includes('chapéu') || nameLower.includes('boina');
            const isRedShirt = nameLower.includes('camisa vermelha');
            const isOneSize = nameLower.includes('tarjeta') || nameLower.includes('joelheira') || nameLower.includes('divisa') || nameLower.includes('passadeira') || nameLower.includes('platina') || nameLower.includes('machadinha') || nameLower.includes('florão') || nameLower.includes('machadão') || nameLower.includes('boné') || nameLower.includes('plaqueta') || nameLower.includes('cinto') || nameLower.includes('cantil') || nameLower.includes('velame');
            const isTop = (nameLower.includes('blusa') || nameLower.includes('gandola') || nameLower.includes('camisa') || nameLower.includes('camiseta') || nameLower.includes('moletom') || nameLower.includes('túnica')) && !isRedShirt;
            const isDressUniform = nameLower.includes('túnica') || (nameLower.includes('camisa') && nameLower.includes('2º a'));
            const isBoot = nameLower.includes('coturno');
            const isComplex = is3A || is4A;

            const gender = selectedGenders[item.id] || 'M';
            const size1 = selectedSizes[item.id] || (isCalca || isDressUniform ? '38' : (isTop ? '2' : (isGorro ? '56' : (isBoot ? '40' : 'M'))));
            const size2 = selectedSecSizes[item.id] || (is3A || is4A ? (is3A ? '2' : '2') : '');

            const effectiveDiscount = group.inventoryItems[0]?.discount ?? item.discount ?? 0;
            const effectivePrice = group.inventoryItems[0]?.price ?? item.price;

            const numericSizes = ['36', '38', '40', '42', '44', '46', '48', '50'];
            const capSizes = Array.from({ length: 10 }, (_, i) => (i + 54).toString()); // 54-63
            const smallNumericSizes = ['0', '1', '2', '3', '4', '5', '6', '7', '8'];
            const bootSizes = Array.from({ length: 12 }, (_, i) => (i + 34).toString()); // 34-45
            const dressUniformSizes = ['36', '38', '40', '42', '44', '46', '48', '50', '52', '54'];
            const standardSizes = ['PP', 'P', 'M', 'G', 'GG', 'EG'];

            const renderSizeButtons = (current: string, options: string[], onSelect: (s: string) => void, label?: string) => (
              <div className="flex-1 min-w-0">
                {label && <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{label}:</p>}
                <div className="flex gap-1 overflow-x-auto pb-1.5">
                  {options.map(size => (
                    <button
                      key={size}
                      onClick={() => onSelect(size)}
                      className={`min-w-[36px] px-2 py-2 rounded-xl text-[10px] font-black transition-all border ${current === size
                        ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700 hover:bg-slate-100'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            );

            const handleAdd = () => {
              let finalSize = size1;
              if (isOneSize) finalSize = item.size || 'Único';
              else if (is3A) finalSize = `C:${size1}${gender} | B:${size2}${gender}`;
              else if (is4A) finalSize = `G:${size2}${gender} | C:${size1}${gender}`;
              else if (isCalca || isTop) finalSize = `${size1}${gender}`;

              // Search for the specific inventory item ID to ensure stock tracking works
              const targetGender = gender === 'F' ? 'Feminino' : 'Masculino';
              const searchSize = (isOneSize || isComplex) ? (group.inventoryItems[0]?.size || 'M') : size1;

              const specificItem = group.inventoryItems.find(i =>
                i.size === searchSize &&
                (i.gender === targetGender || i.gender === 'Unissex')
              );

              onAddToCart({
                ...item,
                price: effectivePrice,
                discount: effectiveDiscount,
                id: specificItem?.id || item.id
              }, finalSize);
            };

            return (
              <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-primary/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                    {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-primary text-2xl">apparel</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black dark:text-white uppercase tracking-tight truncate">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{item.color}</p>
                      {effectiveDiscount > 0 && (
                        <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-lg uppercase shadow-sm">
                          DESC. {effectiveDiscount}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-black text-primary">R$ {effectivePrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex flex-col gap-4">
                  {(isComplex || isCalca || isTop) && !isGorro && !isOneSize && !item.name.includes('par') && !item.name.includes('unidades') && (
                    <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-800 rounded-xl w-fit">
                      <button
                        onClick={() => setSelectedGenders(prev => ({ ...prev, [item.id]: 'M' }))}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${gender === 'M' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}
                      >
                        Masculino
                      </button>
                      <button
                        onClick={() => setSelectedGenders(prev => ({ ...prev, [item.id]: 'F' }))}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${gender === 'F' ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-sm' : 'text-slate-400'}`}
                      >
                        Feminino
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {is3A && (
                      <div className="space-y-3">
                        {renderSizeButtons(size1, numericSizes, (s) => setSelectedSizes(p => ({ ...p, [item.id]: s })), 'Calça')}
                        {renderSizeButtons(size2, smallNumericSizes, (s) => setSelectedSecSizes(p => ({ ...p, [item.id]: s })), 'Blusa')}
                      </div>
                    )}
                    {is4A && (
                      <div className="space-y-3">
                        {renderSizeButtons(size2, smallNumericSizes, (s) => setSelectedSecSizes(p => ({ ...p, [item.id]: s })), 'Gandola')}
                        {renderSizeButtons(size1, numericSizes, (s) => setSelectedSizes(p => ({ ...p, [item.id]: s })), 'Calça')}
                      </div>
                    )}
                    {!isComplex && !isOneSize && renderSizeButtons(
                      size1,
                      isDressUniform ? dressUniformSizes : (isCalca ? numericSizes : (isTop ? smallNumericSizes : (isGorro ? capSizes : (isBoot ? bootSizes : standardSizes)))),
                      (s) => setSelectedSizes({ ...selectedSizes, [item.id]: s }),
                      isComplex ? 'Gandola/Blusa' : 'Tamanho'
                    )}
                    {isOneSize && (
                      <p className="text-[10px] text-slate-400 font-black uppercase italic ml-1 pt-1">Modelo de Tamanho Único</p>
                    )}
                  </div>

                  <Button
                    onClick={handleAdd}
                    className="w-full !rounded-2xl flex items-center justify-center gap-2 h-12 shadow-lg shadow-primary/20"
                  >
                    <span className="material-symbols-outlined font-black text-lg">add_shopping_cart</span>
                    <span className="text-[10px] uppercase font-black tracking-widest">Adicionar Item</span>
                  </Button>
                </div>
              </div>
            );
          });
        })()}
        {inventory.length === 0 && (
          <p className="text-center text-slate-400 py-10 text-sm">Nenhum item em estoque.</p>
        )}
      </div>
    </Modal>
  );
};

export default ItemPickerModal;
