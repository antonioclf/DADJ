
export enum View {
  HOME = 'home',
  SALES = 'sales',
  INVENTORY = 'inventory',
  REPORTS = 'reports',
  PROFILE = 'profile',
  TEAM = 'team'
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
