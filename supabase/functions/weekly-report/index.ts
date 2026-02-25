import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    console.log("Iniciando geração de relatório semanal automático...")

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

        // 1. Buscar vendas dos últimos 7 dias
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        // As datas no banco estão em formato texto ou timestamp? 
        // No schema original (se seguir o padrão), buscamos pela coluna 'created_at' ou 'date'
        // Vamos buscar todas as vendas e filtrar na função para garantir precisão com o formato DD/MM/YYYY do app
        const { data: sales, error: salesError } = await supabase
            .from('sales')
            .select('*, sale_items(*)')
            .order('created_at', { ascending: false })

        if (salesError) throw salesError

        const recentSales = sales.filter(sale => {
            const saleDate = new Date(sale.created_at)
            return saleDate >= sevenDaysAgo
        })

        // 2. Calcular Estatísticas
        let totalBruto = 0
        let totalRecebido = 0

        recentSales.forEach(sale => {
            sale.sale_items.forEach((item: any) => {
                const itemTotal = item.price * item.quantity
                totalBruto += itemTotal
                const paidPortion = itemTotal * (item.paid_installments / (item.total_installments || 1))
                totalRecebido += paidPortion
            })
        })

        const totalPendente = totalBruto - totalRecebido

        // 3. Montar HTML do E-mail
        const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #2563eb; text-align: center;">Relatório Semanal de Vendas</h2>
        <p style="text-align: center; color: #666;">Período: Últimos 7 dias</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        
        <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: bold;">Total Bruto</div>
            <div style="font-size: 18px; font-weight: bold; color: #1e293b;">R$ ${totalBruto.toFixed(2)}</div>
          </div>
          <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 10px; text-transform: uppercase; color: #4ade80; font-weight: bold;">Total Recebido</div>
            <div style="font-size: 18px; font-weight: bold; color: #166534;">R$ ${totalRecebido.toFixed(2)}</div>
          </div>
        </div>

        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <div style="font-size: 10px; text-transform: uppercase; color: #f87171; font-weight: bold;">Total Pendente</div>
          <div style="font-size: 18px; font-weight: bold; color: #991b1b;">R$ ${totalPendente.toFixed(2)}</div>
        </div>

        <h3 style="color: #334155; font-size: 14px;">Resumo das Vendas (${recentSales.length})</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Data</th>
              <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Cliente</th>
              <th style="padding: 8px; text-align: right; border-bottom: 1px solid #e2e8f0;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${recentSales.map(sale => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${new Date(sale.created_at).toLocaleDateString('pt-BR')}</td>
                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${sale.customer_name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: right;">R$ ${sale.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <p style="font-size: 10px; color: #94a3b8; margin-top: 30px; text-align: center;">
          Gerado automaticamente pelo Sistema DADJ.
        </p>
      </div>
    `

        // 4. Enviar E-mail via Resend
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'Relatório DADJ <onboarding@resend.dev>',
                to: ['abm.cfoguarani@gmail.com'],
                subject: `Resumo Semanal de Vendas - ${new Date().toLocaleDateString('pt-BR')}`,
                html: htmlContent,
            }),
        })

        const resData = await res.json()
        console.log("Resposta do Resend:", JSON.stringify(resData))

        if (!res.ok) throw new Error(JSON.stringify(resData))

        return new Response(JSON.stringify({ success: true, count: recentSales.length }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error("Erro no relatório automático:", error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
