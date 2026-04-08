import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { 
      registration_id, 
      event_id, 
      church_id, 
      amount, 
      payment_method,
      attendee_name,
      attendee_email 
    } = await req.json();

    if (!registration_id || !amount || !payment_method) {
      return new Response(JSON.stringify({ error: 'Campos obrigatórios: registration_id, amount, payment_method' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get church payment settings
    const { data: paymentSettings, error: settingsError } = await adminClient
      .from('payment_settings')
      .select('*')
      .eq('church_id', church_id)
      .eq('gateway', 'mercadopago')
      .eq('is_active', true)
      .single();

    if (settingsError || !paymentSettings?.mercadopago_access_token) {
      return new Response(JSON.stringify({ 
        error: 'Gateway de pagamento não configurado para esta igreja',
        manual_payment: true,
        pix_key: await getChurchPixKey(church_id, adminClient)
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create payment preference in MercadoPago
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${paymentSettings.mercadopago_access_token}`,
      },
      body: JSON.stringify({
        items: [{
          title: `Inscrição Evento - ${registration_id.slice(0, 8)}`,
          description: `Pagamento para inscrição no evento`,
          quantity: 1,
          unit_price: parseFloat(amount),
          currency_id: 'BRL',
        }],
        payer: {
          name: attendee_name,
          email: attendee_email,
        },
        external_reference: registration_id,
        payment_methods: {
          excluded_payment_types: [],
          installments: 12,
        },
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook?registration_id=${registration_id}`,
        back_urls: {
          success: `${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/portal/my-tickets?payment=success`,
          failure: `${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/portal/my-tickets?payment=failure`,
          pending: `${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/portal/my-tickets?payment=pending`,
        },
      }),
    });

    const mpData = await mpResponse.json();

    if (mpResponse.status !== 201) {
      console.error('MercadoPago error:', mpData);
      return new Response(JSON.stringify({ 
        error: 'Erro ao criar pagamento',
        details: mpData,
        manual_payment: true 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update registration with payment info
    await adminClient
      .from('event_registrations')
      .update({
        external_payment_id: mpData.id,
        payment_gateway: 'mercadopago',
      })
      .eq('id', registration_id);

    return new Response(JSON.stringify({
      success: true,
      payment_id: mpData.id,
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
      payment_method: 'mercadopago',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Payment error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getChurchPixKey(churchId: string, adminClient: any) {
  const { data: church } = await adminClient
    .from('churches')
    .select('pix_key, pix_key_type, bank_name, bank_agency, bank_account')
    .eq('id', churchId)
    .single();
  return church?.pix_key || null;
}
