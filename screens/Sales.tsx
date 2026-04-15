
import React, { useState } from 'react';
import { InventoryItem, SaleRecord, OrderItem, TeamMember, CATALOG_ITEMS } from '../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Header from '../ui/Header';
import Modal from '../ui/Modal';

interface SalesProps {
  onBack: () => void;
  inventory: InventoryItem[];
  team: TeamMember[];
  onAddSale: (sale: SaleRecord) => Promise<void> | void;
}

const Sales: React.FC<SalesProps> = ({ onBack, inventory, team, onAddSale }) => {
  const [seller, setSeller] = useState(team[0]?.name || '');
  const [buyer, setBuyer] = useState('');
  const [buyerBM, setBuyerBM] = useState('');
  const [phone, setPhone] = useState('');
  const [orderStatus, setOrderStatus] = useState<'Pedido no DA' | 'Pedido na loja' | 'Entregue' | 'Pago'>('Pedido no DA');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [selectedSecSizes, setSelectedSecSizes] = useState<Record<string, string>>({});
  const [selectedGenders, setSelectedGenders] = useState<Record<string, 'M' | 'F'>>({});
  const [saleSource, setSaleSource] = useState<'Estoque' | 'Loja'>('Loja');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const filters = ['Todos', '1º e 2º A', '3º A', '4º A', '5º A/B', 'Meias', 'Calçados'];
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPhone = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) return raw;
    if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  };

  const handleAddToCart = (item: InventoryItem, selectedSize?: string) => {
    const discountedPrice = item.price; // Provided price is already the final price
    const size = selectedSize || item.size;

    const existing = cart.find(i => i.inventoryId === item.id && i.size === size);
    if (existing) {
      setCart(cart.map(i => (i.inventoryId === item.id && i.size === size) ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, {
        id: Date.now().toString() + Math.random(),
        inventoryId: item.id,
        name: item.name,
        size: size,
        quantity: 1,
        price: discountedPrice,
        discount: item.discount,
        source: saleSource
      }]);
    }
    setShowItemPicker(false);
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(i => i.id !== id));
  };

  const updateCartItemSize = (id: string, newSize: string) => {
    setCart(cart.map(i => i.id === id ? { ...i, size: newSize } : i));
  };

  const total = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  const handleFinalize = async () => {
    if (!buyer || cart.length === 0) {
      alert("Por favor, preencha o nome do aluno e adicione itens.");
      return;
    }

    const newSale: SaleRecord = {
      id: Date.now().toString(),
      customerName: buyer,
      customerPhone: phone,
      customerBM: buyerBM,
      date: new Date().toLocaleString('pt-BR'),
      items: cart,
      total: total,
      status: orderStatus,
      seller: seller
    };

    setIsSubmitting(true);
    try {
      await onAddSale(newSale);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen">
      <Header title="Vendas de Fardamento" subtitle="Portal de Vendas" onBack={onBack} />

      <div className="px-4 py-6 space-y-6 pb-40">
        {/* Info Form */}
        <section className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-primary/5 space-y-4">
            <Input
              label="Nome do Vendedor"
              as="select"
              value={seller}
              onChange={(e) => setSeller((e.target as HTMLSelectElement).value)}
            >
              {team.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              {team.length === 0 && <option value="">Nenhum vendedor cadastrado</option>}
            </Input>
            <Input
              label="Número BM do Comprador"
              icon="badge"
              placeholder="Número BM do comprador"
              value={buyerBM}
              onChange={(e) => setBuyerBM((e.target as HTMLInputElement).value)}
            />
            <Input
              label="Nome do Aluno (Comprador)"
              placeholder="Ex: João da Silva"
              value={buyer}
              onChange={(e) => setBuyer((e.target as HTMLInputElement).value)}
            />
            <Input
              label="Telefone / WhatsApp"
              icon="call"
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={(e) => setPhone(formatPhone((e.target as HTMLInputElement).value))}
              type="tel"
            />

            <div className="space-y-4">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider pb-1 ml-1">Origem da Venda</p>
              <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-800 rounded-2xl w-full">
                {[
                  { id: 'Estoque', label: 'Estoque (Baixa Automática)', icon: 'inventory_2', color: 'text-primary', bg: 'bg-white dark:bg-slate-700' },
                  { id: 'Loja', label: 'Compra Direta na Loja', icon: 'storefront', color: 'text-emerald-500', bg: 'bg-white dark:bg-slate-700' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSaleSource(s.id as any)}
                    className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${saleSource === s.id ? `${s.bg} ${s.color} shadow-sm border border-slate-100 dark:border-slate-600` : 'text-slate-400 opacity-60'}`}
                  >
                    <span className="material-symbols-outlined text-[18px] font-black">
                      {s.icon}
                    </span>
                    <span className="text-center leading-tight">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider pb-1 ml-1">Status do Pedido</p>
              <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                {[
                  { id: 'Pedido no DA', label: 'Pedido no DA', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'assignment' },
                  { id: 'Pedido na loja', label: 'Pedido na loja', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', icon: 'storefront' },
                  { id: 'Entregue', label: 'Entregue', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'package_2' },
                  { id: 'Pago', label: 'Pago', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'payments' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setOrderStatus(s.id as any)}
                    className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${orderStatus === s.id ? `${s.bg} ${s.color} shadow-sm` : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <span className="material-symbols-outlined text-[16px] font-black">
                      {s.icon}
                    </span>
                    <span className="text-center leading-tight">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Cart */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[#111318] dark:text-white text-md font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">shopping_cart</span>
              Carrinho de Compras
            </h2>
            <Button
              variant="ghost"
              onClick={() => setShowItemPicker(true)}
              className="px-4 py-2 text-xs uppercase tracking-widest"
            >
              Adicionar Item
            </Button>
          </div>

          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center justify-between shadow-sm group">
                <div className="flex items-center gap-3">
                  <div className="size-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">checkroom</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold dark:text-white">{item.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tam: {item.size} • Qtd: {item.quantity}</p>
                      <span className="text-[8px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase">Valor un: R$ {item.price.toFixed(2)}</span>
                      {item.discount && item.discount > 0 && (
                        <span className="text-[8px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-full uppercase shadow-sm">
                          -{item.discount}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold text-primary">R$ {(item.price * item.quantity).toFixed(2)}</p>
                  <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="py-10 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl text-slate-400 text-xs">
                O carrinho está vazio.
              </div>
            )}
          </div>
        </section>

        {/* Final Total */}
        <div className="bg-primary p-6 rounded-[2rem] text-white flex justify-between items-center shadow-xl shadow-primary/25">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Valor Total</p>
            <h2 className="text-2xl font-bold">R$ {total.toFixed(2)}</h2>
          </div>
          <Button
            variant="secondary"
            onClick={handleFinalize}
            disabled={isSubmitting}
            className="bg-white !text-primary px-6 py-3 rounded-2xl font-bold text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Aguarde...' : 'Finalizar'}
          </Button>
        </div>
      </div>

      <Modal
        isOpen={showItemPicker}
        onClose={() => setShowItemPicker(false)}
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
                base: { ...catItem, id: `cat-${catItem.name}-${catItem.color}` } as unknown as InventoryItem,
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
              const is3A = nameLower.includes('3º a') && !nameLower.includes('calça') && !nameLower.includes('camisa');
              const is4A = nameLower.includes('4º a completo');
              const isCalca = nameLower.includes('calça');
              const isGorro = nameLower.includes('gorro') || nameLower.includes('chapéu') || nameLower.includes('boina');
              const isRedShirt = nameLower.includes('camisa vermelha');
              const isOneSize = nameLower.includes('tarjeta') || nameLower.includes('joelheira') || nameLower.includes('divisa') || nameLower.includes('passadeira') || nameLower.includes('platina') || nameLower.includes('machadinha') || nameLower.includes('florão') || nameLower.includes('machadão');
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

                handleAddToCart({
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
                      <span className="text-[10px] uppercase font-black tracking-widest">Adicionar ao Carrinho</span>
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
    </div>
  );
};

export default Sales;
