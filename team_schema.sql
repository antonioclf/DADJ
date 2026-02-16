CREATE TABLE team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Vendedor',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE team ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users" ON team
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO team (name, role) VALUES 
('Cad Barreto', 'CFO III'),
('Cad Carneiro', 'CFO III'),
('Cad Natália Machado', 'CFO III'),
('Cad Araújo', 'CFO II'),
('Cad Bahia', 'CFO II'),
('Cad Lima', 'CFO II'),
('Cad Azalim', 'CFO II'),
('Cad Samir', 'CFO II');
