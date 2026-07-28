
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env vars from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontrados no .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const fardamentoItems = [
    { name: '4º A Completo', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento', price: 408.45, discount: 11 },
    { name: 'Calça 4º A', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento', price: 209.00, discount: 3 },
    { name: 'Joelheira 4º A (par)', size: 'Único', color: 'Preto', quantity: 10, type: 'Fardamento', price: 47.15, discount: 14 },
    { name: 'Gorro rígido 4º A', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento', price: 54.00, discount: 0 },
    { name: 'Gorro flexível 4º A', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento', price: 37.70, discount: 5 },
    { name: 'Tarjeta (3 unidades)', size: 'Único', color: 'Padrão', quantity: 10, type: 'Fardamento', price: 29.40, discount: 2 },
    { name: 'Par de meião preto', size: 'Único', color: 'Preto', quantity: 10, type: 'Outros', price: 16.50, discount: 0 },
    { name: '5º B Bordado', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento', price: 199.40, discount: 20 },
    { name: '5º B sem Bordado', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento', price: 194.15, discount: 9 },
    { name: 'Camisa Vermelha Bordada', size: 'M', color: 'Vermelho', quantity: 10, type: 'Fardamento', price: 52.40, discount: 5 },
    { name: 'Camisa Vermelha sem Bordado', size: 'M', color: 'Vermelho', quantity: 10, type: 'Fardamento', price: 47.15, discount: 5 },
    { name: 'Short', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento', price: 31.40, discount: 10 },
    { name: 'Sunga', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento', price: 52.40, discount: 12 },
    { name: 'Maiô', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento', price: 97.00, discount: 0 },
    { name: 'Suquini', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento', price: 100.00, discount: 0 },
    { name: 'Segunda Pele Bordada', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento', price: 83.90, discount: 1 },
    { name: '3º A', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento', price: 264.90, discount: 0 },
    { name: 'Camisa 3º A', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento', price: 119.90, discount: 0 },
    { name: 'Calça 3º A', size: 'M', color: 'Padrão', quantity: 10, type: 'Fardamento', price: 145.00, discount: 0 }
];

async function seedFardamento() {
    console.log('Iniciando cadastro de fardamento...');

    const { data, error } = await supabase
        .from('inventory')
        .upsert(fardamentoItems, { onConflict: 'name,size,color' });

    if (error) {
        console.error('Erro ao inserir fardamento:', error.message);
    } else {
        console.log('Fardamento cadastrado com sucesso! 🎉');
    }
}

seedFardamento();
