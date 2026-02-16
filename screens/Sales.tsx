
import React, { useState } from 'react';
import { InventoryItem, SaleRecord, OrderItem } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Header from '../components/ui/Header';
import Modal from '../components/ui/Modal';

interface SalesProps {
  onBack: () => void;
  inventory: InventoryItem[];
  onAddSale: (sale: SaleRecord) => void;
}

const Sales: React.FC<SalesProps> = ({ onBack, inventory, onAddSale }) => {
  const [seller, setSeller] = useState('Carlos Oliveira');
  const [buyer, setBuyer] = useState('');
  const [phone, setPhone] = useState('');
  const [isPaid, setIsPaid] = useState(true);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [showItemPicker, setShowItemPicker] = useState(false);

  const handleAddToCart = (item: InventoryItem) => {
    const existing = cart.find(i => i.inventoryId === item.id);
    if (existing) {
      setCart(cart.map(i => i.inventoryId === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, {
        id: Date.now().toString() + Math.random(),
        inventoryId: item.id,
        name: item.name,
        size: item.size,
        quantity: 1,
        price: item.price
      }]);
    }
    setShowItemPicker(false);
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(i => i.id !== id));
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
              value={seller}
              onChange={(e) => setSeller((e.target as HTMLInputElement).value)}
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
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tam: {item.size} • Qtd: {item.quantity}</p>
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
        <div className="space-y-2 pb-4">
          {inventory.filter(i => i.quantity > 0).map(item => (
            <div
              key={item.id}
              onClick={() => handleAddToCart(item)}
              className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl cursor-pointer transition-colors border border-transparent hover:border-primary/20"
            >
              <div className="size-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-primary">apparel</span>}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold dark:text-white">{item.name}</h3>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{item.size} • {item.color} • {item.quantity} dispon.</p>
              </div>
              <p className="font-bold text-primary">R$ {item.price.toFixed(2)}</p>
            </div>
          ))}
          {inventory.filter(i => i.quantity > 0).length === 0 && (
            <p className="text-center text-slate-400 py-10 text-sm">Nenhum item em estoque.</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Sales;
