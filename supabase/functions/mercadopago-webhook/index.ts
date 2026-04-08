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
<<<<<<< HEAD
          
          // Get registration details for finance integration
          const { data: registration } = await adminClient
            .from('event_registrations')
            .select('*, event:ministry_events(*)')
            .eq('id', externalRef)
            .single();
          
          if (registration?.event) {
            const event = registration.event;
            
            // Check if event has auto_register_finance enabled
            if (event.auto_register_finance) {
              // Auto-register revenue
              try {
                await adminClient.rpc('register_event_revenue', {
                  p_registration_id: externalRef,
                });
                console.log(`Revenue auto-registered for registration: ${externalRef}`);
              } catch (rpcError) {
                console.error('Error auto-registering revenue:', rpcError);
              }
            } else {
              // Create pending authorization (manual approval required)
              try {
                await adminClient
                  .from('event_revenue_authorizations')
                  .insert({
                    church_id: registration.church_id,
                    registration_id: externalRef,
                    event_id: registration.event_id,
                    amount: registration.payment_amount,
                    member_id: registration.member_id,
                    status: 'pending',
                  });
                console.log(`Pending authorization created for registration: ${externalRef}`);
              } catch (authError) {
                console.error('Error creating pending authorization:', authError);
              }
            }
          }
=======
>>>>>>> ea0e00c26700a4a8024edb0266eac8019f4f032c
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
