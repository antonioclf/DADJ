
-- Table to store inventory items
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('Camiseta', 'Baby Look', 'Moletom', 'Acessório', 'Fardamento')),
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount DECIMAL(5,2) DEFAULT 0.00,
  image TEXT, -- Base64 or URL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table to store sale records
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_bm TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL CHECK (status IN ('Pedido no DA', 'Pedido na loja', 'Entregue', 'Pago')),
  seller TEXT NOT NULL,
  delivered_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table to store individual items within a sale
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES inventory(id),
  name TEXT NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pedido no DA' CHECK (status IN ('Pedido no DA', 'Pedido na loja', 'Entregue', 'Pago')),
  total_installments INTEGER NOT NULL DEFAULT 1,
  paid_installments INTEGER DEFAULT 0,
  delivered_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  last_payment_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT sale_items_status_check CHECK (status IN ('Pedido no DA', 'Pedido na loja', 'Entregue', 'Pago'))
);

-- Enable Row Level Security (RLS)
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Simple policies for authenticated users
CREATE POLICY "Allow all actions for authenticated users" ON inventory FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for authenticated users" ON sales FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for authenticated users" ON sale_items FOR ALL USING (auth.role() = 'authenticated');

-- Public policies (anon access) for consultations
CREATE POLICY "Allow public read-only access to inventory" ON inventory FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read-only access to sales" ON sales FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read-only access to sale_items" ON sale_items FOR SELECT TO anon USING (true);
