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

    const { to, subject, template, data } = await req.json();

    if (!to || !subject || !template) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: to, subject, template' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: pendingEmail, error: insertError } = await adminClient
      .from('pending_emails')
      .insert({
        to_email: to,
        subject: subject,
        template: template,
        payload: data,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating pending email:', insertError);
    }

    console.log(`[EMAIL STUB] Email queued: ${to} - ${subject}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email queued for processing',
      email_id: pendingEmail?.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Email function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});