
const fs = require('fs');
const https = require('https');

function seed() {
    console.log('--- Automação de Cadastro de Equipe ---');

    // Ler credenciais do .env.local
    let envContent = '';
    try {
        envContent = fs.readFileSync('.env.local', 'utf8');
    } catch (e) {
        console.error('Erro ao ler .env.local');
        return;
    }

    const supabaseUrlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
    const supabaseKeyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

    const supabaseUrl = supabaseUrlMatch ? supabaseUrlMatch[1].trim() : null;
    const supabaseKey = supabaseKeyMatch ? supabaseKeyMatch[1].trim() : null;

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

    const url = new URL(`${supabaseUrl}/rest/v1/team`);
    const options = {
        method: 'POST',
        hostname: url.hostname,
        path: url.pathname,
        headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=representation'
        }
    };

    const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log('✅ Equipe cadastrada com sucesso!');
            } else {
                console.error(`❌ Erro ${res.statusCode}:`, body);
                if (body.includes('relation "public.team" does not exist')) {
                    console.log('\nAVISO: Você precisa rodar o SQL do arquivo team_schema.sql primeiro!');
                }
            }
        });
    });

    req.on('error', (e) => {
        console.error('Erro na requisição:', e.message);
    });

    req.write(JSON.stringify(teamMembers));
    req.end();
}

seed();
