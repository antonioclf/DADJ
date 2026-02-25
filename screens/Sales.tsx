
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
  const [sizingItem, setSizingItem] = useState<string | null>(null);

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
    setSizingItem(null);
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
                        <span className="text-[8px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded-full uppercase shadow-sm">
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
        <div className="space-y-3 pb-6">
          {inventory.map(item => (
            <div key={item.id} className="space-y-2">
              <div
                onClick={() => setSizingItem(sizingItem === item.id ? null : item.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${sizingItem === item.id ? 'bg-primary/5 border-primary/20 shadow-inner' : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 hover:border-primary/20'}`}
              >
                <div className="size-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                  {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-primary">apparel</span>}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-black dark:text-white uppercase tracking-tight">{item.name}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">{item.color}</p>
                    {(item.discount ?? 0) > 0 && (
                      <span className="text-[8px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded-md uppercase animate-pulse">
                        DESC. {item.discount}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {item.discount && item.discount > 0 ? (
                    <>
                      <p className="text-[9px] text-slate-400 font-bold line-through opacity-60 italic">De R$ {(item.price / (1 - item.discount / 100)).toFixed(2)}</p>
                      <p className="text-sm font-black text-rose-500">Por R$ {item.price.toFixed(2)}</p>
                    </>
                  ) : (
                    <p className="text-sm font-black text-primary">R$ {item.price.toFixed(2)}</p>
                  )}
                </div>
              </div>

              {/* Size Selector Expansion */}
              {sizingItem === item.id && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Selecione o Tamanho:</p>
                  <div className="grid grid-cols-6 gap-2">
                    {['PP', 'P', 'M', 'G', 'GG', 'EG'].map(size => (
                      <button
                        key={size}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item, size);
                        }}
                        className="py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95"
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {inventory.length === 0 && (
            <p className="text-center text-slate-400 py-10 text-sm">Nenhum item em estoque.</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Sales;
