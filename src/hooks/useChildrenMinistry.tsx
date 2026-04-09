import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type Child = {
  id: string;
  church_id: string;
  full_name: string;
  birth_date: string;
  photo_url: string | null;
  classroom: string;
  allergies: string | null;
  medications: string | null;
  special_needs: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  image_consent: boolean;
  notes: string | null;
  status: string;
  behavior_points: number;
  created_at: string;
  updated_at: string;
};

export type Guardian = {
  id: string;
  church_id: string;
  profile_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  relationship: string;
  access_pin: string | null;
  cpf: string | null;
  created_at: string;
  updated_at: string;
};

export type ChildGuardian = {
  id: string;
  child_id: string;
  guardian_id: string;
  is_primary: boolean;
  can_pickup: boolean;
  created_at: string;
};

export type AuthorizedPickup = {
  id: string;
  child_id: string;
  authorized_name: string;
  authorized_phone: string | null;
  authorized_photo: string | null;
  relationship: string | null;
  pickup_pin: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ChildCheckIn = {
  id: string;
  child_id: string;
  church_id: string;
  event_date: string;
  event_name: string;
  classroom: string | null;
  label_number: string | null;
  qr_code: string;
  checked_in_at: string;
  checked_in_by: string | null;
  checked_out_at: string | null;
  checked_out_by: string | null;
  pickup_person_name: string | null;
  pickup_method: string;
  notes: string | null;
  behavior_score?: number | null;
  participation_score?: number | null;
  session_notes?: string | null;
  created_at: string;
};

export type ChildWithGuardians = Child & {
  guardians: (Guardian & { is_primary: boolean; can_pickup: boolean })[];
};

export type ChildEvaluation = {
  id: string;
  church_id: string;
  child_id: string;
  teacher_id: string | null;
  check_in_id: string | null;
  behavior_score: number;
  participation_score: number;
  interaction_score: number;
  notes: string | null;
  points_earned: number;
  created_at: string;
};

export const CLASSROOMS = [
  "Berçário",
  "Maternal",
  "Infantil 1",
  "Infantil 2",
  "Infantil 3",
  "Pré-adolescente",
];

export const RELATIONSHIPS = [
  "Pai",
  "Mãe",
  "Pai/Mãe",
  "Avô",
  "Avó",
  "Tio",
  "Tia",
  "Irmão(ã)",
  "Outro",
];

export function useChildren() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["children", profile?.church_id],
    queryFn: async () => {
      if (!profile?.church_id) return [];

      const { data, error } = await supabase
        .from("children")
        .select("*")
        .eq("church_id", profile.church_id)
        .order("full_name");

      if (error) throw error;
      return data as Child[];
    },
    enabled: !!profile?.church_id,
  });
}

export function useChildWithGuardians(childId: string | undefined) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["child-with-guardians", childId],
    queryFn: async () => {
      if (!childId) return null;

      // Fetch child
      const { data: child, error: childError } = await supabase
        .from("children")
        .select("*")
        .eq("id", childId)
        .single();

      if (childError) throw childError;

      // Fetch guardians linked to this child (exclude access_pin for security)
      const { data: childGuardians, error: cgError } = await supabase
        .from("child_guardians")
        .select(`
          guardian_id,
          is_primary,
          can_pickup,
          guardians:guardian_id (id, church_id, profile_id, full_name, email, phone, photo_url, relationship, created_at, updated_at)
        `)
        .eq("child_id", childId);

      if (cgError) throw cgError;

      const guardians = childGuardians.map((cg: any) => ({
        ...cg.guardians,
        is_primary: cg.is_primary,
        can_pickup: cg.can_pickup,
      }));

      return { ...child, guardians } as ChildWithGuardians;
    },
    enabled: !!childId && !!profile?.church_id,
  });
}

// Safe guardian type for display (excludes PII like access_pin)
export type GuardianSafe = Omit<Guardian, 'access_pin' | 'email' | 'phone'> & {
  access_pin?: never;
  email?: never;
  phone?: never;
};

export function useGuardians() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["guardians", profile?.church_id],
    queryFn: async () => {
      if (!profile?.church_id) return [];

      // Use guardians_safe view to prevent PII exposure (hashed PINs, emails, phones)
      // Staff with management access can still use the full guardians table when needed
      const { data, error } = await supabase
        .from("guardians_safe")
        .select("*")
        .eq("church_id", profile.church_id)
        .order("full_name");

      if (error) throw error;
      
      // Map to Guardian type with null PII fields for compatibility
      return (data || []).map(g => ({
        ...g,
        email: null,
        phone: null,
        access_pin: null,
      })) as Guardian[];
    },
    enabled: !!profile?.church_id,
  });
}

