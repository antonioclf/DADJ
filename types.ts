
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

export type InventoryItemType = '4º A' | '3º A' | '5º A/B' | 'Meias' | 'Calçados' | '1º e 2º A' | 'Acessórios' | 'Outros';

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
  customerBloodType?: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: 'Pedido no DA' | 'Pedido na loja' | 'Entregue' | 'Pago';
  seller: string;
  deliveredAt?: string;
  paidAt?: string;
  paymentMethod?: 'Cartão de Crédito' | 'Pix';
}

export const CATALOG_ITEMS = [
  { name: '4º A Completo', type: '4º A' as InventoryItemType, price: 430.00, color: 'Padrão', discount: 6.5 },
  { name: 'Calça 4º A', type: '4º A' as InventoryItemType, price: 205.00, color: 'Padrão', discount: 5 },
  { name: 'Gandola 4º A', type: '4º A' as InventoryItemType, price: 180.00, color: 'Padrão', hideFromSales: true },
  { name: 'Joelheira 4º A (par)', type: '4º A' as InventoryItemType, price: 50.00, color: 'Preto', discount: 9 },
  { name: 'Gorro rígido 4º A', type: '4º A' as InventoryItemType, price: 54.00, color: 'Padrão', discount: 0 },
  { name: 'Gorro flexível 4º A', type: '4º A' as InventoryItemType, price: 37.70, color: 'Padrão', discount: 5.5 },
  { name: 'Gorro rígido Oficial Superior', type: '4º A' as InventoryItemType, price: 57.65, color: 'Padrão', discount: 4 },
  { name: 'Gorro flexível Oficial Superior', type: '4º A' as InventoryItemType, price: 48.20, color: 'Padrão', discount: 3.5 },
  { name: 'Tarjeta (3 unidades)', type: '4º A' as InventoryItemType, price: 29.40, color: 'Padrão', discount: 3 },
  { name: 'Par de Divisas', type: '4º A' as InventoryItemType, price: 11.00, color: 'Padrão', discount: 8 },
  { name: 'Passadeira Cad/CHO/Asp - par', type: '4º A' as InventoryItemType, price: 47.25, color: 'Padrão', discount: 5.5 },
  { name: 'Passadeira SubTen - par', type: '4º A' as InventoryItemType, price: 47.25, color: 'Padrão', discount: 5.5 },
  { name: 'Passadeira 2º Ten - par', type: '4º A' as InventoryItemType, price: 52.00, color: 'Padrão', discount: 5.5 },
  { name: 'Passadeira 1º Ten - par', type: '4º A' as InventoryItemType, price: 56.70, color: 'Padrão', discount: 5.5 },
  { name: 'Passadeira Cap - par', type: '4º A' as InventoryItemType, price: 61.50, color: 'Padrão', discount: 5.5 },
  { name: 'Passadeira Maj - par', type: '4º A' as InventoryItemType, price: 66.15, color: 'Padrão', discount: 5.5 },
  { name: 'Passadeira Ten Cel - par', type: '4º A' as InventoryItemType, price: 71.00, color: 'Padrão', discount: 5.5 },
  { name: 'Passadeira Cel - par', type: '4º A' as InventoryItemType, price: 71.00, color: 'Padrão', discount: 5.5 },
  { name: 'Cinto vermelho', type: '4º A' as InventoryItemType, price: 41.90, color: 'Vermelho', discount: 2.5 },
  { name: 'Chapéu de selva', type: '4º A' as InventoryItemType, price: 79.90, color: 'Padrão' },

  { name: '3º A Completo', type: '3º A' as InventoryItemType, price: 260.00, color: 'Padrão', discount: 2 },
  { name: 'Camisa 3º A', type: '3º A' as InventoryItemType, price: 118.00, color: 'Padrão', discount: 1.5 },
  { name: 'Calça 3º A', type: '3º A' as InventoryItemType, price: 142.00, color: 'Padrão', discount: 2 },
  { name: 'Machadinha - par', type: '3º A' as InventoryItemType, price: 14.70, color: 'Padrão', discount: 2 },
  { name: 'Boina Defenser', type: '3º A' as InventoryItemType, price: 187.00, color: 'Padrão' },
  { name: 'Boina Lyon/Pralana', type: '3º A' as InventoryItemType, price: 143.00, color: 'Padrão' },
  { name: 'Florão para boina CFO/CHO', type: '3º A' as InventoryItemType, price: 58.40, color: 'Padrão' },
  { name: 'Plaqueta', type: '3º A' as InventoryItemType, price: 50.00, color: 'Padrão' },
  { name: 'Platina Cad/CHO/Asp - par', type: '3º A' as InventoryItemType, price: 61.50, color: 'Padrão', discount: 5.5 },
  { name: 'Platina SubTen - par', type: '3º A' as InventoryItemType, price: 61.50, color: 'Padrão', discount: 5.5 },
  { name: 'Platina 2º Ten - par', type: '3º A' as InventoryItemType, price: 66.15, color: 'Padrão', discount: 5.5 },
  { name: 'Platina 1º Ten - par', type: '3º A' as InventoryItemType, price: 71.00, color: 'Padrão', discount: 5.5 },
  { name: 'Platina Cap - par', type: '3º A' as InventoryItemType, price: 80.00, color: 'Padrão', discount: 6 },
  { name: 'Platina Maj - par', type: '3º A' as InventoryItemType, price: 80.00, color: 'Padrão', discount: 6 },
  { name: 'Platina Ten Cel - par', type: '3º A' as InventoryItemType, price: 85.00, color: 'Padrão', discount: 5.5 },
  { name: 'Platina Cel - par', type: '3º A' as InventoryItemType, price: 85.00, color: 'Padrão', discount: 5.5 },

  { name: '5º B Bordado', type: '5º A/B' as InventoryItemType, price: 225.00, color: 'Padrão', discount: 10 },
  { name: '5º B sem Bordado', type: '5º A/B' as InventoryItemType, price: 220.00, color: 'Padrão', discount: 8.5 },
  { name: 'Camisa Vermelha Bordada', type: '5º A/B' as InventoryItemType, price: 50.00, color: 'Vermelho', discount: 9 },
  { name: 'Camisa Vermelha sem Bordado', type: '5º A/B' as InventoryItemType, price: 45.00, color: 'Vermelho', discount: 10 },
  { name: 'Short', type: '5º A/B' as InventoryItemType, price: 32.00, color: 'Padrão', discount: 8.5 },
  { name: 'Sunga', type: '5º A/B' as InventoryItemType, price: 55.00, color: 'Padrão', discount: 8 },
  { name: 'Maiô', type: '5º A/B' as InventoryItemType, price: 97.00, color: 'Padrão' },
  { name: 'Suquini', type: '5º A/B' as InventoryItemType, price: 99.00, color: 'Padrão' },
  { name: 'Segunda Pele Bordada', type: '5º A/B' as InventoryItemType, price: 82.00, color: 'Padrão', discount: 3.5 },
  { name: 'Segunda pele sem bordar', type: '5º A/B' as InventoryItemType, price: 74.90, color: 'Padrão' },
  { name: 'Tensor preto', type: '5º A/B' as InventoryItemType, price: 41.90, color: 'Preto', discount: 7 },
  { name: 'Top preto', type: '5º A/B' as InventoryItemType, price: 52.40, color: 'Preto', discount: 4.5 },
  { name: 'Boné Vermelho', type: '5º A/B' as InventoryItemType, price: 49.90, color: 'Vermelho' },

  { name: 'Meião preto com logo do bombeiro (par)', type: 'Meias' as InventoryItemType, price: 20.79, color: 'Preto' },
  { name: 'Meião preto (par)', type: 'Meias' as InventoryItemType, price: 16.50, color: 'Preto' },
  { name: 'Meia social preta trifil (3 pares)', type: 'Meias' as InventoryItemType, price: 39.60, color: 'Preto' },
  { name: 'Meia social preta (1 par)', type: 'Meias' as InventoryItemType, price: 12.70, color: 'Preto' },
  { name: 'Meia branca com logo do bombeiro (par)', type: 'Meias' as InventoryItemType, price: 16.50, color: 'Branco' },

  { name: 'Coturno', type: 'Calçados' as InventoryItemType, price: 297.00, color: 'Preto' },

  { name: 'Camisa 2º A', type: '1º e 2º A' as InventoryItemType, price: 0.00, color: 'Padrão' },
  { name: 'Túnica 2º A', type: '1º e 2º A' as InventoryItemType, price: 0.00, color: 'Padrão' },
  { name: 'Machadão', type: '1º e 2º A' as InventoryItemType, price: 19.00, color: 'Padrão', discount: 5 },
  { name: 'Florão para quepe CFO/CHO', type: '1º e 2º A' as InventoryItemType, price: 85.40, color: 'Padrão' },
  { name: 'Plaqueta', type: '1º e 2º A' as InventoryItemType, price: 50.00, color: 'Padrão' },

  { name: 'Luva preta de couro', type: 'Acessórios' as InventoryItemType, price: 99.90, color: 'Preto' },
  { name: 'Cantil', type: 'Acessórios' as InventoryItemType, price: 27.90, color: 'Padrão' },
  { name: 'Capa de cantil', type: 'Acessórios' as InventoryItemType, price: 39.90, color: 'Padrão' },
  { name: 'Velame', type: 'Acessórios' as InventoryItemType, price: 55.00, color: 'Padrão' },
  { name: 'Calça jeans', type: 'Acessórios' as InventoryItemType, price: 70.00, color: 'Padrão', discount: 18 },
  { name: 'Cordelete de 6mm', type: 'Acessórios' as InventoryItemType, price: 7.50, color: 'Padrão', discount: 4 },
  { name: 'Cordelete de 8mm', type: 'Acessórios' as InventoryItemType, price: 10.00, color: 'Padrão', discount: 5 },
  { name: 'Cabo solteiro de 5,5 metros', type: 'Acessórios' as InventoryItemType, price: 41.60, color: 'Padrão', discount: 5 },
  { name: 'Hinário', type: 'Acessórios' as InventoryItemType, price: 7.00, color: 'Padrão' },
  { name: 'Touca de natação', type: 'Acessórios' as InventoryItemType, price: 27.50, color: 'Padrão', discount: 0 },

  { name: 'Par de meião preto', type: 'Outros' as InventoryItemType, price: 16.50, color: 'Preto' },
];
