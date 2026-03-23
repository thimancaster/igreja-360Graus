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
    const { email, password, full_name, phone, church_id } = await req.json();

    if (!email || !password || !full_name || !church_id) {
      return new Response(JSON.stringify({ error: 'Campos obrigatórios: email, password, full_name, church_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Verify church exists
    const { data: church, error: churchError } = await adminClient
      .from('churches')
      .select('id')
      .eq('id', church_id)
      .single();

    if (churchError || !church) {
      return new Response(JSON.stringify({ error: 'Igreja não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify that the email is pre-approved: must exist as a guardian or member in this church
    const { data: matchingGuardian } = await adminClient
      .from('guardians')
      .select('id')
      .eq('church_id', church_id)
      .eq('email', email.trim().toLowerCase())
      .limit(1);

    const { data: matchingMember } = await adminClient
      .from('members')
      .select('id')
      .eq('church_id', church_id)
      .eq('email', email.trim().toLowerCase())
      .limit(1);

    const isPreApproved = (matchingGuardian && matchingGuardian.length > 0) || 
                          (matchingMember && matchingMember.length > 0);

    if (!isPreApproved) {
      return new Response(JSON.stringify({ 
        error: 'Seu email não está cadastrado nesta igreja. Peça ao administrador para cadastrá-lo primeiro.' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (authError) {
      if (authError.message?.includes('already been registered')) {
        return new Response(JSON.stringify({ error: 'Este email já está cadastrado. Faça login.' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw authError;
    }

    const userId = authData.user.id;

    // Update profile with church_id
    await adminClient
      .from('profiles')
      .update({ church_id, full_name })
      .eq('id', userId);

    // Assign 'membro' role
    await adminClient
      .from('user_roles')
      .insert({ user_id: userId, role: 'membro' });

    // Auto-link guardian if email matches
    if (matchingGuardian && matchingGuardian.length > 0) {
      for (const guardian of matchingGuardian) {
        await adminClient
          .from('guardians')
          .update({ profile_id: userId })
          .eq('id', guardian.id)
          .is('profile_id', null);
      }
    }

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('portal-signup error:', err);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
