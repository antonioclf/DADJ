
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontrados no .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const teamMembers = [
    { name: 'Cad Barreto', role: 'CFO III' },
    { name: 'Cad Carneiro', role: 'CFO III' },
    { name: 'Cad Natália Machado', role: 'CFO III' },
    { name: 'Cad Araújo', role: 'CFO II' },
    { name: 'Cad Bahia', role: 'CFO II' },
    { name: 'Cad Lima', role: 'CFO II' },
    { name: 'Cad Azalim', role: 'CFO II' },
    { name: 'Cad Samir', role: 'CFO II' }
];

async function seed() {
    console.log('Iniciando cadastro da equipe...');

    const { data, error } = await supabase
        .from('team')
        .insert(teamMembers);

    if (error) {
        console.error('Erro ao inserir equipe:', error.message);
        console.log('\n--- DICA ---');
        console.log('Certifique-se de que você já criou a tabela "team" no Supabase usando o arquivo team_schema.sql');
    } else {
        console.log('Equipe cadastrada com sucesso! 🎉');
    }
}

seed();
