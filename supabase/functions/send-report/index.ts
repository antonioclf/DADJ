import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { pdfBase64, recipientEmail, subject, htmlContent, filename } = await req.json()

        if (!recipientEmail || !pdfBase64) {
            throw new Error('Missing required fields: recipientEmail or pdfBase64')
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'DA Dois de Julho <onboarding@resend.dev>',
                to: [recipientEmail],
                subject: subject || 'Relatório de Vendas',
                html: htmlContent || '<p>Segue em anexo o relatório de vendas solicitado.</p>',
                attachments: [
                    {
                        content: pdfBase64,
                        filename: filename || 'relatorio_vendas.pdf',
                    },
                ],
            }),
        })

        const data = await res.json()

        if (!res.ok) {
            return new Response(JSON.stringify(data), {
                status: res.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
