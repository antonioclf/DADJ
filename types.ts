
export enum View {
  HOME = 'home',
  SALES = 'sales',
  INVENTORY = 'inventory',
  REPORTS = 'reports',
  PROFILE = 'profile',
  TEAM = 'team',
  PRICE_LIST = 'price_list',
  PAYMENT_LOOKUP = 'payment_lookup'
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

export interface InventoryItem {
  id: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  type: 'Camiseta' | 'Baby Look' | 'Moletom' | 'Acessório' | 'Fardamento';
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
