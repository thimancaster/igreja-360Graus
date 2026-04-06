import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL") || "";
    const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY") || "";
    const evolutionInstance = Deno.env.get("EVOLUTION_INSTANCE") || "default";

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { announcement_id, is_resend = false } = await req.json();

    if (!announcement_id) {
      return new Response(
        JSON.stringify({ error: "announcement_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Buscar o chamado urgente
    const { data: announcement, error: annErr } = await supabase
      .from("announcements")
      .select("*, created_by")
      .eq("id", announcement_id)
      .single();

    if (annErr || !announcement) {
      return new Response(
        JSON.stringify({ error: "Announcement not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Buscar responsáveis vinculados à criança (target_child_ids)
    const childIds: string[] = announcement.target_child_ids || [];
    if (childIds.length === 0) {
      return new Response(
        JSON.stringify({ message: "No children targeted", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Buscar profiles dos responsáveis com telefone
    const { data: guardians, error: gErr } = await supabase
      .from("child_guardians")
      .select("guardian_id, guardians!inner(full_name, profile_id, profiles!inner(phone))")
      .in("child_id", childIds);

    if (gErr) {
      console.error("Error fetching guardians:", gErr);
    }

    const phones: { name: string; phone: string }[] = [];
    for (const cg of (guardians || [])) {
      const g = (cg as any).guardians;
      const phone = g?.profiles?.phone;
      if (phone) {
        phones.push({ name: g.full_name, phone: phone.replace(/\D/g, "") });
      }
    }

    // 4. Formatar mensagem
    const resendPrefix = is_resend ? "⚠️ *REENVIO DE CHAMADO URGENTE*\n\n" : "";
    const message = `${resendPrefix}🚨 *CHAMADO URGENTE - Portal Kids*\n\n` +
      `*${announcement.title}*\n${announcement.content}\n\n` +
      `Por favor, acesse o Portal Kids e clique em *'Estou a Caminho'* para confirmar.\n\n` +
      `_Igreja 360° • Sistema Ministerial_`;

    let sentCount = 0;
    const errors: string[] = [];

    // 5. Enviar via Evolution API (gratuito - usa WhatsApp Web)
    if (evolutionApiUrl && evolutionApiKey && phones.length > 0) {
      for (const { phone } of phones) {
        try {
          // Formatar número para WhatsApp (DDI + número)
          const whatsappNumber = phone.startsWith("55") ? phone : `55${phone}`;
          
          const response = await fetch(
            `${evolutionApiUrl}/message/sendText/${evolutionInstance}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "apikey": evolutionApiKey,
              },
              body: JSON.stringify({
                number: `${whatsappNumber}@s.whatsapp.net`,
                text: message,
              }),
            }
          );

          if (response.ok) {
            sentCount++;
            console.log(`WhatsApp sent to ${whatsappNumber}`);
          } else {
            const err = await response.text();
            errors.push(`Failed for ${phone}: ${err}`);
            console.error(`Failed to send to ${phone}:`, err);
          }
        } catch (err) {
          errors.push(`Network error for ${phone}: ${err}`);
          console.error("Network error:", err);
        }
      }
    } else {
      console.log("Evolution API not configured. Phones found:", phones.length);
    }

    // 6. Atualizar last_alert_sent_at no anúncio
    await supabase
      .from("announcements")
      .update({ last_alert_sent_at: new Date().toISOString() })
      .eq("id", announcement_id);

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        phones_found: phones.length,
        evolution_configured: !!(evolutionApiUrl && evolutionApiKey),
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-whatsapp-urgent:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
