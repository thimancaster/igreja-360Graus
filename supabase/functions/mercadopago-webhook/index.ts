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

    const { type } = await req.json();

    // Handle merchant_order (payment approved)
    if (type === 'payment' || type === 'merchant_order') {
      const topic = req.headers.get('x-mp-topic') || 'payment';
      const paymentId = req.headers.get('x-mp-payment-id');

      let paymentData;
      
      // Try to get payment data from MercadoPago
      if (paymentId) {
        const { data: churchSettings } = await adminClient
          .from('payment_settings')
          .select('mercadopago_access_token')
          .eq('gateway', 'mercadopago')
          .eq('is_active', true)
          .limit(1)
          .single();

        if (churchSettings?.mercadopago_access_token) {
          const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
              'Authorization': `Bearer ${churchSettings.mercadopago_access_token}`,
            },
          });
          paymentData = await mpResponse.json();
        }
      }

      if (!paymentData && req.bodyUsed === false) {
        // Parse body if not already read
        const body = await req.json();
        paymentData = body;
      }

      const externalRef = paymentData?.external_reference || paymentData?.external_reference;
      const status = paymentData?.status;
      const statusDetail = paymentData?.status_detail;

      if (externalRef && status === 'approved') {
        // Update registration to paid
        const { error: updateError } = await adminClient
          .from('event_registrations')
          .update({
            payment_status: 'paid',
            ticket_status: 'paid',
            payment_date: new Date().toISOString(),
          })
          .eq('id', externalRef);

        if (updateError) {
          console.error('Error updating registration:', updateError);
        } else {
          console.log(`Payment approved for registration: ${externalRef}`);
        }
      }

      // Log webhook
      await adminClient
        .from('payment_webhooks')
        .insert({
          church_id: paymentData?.payer?.entity_type ? null : null,
          gateway: 'mercadopago',
          event_type: topic,
          payload: paymentData,
          processed: true,
          processed_at: new Date().toISOString(),
        });

      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ received: true, type }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
