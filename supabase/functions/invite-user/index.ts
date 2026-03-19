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
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify the caller is authenticated
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, fullName, role, churchId, directRegistration, temporaryPassword } = await req.json();

    if (!email || !fullName || !role || !churchId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    if (directRegistration && temporaryPassword) {
      // Direct registration: create user with password
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      if (createError) {
        console.error('Create user error:', createError);
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const userId = newUser.user.id;

      // Update profile with church_id
      await adminClient
        .from('profiles')
        .update({ church_id: churchId, full_name: fullName })
        .eq('id', userId);

      // Assign role
      await adminClient
        .from('user_roles')
        .insert({ user_id: userId, role });

      return new Response(JSON.stringify({ 
        message: `Usuário ${fullName} cadastrado com sucesso!`,
        userId 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Invite flow: create user with invite
      const { data: newUser, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName },
      });

      if (inviteError) {
        console.error('Invite user error:', inviteError);
        return new Response(JSON.stringify({ error: inviteError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const userId = newUser.user.id;

      // Update profile with church_id
      await adminClient
        .from('profiles')
        .update({ church_id: churchId, full_name: fullName })
        .eq('id', userId);

      // Assign role
      await adminClient
        .from('user_roles')
        .insert({ user_id: userId, role });

      return new Response(JSON.stringify({ 
        message: `Convite enviado para ${email} com sucesso!`,
        userId 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (err) {
    console.error('invite-user error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
