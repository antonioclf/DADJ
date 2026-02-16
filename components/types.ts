
export enum View {
  HOME = 'home',
  SALES = 'sales',
  INVENTORY = 'inventory',
  REPORTS = 'reports',
  PROFILE = 'profile'
}

export interface InventoryItem {
  id: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  type: 'Camiseta' | 'Baby Look' | 'Moletom' | 'Acessório';
  price: number;
  image?: string; // Base64 or URL
}

export interface OrderItem {
  id: string;
  inventoryId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
}

export interface SaleRecord {
  id: string;
  customerName: string;
  customerPhone?: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: 'Pago' | 'Pendente';
  seller: string;
}
