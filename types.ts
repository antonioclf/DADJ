
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
  status: 'Pedido' | 'Entregue' | 'Pago';
}

export interface SaleRecord {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerBM?: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: 'Pedido' | 'Entregue' | 'Pago';
  seller: string;
}
