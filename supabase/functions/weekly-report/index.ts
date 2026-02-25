import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsPDF } from 'https://esm.sh/jspdf@2.5.1'
import 'https://esm.sh/jspdf-autotable@3.5.28'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log("Iniciando geração de relatório semanal automático com PDF...")

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // 1. Buscar vendas dos últimos 7 dias
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .order('created_at', { ascending: false })

    if (salesError) throw salesError

    const recentSales = sales.filter(sale => {
      const saleDate = new Date(sale.created_at)
      return saleDate >= sevenDaysAgo
    }) || []

    // 2. Calcular Estatísticas
    let totalBruto = 0
    let totalRecebido = 0

    recentSales.forEach(sale => {
      if (sale.sale_items) {
        sale.sale_items.forEach((item: any) => {
          const itemTotal = item.price * item.quantity
          totalBruto += itemTotal
          const paidRatio = item.total_installments > 0 ? (item.paid_installments / item.total_installments) : 1
          totalRecebido += itemTotal * paidRatio
        })
      }
    })

    const totalPendente = totalBruto - totalRecebido

    // 3. Gerar PDF
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Relatório Semanal de Vendas - DADJ', 14, 22);

    doc.setFontSize(10);
    const periodText = `Período: ${sevenDaysAgo.toLocaleDateString('pt-BR')} até ${new Date().toLocaleDateString('pt-BR')}`;
    doc.text(periodText, 14, 30);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 35);

    // Resumo Financeiro no PDF
    (doc as any).autoTable({
      startY: 45,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total Bruto', `R$ ${totalBruto.toFixed(2)}`],
        ['Total Recebido', `R$ ${totalRecebido.toFixed(2)}`],
        ['Total Pendente', `R$ ${totalPendente.toFixed(2)}`],
        ['Quantidade de Vendas', recentSales.length.toString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }
    });

    // Detalhamento de Vendas no PDF
    const tableData = recentSales.flatMap(sale =>
      (sale.sale_items || []).map((item: any) => [
        new Date(sale.created_at).toLocaleDateString('pt-BR'),
        sale.customer_name,
        item.name,
        item.quantity,
        `R$ ${item.price.toFixed(2)}`,
        `R$ ${(item.price * item.quantity).toFixed(2)}`,
        item.status
      ])
    );

    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Data', 'Cliente', 'Item', 'Qtd', 'Un.', 'Total', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 8 }
    });

    const pdfBase64 = doc.output('datauristring').split(',')[1];

    // 4. Montar HTML do E-mail
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #2563eb; text-align: center;">Relatório Semanal de Vendas</h2>
        <p style="text-align: center; color: #666;">${periodText}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 10px;">
          <div style="font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: bold;">Total Bruto</div>
          <div style="font-size: 24px; font-weight: bold; color: #1e293b;">R$ ${totalBruto.toFixed(2)}</div>
        </div>

        <p style="text-align: center; color: #666; font-size: 12px;">
          O relatório detalhado em PDF foi anexado a este e-mail.
        </p>
      </div>
    `

    // 5. Enviar E-mail via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Relatório DADJ <onboarding@resend.dev>',
        to: ['abm.cfoguarani@gmail.com'],
        subject: `Resumo Semanal DADJ - ${new Date().toLocaleDateString('pt-BR')}`,
        html: htmlContent,
        attachments: [
          {
            content: pdfBase64,
            filename: `relatorio_semanal_${new Date().toISOString().split('T')[0]}.pdf`,
          }
        ],
      }),
    })

    const resData = await res.json()
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
