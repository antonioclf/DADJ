
const fs = require('fs');

async function seed() {
    console.log('--- Automação de Cadastro de Equipe ---');

    // Ler credenciais do .env.local
    let envContent = '';
    try {
        envContent = fs.readFileSync('.env.local', 'utf8');
    } catch (e) {
        console.error('Erro ao ler .env.local');
        return;
    }

    const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
    const supabaseKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

    if (!supabaseUrl || !supabaseKey) {
        console.error('Credenciais não encontradas no .env.local');
        return;
    }

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

    console.log(`Cadastrando ${teamMembers.length} membros...`);

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/team`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(teamMembers)
        });

        if (response.ok) {
            console.log('✅ Equipe cadastrada com sucesso!');
        } else {
            const err = await response.text();
            console.error('❌ Erro no Supabase:', err);
            if (err.includes('relation "public.team" does not exist')) {
                console.log('\nAVISO: Você precisa rodar o SQL do arquivo team_schema.sql primeiro!');
            }
        }
    } catch (e) {
        console.error('Erro na requisição:', e.message);
    }
}

seed();
