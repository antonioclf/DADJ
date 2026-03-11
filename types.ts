
export enum View {
  HOME = 'home',
  SALES = 'sales',
  INVENTORY = 'inventory',
  REPORTS = 'reports',
  PROFILE = 'profile',
  TEAM = 'team',
  PRICE_LIST = 'price_list',
  PAYMENT_LOOKUP = 'payment_lookup',
  INVENTORY_CONSULTATION = 'inventory_consultation'
}

export type ReportType = 'Vendas' | 'Estoque' | 'Alunos' | 'Vendedores';

export interface InstallmentPayment {
  installmentNumber: number;
  paidAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  active: boolean;
}

export type InventoryItemType = '4º A' | '3º A' | '5º A/B' | 'Meias' | 'Calçados' | '1º e 2º A';

export interface InventoryItem {
  id: string;
  name: string;
  size: string;
  color: string;
  gender: 'Masculino' | 'Feminino' | 'Unissex';
  quantity: number;
  type: InventoryItemType;
  price: number;
  discount?: number;
  image?: string; // Base64 or URL
}

export interface OrderItem {
  id: string;
  inventoryId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  discount?: number;
  source?: 'Estoque' | 'Loja';
  status: 'Pedido no DA' | 'Pedido na loja' | 'Entregue' | 'Pago';
  totalInstallments: number;
  paidInstallments: number;
  deliveredAt?: string;
  paidAt?: string;
  lastPaymentAt?: string;
  installmentHistory?: InstallmentPayment[];
}

export interface SaleRecord {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerBM?: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: 'Pedido no DA' | 'Pedido na loja' | 'Entregue' | 'Pago';
  seller: string;
  deliveredAt?: string;
  paidAt?: string;
}

export const CATALOG_ITEMS = [
  { name: '4º A Completo', type: '4º A' as InventoryItemType, price: 408.45, color: 'Padrão', discount: 11 },
  { name: 'Calça 4º A', type: '4º A' as InventoryItemType, price: 209.00, color: 'Padrão' },
  { name: 'Gandola 4º A', type: '4º A' as InventoryItemType, price: 180.00, color: 'Padrão', hideFromSales: true },
  { name: 'Joelheira 4º A (par)', type: '4º A' as InventoryItemType, price: 47.15, color: 'Preto', discount: 13 },
  { name: 'Gorro rígido 4º A', type: '4º A' as InventoryItemType, price: 44.00, color: 'Padrão', discount: 11 },
  { name: 'Gorro flexível 4º A', type: '4º A' as InventoryItemType, price: 37.70, color: 'Padrão', discount: 5 },
  { name: 'Tarjeta (3 unidades)', type: '4º A' as InventoryItemType, price: 29.40, color: 'Padrão', discount: 2 },

  { name: '3º A Completo', type: '3º A' as InventoryItemType, price: 264.90, color: 'Padrão' },
  { name: 'Camisa 3º A', type: '3º A' as InventoryItemType, price: 119.90, color: 'Padrão' },
  { name: 'Calça 3º A', type: '3º A' as InventoryItemType, price: 145.00, color: 'Padrão' },

  { name: '5º B Bordado', type: '5º A/B' as InventoryItemType, price: 199.40, color: 'Padrão', discount: 20 },
  { name: '5º B sem Bordado', type: '5º A/B' as InventoryItemType, price: 194.15, color: 'Padrão', discount: 9 },
  { name: 'Camisa Vermelha Bordada', type: '5º A/B' as InventoryItemType, price: 52.40, color: 'Vermelho', discount: 5 },
  { name: 'Camisa Vermelha sem Bordado', type: '5º A/B' as InventoryItemType, price: 47.15, color: 'Vermelho', discount: 4 },
  { name: 'Short', type: '5º A/B' as InventoryItemType, price: 31.40, color: 'Padrão', discount: 10 },
  { name: 'Sunga', type: '5º A/B' as InventoryItemType, price: 52.40, color: 'Padrão', discount: 12 },
  { name: 'Maiô', type: '5º A/B' as InventoryItemType, price: 97.00, color: 'Padrão' },
  { name: 'Suquini', type: '5º A/B' as InventoryItemType, price: 100.00, color: 'Padrão' },
  { name: 'Segunda Pele Bordada', type: '5º A/B' as InventoryItemType, price: 83.90, color: 'Padrão', discount: 1 },

  { name: 'Meião preto com logo do bombeiro (par)', type: 'Meias' as InventoryItemType, price: 20.79, color: 'Preto' },
  { name: 'Meião preto (par)', type: 'Meias' as InventoryItemType, price: 16.50, color: 'Preto' },
  { name: 'Meia social preta trifil (3 pares)', type: 'Meias' as InventoryItemType, price: 39.60, color: 'Preto' },
  { name: 'Meia social preta (1 par)', type: 'Meias' as InventoryItemType, price: 12.70, color: 'Preto' },
  { name: 'Meia branca com logo do bombeiro (par)', type: 'Meias' as InventoryItemType, price: 16.50, color: 'Branco' },

  { name: 'Coturno', type: 'Calçados' as InventoryItemType, price: 297.00, color: 'Preto' },

  { name: 'Camisa 2º A', type: '1º e 2º A' as InventoryItemType, price: 0.00, color: 'Padrão' },
  { name: 'Túnica 2º A', type: '1º e 2º A' as InventoryItemType, price: 0.00, color: 'Padrão' },
];
