
import React, { useState } from 'react';
import { InventoryItem, SaleRecord, OrderItem, TeamMember } from '../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Header from '../ui/Header';
import Modal from '../ui/Modal';

interface SalesProps {
  onBack: () => void;
  inventory: InventoryItem[];
  team: TeamMember[];
  onAddSale: (sale: SaleRecord) => void;
}

const Sales: React.FC<SalesProps> = ({ onBack, inventory, team, onAddSale }) => {
  const [seller, setSeller] = useState(team[0]?.name || '');
  const [buyer, setBuyer] = useState('');
  const [phone, setPhone] = useState('');
  const [isPaid, setIsPaid] = useState(true);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [selectedSecSizes, setSelectedSecSizes] = useState<Record<string, string>>({});
  const [selectedGenders, setSelectedGenders] = useState<Record<string, 'M' | 'F'>>({});

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
        discount: item.discount
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

  const handleFinalize = () => {
    if (!buyer || cart.length === 0) {
      alert("Por favor, preencha o nome do aluno e adicione itens.");
      return;
    }

    const newSale: SaleRecord = {
      id: Date.now().toString(),
      customerName: buyer,
      customerPhone: phone,
      date: new Date().toLocaleString('pt-BR'),
      items: cart,
      total: total,
      status: isPaid ? 'Pago' : 'Pendente',
      seller: seller
    };

    onAddSale(newSale);
    alert("Venda registrada com sucesso!");
    onBack();
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
              onChange={(e) => setPhone((e.target as HTMLInputElement).value)}
              type="tel"
            />

            <div className="flex flex-col w-full">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider pb-1 ml-1">Status do Pagamento</p>
              <div className="flex gap-2">
                <Button
                  variant={isPaid ? 'primary' : 'ghost'}
                  onClick={() => setIsPaid(true)}
                  className="flex-1 text-xs uppercase tracking-wider py-3"
                >
                  Pago
                </Button>
                <Button
                  variant={!isPaid ? 'primary' : 'ghost'}
                  onClick={() => setIsPaid(false)}
                  className={`flex-1 text-xs uppercase tracking-wider py-3 ${!isPaid ? '!bg-amber-500 !shadow-amber-500/30' : ''}`}
                >
                  Pendente
                </Button>
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
            className="bg-white !text-primary px-6 py-3 rounded-2xl font-bold text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            Finalizar
          </Button>
        </div>
      </div>

      <Modal
        isOpen={showItemPicker}
        onClose={() => setShowItemPicker(false)}
        title="Selecionar Fardamento"
      >
        <div className="space-y-4 pb-10">
          {[...inventory].sort((a, b) => {
            const getPriority = (name: string) => {
              const n = name.toLowerCase();
              if (n.includes('4º a') || n.includes('tarjeta') || n.includes('joelheira') || n.includes('gorro')) return 1;
              if (n.includes('3º a')) return 2;
              if (n.includes('5º b')) return 3;
              if (n.includes('camisa vermelha')) return 4;
              if (n.includes('short')) return 5;
              if (n.includes('sunga')) return 6;
              if (n.includes('maiô')) return 7;
              if (n.includes('suquini')) return 8;
              if (n.includes('segunda pele')) return 9;
              return 10;
            };
            const pA = getPriority(a.name);
            const pB = getPriority(b.name);
            if (pA !== pB) return pA - pB;
            return a.name.localeCompare(b.name);
          }).map(item => {
            const nameLower = item.name.toLowerCase();
            const is3A = nameLower.includes('3º a') && !nameLower.includes('calça') && !nameLower.includes('camisa');
            const is4A = nameLower.includes('4º a completo');
            const isCalca = nameLower.includes('calça');
            const isGorro = nameLower.includes('gorro');
            const isRedShirt = nameLower.includes('camisa vermelha');
            const isOneSize = nameLower.includes('tarjeta') || nameLower.includes('joelheira');
            const isTop = (nameLower.includes('blusa') || nameLower.includes('gandola') || nameLower.includes('camisa') || nameLower.includes('camiseta') || nameLower.includes('moletom')) && !isRedShirt;
            const isComplex = is3A || is4A;

            const gender = selectedGenders[item.id] || 'M';
            const size1 = selectedSizes[item.id] || (isCalca ? '38' : (isTop ? '2' : (isGorro ? '56' : 'M')));
            const size2 = selectedSecSizes[item.id] || (is3A || is4A ? (is3A ? '2' : '2') : '');

            const numericSizes = Array.from({ length: 15 }, (_, i) => (i + 36).toString()); // 36-50
            const capSizes = Array.from({ length: 10 }, (_, i) => (i + 54).toString()); // 54-63
            const smallNumericSizes = ['1', '2', '3', '4', '5'];
            const standardSizes = ['PP', 'P', 'M', 'G', 'GG', 'EG'];

            const renderSizeButtons = (current: string, options: string[], onSelect: (s: string) => void, label?: string) => (
              <div className="flex-1 min-w-0">
                {label && <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{label}:</p>}
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
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
              if (isOneSize) finalSize = item.size; // Use 'Único' or whatever is in DB
              else if (is3A) finalSize = `C:${size1}${gender} | B:${size2}${gender}`;
              else if (is4A) finalSize = `G:${size2}${gender} | C:${size1}${gender}`;
              else if (isCalca || isTop) finalSize = `${size1}${gender}`;

              handleAddToCart(item, finalSize);
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
                      {(item.discount ?? 0) > 0 && (
                        <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-lg uppercase shadow-sm">
                          DESC. {item.discount}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-black text-primary">R$ {item.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 space-y-4">
                  {/* Gender Selector for appropriate items (Complex, Calça, Tops UNLESS they are Red Shirts or Gorros or one-size items) */}
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

                  <div className="flex items-end gap-3">
                    <div className="flex-1 space-y-3">
                      {is3A && (
                        <>
                          {renderSizeButtons(size1, numericSizes, (s) => setSelectedSizes(p => ({ ...p, [item.id]: s })), 'Calça')}
                          {renderSizeButtons(size2, smallNumericSizes, (s) => setSelectedSecSizes(p => ({ ...p, [item.id]: s })), 'Blusa')}
                        </>
                      )}
                      {is4A && (
                        <>
                          {renderSizeButtons(size2, smallNumericSizes, (s) => setSelectedSecSizes(p => ({ ...p, [item.id]: s })), 'Gandola')}
                          {renderSizeButtons(size1, numericSizes, (s) => setSelectedSizes(p => ({ ...p, [item.id]: s })), 'Calça')}
                        </>
                      )}
                      {!isComplex && !isOneSize && renderSizeButtons(
                        size1,
                        isCalca ? numericSizes : (isTop ? smallNumericSizes : (isGorro ? capSizes : standardSizes)),
                        (s) => setSelectedSizes(p => ({ ...p, [item.id]: s })),
                        'Tamanho'
                      )}
                      {isOneSize && (
                        <p className="text-[10px] text-slate-400 font-black uppercase italic ml-1">Modelo de Tamanho Único</p>
                      )}
                    </div>

                    <button
                      onClick={handleAdd}
                      className="size-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25 hover:scale-110 active:scale-90 transition-all shrink-0 mb-1"
                    >
                      <span className="material-symbols-outlined font-black">add_shopping_cart</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {inventory.length === 0 && (
            <p className="text-center text-slate-400 py-10 text-sm">Nenhum item em estoque.</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Sales;
