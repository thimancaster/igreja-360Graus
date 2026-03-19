import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify the user is authenticated
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { person_type, person_id, entered_pin } = await req.json();

    if (!person_type || !person_id || !entered_pin) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role to read PINs (never exposed to client)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    let storedPin: string | null = null;

    if (person_type === 'guardian') {
      const { data, error } = await adminClient
        .from('guardians')
        .select('access_pin')
        .eq('id', person_id)
        .single();
      if (error) throw error;
      storedPin = data?.access_pin;
    } else if (person_type === 'authorized') {
      const { data, error } = await adminClient
        .from('authorized_pickups')
        .select('pickup_pin')
        .eq('id', person_id)
        .single();
      if (error) throw error;
      storedPin = data?.pickup_pin;
    } else if (person_type === 'temporary') {
      const { data, error } = await adminClient
        .from('pickup_authorizations')
        .select('notes')
        .eq('id', person_id)
        .single();
      if (error) throw error;

      const notes = data?.notes ?? '';
      const pinMatch = notes.match(/(?:^|\|\s)PIN:\s*(\d{4,6})(?:\s*\||$)/i);
      storedPin = pinMatch?.[1] ?? null;
    } else {
      return new Response(JSON.stringify({ error: 'Invalid person type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const valid = storedPin != null && entered_pin === storedPin;

    return new Response(JSON.stringify({ valid }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('verify-pickup-pin error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