// Hook to get guardian data for management (admin/tesoureiro/pastor only)
// Uses a SECURITY DEFINER RPC that returns only necessary fields (excludes access_pin)
export function useGuardianManagement() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["guardians-management", profile?.church_id],
    queryFn: async () => {
      if (!profile?.church_id) return [];

      // Use secure RPC that enforces role checks and excludes access_pin
      const { data, error } = await supabase.rpc("get_guardians_for_management", { p_church_id: profile.church_id });

      if (error) throw error;
      
      // Map to Guardian type with null access_pin for compatibility
      return (data || []).map((g: any) => ({
        ...g,
        access_pin: null,
      })) as Guardian[];
    },
    enabled: !!profile?.church_id,
  });
}

export function useAuthorizedPickups(childId: string | undefined) {
  return useQuery({
    queryKey: ["authorized-pickups", childId],
    queryFn: async () => {
      if (!childId) return [];

      const { data, error } = await supabase
        .from("authorized_pickups")
        .select("id, child_id, authorized_name, authorized_phone, authorized_photo, relationship, is_active, created_at, updated_at")
        .eq("child_id", childId)
        .eq("is_active", true)
        .order("authorized_name");

      if (error) throw error;
      return data as AuthorizedPickup[];
    },
    enabled: !!childId,
  });
}

export function useTodayCheckIns() {
  const { profile } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["today-check-ins", profile?.church_id, today],
    queryFn: async () => {
      if (!profile?.church_id) return [];

      const { data, error } = await supabase
        .from("child_check_ins")
        .select(`
          *,
          children:child_id (id, full_name, photo_url, classroom)
        `)
        .eq("church_id", profile.church_id)
        .eq("event_date", today)
        .order("checked_in_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.church_id,
  });
}

export function usePresentChildren() {
  const { profile } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["present-children", profile?.church_id, today],
    queryFn: async () => {
      if (!profile?.church_id) return [];

      const { data, error } = await supabase
        .from("child_check_ins")
        .select(`
          *,
          children:child_id (id, full_name, photo_url, classroom, emergency_contact, emergency_phone)
        `)
        .eq("church_id", profile.church_id)
        .eq("event_date", today)
        .is("checked_out_at", null)
        .order("checked_in_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.church_id,
  });
}

