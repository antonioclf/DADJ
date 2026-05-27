
import React, { useState } from 'react';
import { InventoryItem, SaleRecord, OrderItem, TeamMember, CATALOG_ITEMS } from '../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Header from '../ui/Header';
import ItemPickerModal from '../ui/ItemPickerModal';

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
  const [buyerBloodType, setBuyerBloodType] = useState('');
  const [orderStatus, setOrderStatus] = useState<'Pedido no DA' | 'Pedido na loja' | 'Entregue' | 'Pago'>('Pedido no DA');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [selectedSecSizes, setSelectedSecSizes] = useState<Record<string, string>>({});
  const [selectedGenders, setSelectedGenders] = useState<Record<string, 'M' | 'F'>>({});
  const [saleSource, setSaleSource] = useState<'Estoque' | 'Loja'>('Loja');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const filters = ['Todos', '1º e 2º A', '3º A', '4º A', '5º A/B', 'Meias', 'Calçados', 'Acessórios'];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cartão de Crédito' | 'Pix'>('Cartão de Crédito');

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

  const baseTotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const finalTotal = paymentMethod === 'Cartão de Crédito' ? baseTotal * 1.0362 : baseTotal;

  const handleFinalize = async () => {
    if (!buyer || cart.length === 0) {
      alert("Por favor, preencha o nome do aluno e adicione itens.");
      return;
    }

    const isCard = paymentMethod === 'Cartão de Crédito';
    
    // For Credit Card, we save item prices and total with the 3.62% increase applied
    const adjustedItems = cart.map(item => {
      if (isCard) {
        return {
          ...item,
          price: Math.round(item.price * 1.0362 * 100) / 100
        };
      }
      return item;
    });

    const adjustedTotal = isCard 
      ? Math.round(baseTotal * 1.0362 * 100) / 100
      : baseTotal;

    const newSale: SaleRecord = {
      id: Date.now().toString(),
      customerName: buyer,
      customerPhone: phone,
      customerBM: buyerBM,
      customerBloodType: buyerBloodType,
      date: new Date().toLocaleString('pt-BR'),
      items: adjustedItems,
      total: adjustedTotal,
      status: orderStatus,
      seller: seller,
      paymentMethod: paymentMethod
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
            <Input
              label="Tipo Sanguíneo"
              as="select"
              value={buyerBloodType}
              onChange={(e) => setBuyerBloodType((e.target as HTMLSelectElement).value)}
            >
              <option value="">Não informado</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </Input>

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
                    type="button"
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

            <div className="space-y-4">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider pb-1 ml-1">Forma de Pagamento</p>
              <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                {[
                  { id: 'Cartão de Crédito', label: 'Cartão de Crédito', color: 'text-primary', bg: 'bg-white dark:bg-slate-700', icon: 'credit_card' },
                  { id: 'Pix', label: 'Pix (-3.62%)', color: 'text-emerald-500', bg: 'bg-white dark:bg-slate-700', icon: 'qr_code_2' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setPaymentMethod(s.id as any)}
                    className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${paymentMethod === s.id ? `${s.bg} ${s.color} shadow-sm border border-slate-100 dark:border-slate-600` : 'text-slate-400 opacity-60'}`}
                  >
                    <span className="material-symbols-outlined text-[18px] font-black">
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

        {/* Price Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-primary/5 space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span>Subtotal (Base Pix)</span>
            <span>R$ {baseTotal.toFixed(2)}</span>
          </div>
          {paymentMethod === 'Cartão de Crédito' && (
            <div className="flex justify-between items-center text-xs font-black text-primary uppercase tracking-widest">
              <span>Acréscimo Cartão (+3.62%)</span>
              <span>+ R$ {(baseTotal * 0.0362).toFixed(2)}</span>
            </div>
          )}
          {paymentMethod === 'Pix' && (
            <div className="flex justify-between items-center text-[10px] font-black text-emerald-500 uppercase tracking-widest italic opacity-80">
              <span>Pagamento via Pix</span>
              <span>Valor base já com desconto</span>
            </div>
          )}
          <hr className="border-slate-100 dark:border-slate-800" />
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest">Total no Caixa</span>
            <span className="text-xl font-black text-primary dark:text-white">R$ {finalTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Final Total */}
        <div className="bg-primary p-6 rounded-[2rem] text-white flex justify-between items-center shadow-xl shadow-primary/25">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
              {paymentMethod === 'Pix' ? 'Total com Desconto' : 'Valor Total'}
            </p>
            <h2 className="text-2xl font-bold">R$ {finalTotal.toFixed(2)}</h2>
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

      <ItemPickerModal
        isOpen={showItemPicker}
        onClose={() => setShowItemPicker(false)}
        inventory={inventory}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
};

export default Sales;
