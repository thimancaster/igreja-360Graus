/* eslint-disable */
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: any) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const evoUrl = Deno.env.get("EVOLUTION_API_URL") ?? "";
    const evoKey = Deno.env.get("EVOLUTION_API_KEY") ?? "";
    const evoInstance = Deno.env.get("EVOLUTION_INSTANCE") ?? "";

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dateStr = tomorrow.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];
    
    // 1. Buscar escalas pendentes para envio de WhatsApp
    const { data: pendingSchedules, error } = await supabaseClient
      .from('volunteer_schedules')
      .select(`
        id,
        schedule_date,
        shift_start,
        volunteer_id,
        whatsapp_reminder_sent,
        department_volunteers( profiles(full_name, phone) )
      `)
      .eq('confirmed', false)
      .not('volunteer_id', 'is', null)
      .eq('whatsapp_reminder_sent', false)
      .lte('schedule_date', dateStr)
      .gte('schedule_date', todayStr);

    if (error) throw error;

    console.log(`Encontrados ${pendingSchedules?.length || 0} turnos pendentes.`);
    let sentCount = 0;

    for (const schedule of pendingSchedules || []) {
      try {
        const phone = schedule.department_volunteers?.profiles?.phone;
        const name = schedule.department_volunteers?.profiles?.full_name?.split(' ')[0] ?? 'Voluntário(a)';
        const time = schedule.shift_start?.slice(0, 5);
        
        if (!phone) continue;

        const cleanPhone = phone.replace(/\D/g, '');
        const jid = `${cleanPhone.startsWith('55') ? cleanPhone : '55'+cleanPhone}`;

        const textMessage = `Olá ${name}! Você foi escalado(a) para amanhã às ${time}. por favor, confirme sua presença aqui no portal:\nhttps://igreja360.com.br/portal/escalas`;

        if (evoUrl && evoKey && evoInstance) {
          const res = await fetch(`${evoUrl}/message/sendText/${evoInstance}`, {
            method: 'POST',
            headers: { 
              'apikey': evoKey, 
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
              number: jid, 
              text: textMessage 
            })
          });

          if (!res.ok) {
             const errData = await res.text();
             throw new Error(errData);
          }
        }

        // Update whatsapp_logs
        await supabaseClient.from('whatsapp_logs').insert({
            schedule_id: schedule.id,
            status: 'success',
            details: 'Mensagem enviada via Evolution API'
        });

        // Flag as sent
        await supabaseClient.from('volunteer_schedules')
            .update({ whatsapp_reminder_sent: true })
            .eq('id', schedule.id);

        sentCount++;
      } catch(err: any) {
        await supabaseClient.from('whatsapp_logs').insert({
            schedule_id: schedule.id,
            status: 'error',
            details: err.message || 'Erro'
        });
      }
    }

    return new Response(JSON.stringify({ 
      message: "Lembretes enviados com sucesso.",
      count: sentCount 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