export function useChildMutations() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();

  const createChild = useMutation({
    mutationFn: async (child: Omit<Child, "id" | "church_id" | "created_at" | "updated_at">) => {
      if (!profile?.church_id) throw new Error("Igreja não encontrada");

      // Check for duplicate child (same name + birth_date in same church)
      const { data: existing } = await supabase
        .from("children")
        .select("id, full_name")
        .eq("church_id", profile.church_id)
        .eq("full_name", child.full_name)
        .eq("birth_date", child.birth_date)
        .maybeSingle();

      if (existing) {
        const confirmOverride = window.confirm(
          `Já existe uma criança cadastrada com o nome "${existing.full_name}" e mesma data de nascimento. Deseja cadastrar mesmo assim?`
        );
        if (!confirmOverride) {
          throw new Error("Cadastro cancelado pelo usuário.");
        }
      }

      const { data, error } = await supabase
        .from("children")
        .insert({ ...child, church_id: profile.church_id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Criança cadastrada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar criança: ${error.message}`);
    },
  });

  const updateChild = useMutation({
    mutationFn: async ({ id, ...child }: Partial<Child> & { id: string }) => {
      const { data, error } = await supabase
        .from("children")
        .update(child)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Criança atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["children"] });
      queryClient.invalidateQueries({ queryKey: ["child-with-guardians"] });
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar criança: ${error.message}`);
    },
  });

  const deleteChild = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("children")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Criança removida com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
    onError: (error) => {
      toast.error(`Erro ao remover criança: ${error.message}`);
    },
  });

  const createGuardian = useMutation({
    mutationFn: async (guardian: Omit<Guardian, "id" | "church_id" | "created_at" | "updated_at">) => {
      if (!profile?.church_id) throw new Error("Igreja não encontrada");

      const { data, error } = await supabase
        .from("guardians")
        .insert({ ...guardian, church_id: profile.church_id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Responsável cadastrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["guardians"] });
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar responsável: ${error.message}`);
    },
  });

  const linkGuardianToChild = useMutation({
    mutationFn: async ({ childId, guardianId, isPrimary = false, canPickup = true }: {
      childId: string;
      guardianId: string;
      isPrimary?: boolean;
      canPickup?: boolean;
    }) => {
      // Fetch guardian's relationship to validate duplicates
      const { data: guardian } = await supabase
        .from("guardians")
        .select("relationship")
        .eq("id", guardianId)
        .single();

      if (guardian && (guardian.relationship === "Pai" || guardian.relationship === "Mãe")) {
        // Check if child already has a guardian with the same relationship
        const { data: existingLinks } = await supabase
          .from("child_guardians")
          .select("guardian_id, guardians:guardian_id (relationship)")
          .eq("child_id", childId);

        const hasSameRelationship = existingLinks?.some(
          (link: any) => link.guardians?.relationship === guardian.relationship
        );

        if (hasSameRelationship) {
          throw new Error(`Esta criança já possui um(a) ${guardian.relationship} cadastrado(a).`);
        }
      }

      const { data, error } = await supabase
        .from("child_guardians")
        .insert({
          child_id: childId,
          guardian_id: guardianId,
          is_primary: isPrimary,
          can_pickup: canPickup,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Responsável vinculado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["child-with-guardians"] });
    },
    onError: (error) => {
      toast.error(`Erro ao vincular responsável: ${error.message}`);
    },
  });

  // Helper to notify guardians linked to a child
  const notifyGuardians = async (childId: string, title: string, message: string, link?: string) => {
    try {
      // Get guardians with profile_id for this child
      const { data: links } = await supabase
        .from("child_guardians")
        .select("guardian_id, guardians!child_guardians_guardian_id_fkey(profile_id)")
        .eq("child_id", childId);

      if (!links) return;

      const notifications = links
        .filter((l: any) => l.guardians?.profile_id)
        .map((l: any) => ({
          user_id: l.guardians.profile_id,
          title,
          message,
          type: "checkin",
          link: link || "/parent/history",
        }));

      if (notifications.length > 0) {
        await supabase.from("notifications").insert(notifications);
      }
    } catch (e) {
      // Non-blocking — don't fail check-in/out if notification fails
      console.error("Erro ao notificar responsáveis:", e);
    }
  };

  const checkIn = useMutation({
    mutationFn: async ({ childId, eventName, classroom }: {
      childId: string;
      eventName: string;
      classroom: string;
    }) => {
      if (!profile?.church_id || !user?.id) throw new Error("Usuário não autenticado");

      const today = new Date().toISOString().split("T")[0];
      const qrCode = `${childId}-${today}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const labelNumber = Math.floor(1000 + Math.random() * 9000).toString();

      const { data, error } = await supabase
        .from("child_check_ins")
        .insert({
          child_id: childId,
          church_id: profile.church_id,
          event_date: today,
          event_name: eventName,
          classroom: classroom,
          label_number: labelNumber,
          qr_code: qrCode,
          checked_in_by: user.id,
        })
        .select("*, children:child_id(full_name)")
        .single();

      if (error) throw error;

      // Notify guardians
      const childName = (data as any).children?.full_name || "Seu filho(a)";
      const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      await notifyGuardians(
        childId,
        "✅ Check-in realizado",
        `${childName} fez check-in às ${timeStr} no evento "${eventName}", sala ${classroom}. Etiqueta #${labelNumber}.`,
        "/parent/history"
      );

      return data;
    },
    onSuccess: () => {
      toast.success("Check-in realizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["today-check-ins"] });
      queryClient.invalidateQueries({ queryKey: ["present-children"] });
    },
    onError: (error) => {
      toast.error(`Erro no check-in: ${error.message}`);
    },
  });

  const checkOut = useMutation({
    mutationFn: async ({ 
      checkInId, 
      pickupPersonName, 
      pickupMethod = "QR",
      behaviorScore = 5,
      participationScore = 5,
      sessionNotes = ""
    }: {
      checkInId: string;
      pickupPersonName: string;
      pickupMethod?: string;
      behaviorScore?: number;
      participationScore?: number;
      sessionNotes?: string;
    }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const checkedOutAt = new Date().toISOString();

      // 1. Update Check-In Record with Evaluation
      const { data, error } = await (supabase as any)
        .from("child_check_ins")
        .update({
          checked_out_at: checkedOutAt,
          checked_out_by: user.id,
          pickup_person_name: pickupPersonName,
          pickup_method: pickupMethod,
          behavior_score: behaviorScore,
          participation_score: participationScore,
          session_notes: sessionNotes
        })
        .eq("id", checkInId)
        .select("*, children:child_id(id, full_name, behavior_points)")
        .single();

      if (error) throw error;

      // 2. Award Points automatically (5 for presence + calculated based on score)
      const childData = (data as any).children;
      if (childData) {
        const bonusPoints = (behaviorScore === 5 ? 10 : 0) + (participationScore === 5 ? 10 : 0) + 5;
        const newTotal = (childData.behavior_points || 0) + bonusPoints;
        
        await (supabase as any)
          .from("children")
          .update({ behavior_points: newTotal })
          .eq("id", childData.id);
      }

      // Notify guardians
      const childName = (data as any).children?.full_name || "Seu filho(a)";
      const timeStr = new Date(checkedOutAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const checkinTime = new Date((data as any).checked_in_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      await notifyGuardians(
        (data as any).child_id,
        "🚪 Check-out realizado",
        `${childName} saiu às ${timeStr} (entrada às ${checkinTime}). Retirado por: ${pickupPersonName} (${pickupMethod}).`,
        "/parent/history"
      );

      return data;
    },
    onSuccess: () => {
      toast.success("Check-out realizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["today-check-ins"] });
      queryClient.invalidateQueries({ queryKey: ["present-children"] });
    },
    onError: (error) => {
      toast.error(`Erro no check-out: ${error.message}`);
    },
  });

  const findCheckInByQR = async (qrCode: string) => {
    const { data, error } = await supabase
      .from("child_check_ins")
      .select(`
        *,
        children:child_id (id, full_name, photo_url, classroom)
      `)
      .eq("qr_code", qrCode)
      .is("checked_out_at", null)
      .single();

    if (error) throw error;
    return data;
  };

  return {
    createChild,
    updateChild,
    deleteChild,
    createGuardian,
    linkGuardianToChild,
    checkIn,
    checkOut,
    findCheckInByQR,
  };
}

export function useChildRewards() {
  const queryClient = useQueryClient();

  const awardPoints = useMutation({
    mutationFn: async ({ childId, points, reason }: { childId: string; points: number; reason?: string }) => {
      // 1. Get current points
      const { data: child, error: fetchError } = await (supabase as any)
        .from("children")
        .select("behavior_points, full_name")
        .eq("id", childId)
        .single();

      if (fetchError) throw fetchError;

      const newPoints = (child.behavior_points || 0) + points;

      // 2. Update points
      const { error: updateError } = await (supabase as any)
        .from("children")
        .update({ behavior_points: newPoints } as any)
        .eq("id", childId);

      if (updateError) throw updateError;

      // 3. Optional: Log reward history (if table exists, but for now we just update)
      return { childName: child.full_name, newPoints };
    },
    onSuccess: (data) => {
      toast.success(`Pontos atribuídos para ${data.childName}! Novo total: ${data.newPoints}`);
      queryClient.invalidateQueries({ queryKey: ["children"] });
      queryClient.invalidateQueries({ queryKey: ["parent-children"] });
    },
    onError: (error) => {
      toast.error(`Erro ao atribuir pontos: ${error.message}`);
    },
  });

  return { awardPoints };
}

/** Hook to fetch guardians with their linked children for face check-in */
export function useGuardiansWithChildren() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["guardians-with-children", profile?.church_id],
    queryFn: async () => {
      if (!profile?.church_id) return [];

      // Fetch all guardians with photos
      const { data: guardians, error: gError } = await supabase
        .from("guardians")
        .select("id, full_name, photo_url")
        .eq("church_id", profile.church_id)
        .not("photo_url", "is", null);

      if (gError) throw gError;
      if (!guardians || guardians.length === 0) return [];

      // Fetch all child_guardians links
      const { data: links, error: lError } = await supabase
        .from("child_guardians")
        .select("guardian_id, child_id")
        .in("guardian_id", guardians.map((g) => g.id));

      if (lError) throw lError;

      // Fetch all active children
      const childIds = [...new Set((links || []).map((l) => l.child_id))];
      if (childIds.length === 0) return guardians.map((g) => ({ ...g, children: [] as Child[] }));

      const { data: children, error: cError } = await supabase
        .from("children")
        .select("*")
        .in("id", childIds)
        .eq("status", "active");

      if (cError) throw cError;

      const childMap = new Map((children || []).map((c) => [c.id, c as Child]));

      return guardians.map((g) => ({
        ...g,
        children: (links || [])
          .filter((l) => l.guardian_id === g.id)
          .map((l) => childMap.get(l.child_id))
          .filter(Boolean) as Child[],
      }));
    },
    enabled: !!profile?.church_id,
  });
}

export function useChildEvaluations(childId: string | undefined) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["child-evaluations", childId],
    queryFn: async () => {
      if (!childId) return [];

      const { data, error } = await supabase
        .from("child_evaluations")
        .select("*")
        .eq("child_id", childId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ChildEvaluation[];
    },
    enabled: !!childId && !!profile?.church_id,
  });
}

export function useAddEvaluation() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (evaluation: Omit<ChildEvaluation, "id" | "church_id" | "created_at" | "points_earned" | "teacher_id">) => {
      if (!profile?.church_id) throw new Error("Igreja não encontrada");

      const { data, error } = await supabase
        .from("child_evaluations")
        .insert({
          ...evaluation,
          church_id: profile.church_id,
          teacher_id: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success("Avaliação enviada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["child-evaluations", variables.child_id] });
    },
    onError: (error) => {
      toast.error(`Erro ao enviar avaliação: ${error.message}`);
    },
  });
}
