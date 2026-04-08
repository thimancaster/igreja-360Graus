import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { EventRevenueAuthorization } from '@/types/event-checkin';

export function useEventFinance() {
  const { user } = useAuth();
  const { isAdmin, isTesoureiro } = useRole();
  const queryClient = useQueryClient();

  const canAuthorize = isAdmin || isTesoureiro;

  const usePendingAuthorizations = () => {
    return useQuery({
      queryKey: ['pending-event-authorizations'],
      queryFn: async () => {
        if (!canAuthorize) return [];
        
        const { data, error } = await supabase
          .from('event_revenue_authorizations')
          .select(`
            *,
            event:ministry_events(title),
            member:members(full_name)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching pending authorizations:', error);
          throw error;
        }
        return data as EventRevenueAuthorization[];
      },
      enabled: canAuthorize,
    });
  };

  const useAllAuthorizations = (status?: 'pending' | 'authorized' | 'rejected') => {
    return useQuery({
      queryKey: ['event-authorizations', status],
      queryFn: async () => {
        if (!canAuthorize) return [];
        
        let query = supabase
          .from('event_revenue_authorizations')
          .select(`
            *,
            event:ministry_events(title),
            member:members(full_name)
          `);
        
        if (status) {
          query = query.eq('status', status);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching authorizations:', error);
          throw error;
        }
        return data as EventRevenueAuthorization[];
      },
      enabled: canAuthorize,
    });
  };

  const useAuthorizationStats = () => {
    return useQuery({
      queryKey: ['event-authorization-stats'],
      queryFn: async () => {
        if (!canAuthorize) return { pending: 0, authorized: 0, rejected: 0, totalPending: 0 };
        
        const { data, error } = await supabase
          .from('event_revenue_authorizations')
          .select('status, amount');
        
        if (error) throw error;
        
        const stats = {
          pending: data?.filter(d => d.status === 'pending').length || 0,
          authorized: data?.filter(d => d.status === 'authorized').length || 0,
          rejected: data?.filter(d => d.status === 'rejected').length || 0,
          totalPending: data
            ?.filter(d => d.status === 'pending')
            .reduce((sum, d) => sum + (d.amount || 0), 0) || 0,
        };
        
        return stats;
      },
      enabled: canAuthorize,
    });
  };

  const authorizeRevenue = useMutation({
    mutationFn: async (authorizationId: string) => {
      if (!user?.id) throw new Error('Não autenticado');
      
      const { data: auth, error: fetchError } = await supabase
        .from('event_revenue_authorizations')
        .select('*, event:ministry_events(title)')
        .eq('id', authorizationId)
        .single();

      if (fetchError) throw fetchError;
      if (!auth) throw new Error('Autorização não encontrada');

      const { data: transactionId, error: rpcError } = await supabase.rpc('register_event_revenue', {
        p_registration_id: auth.registration_id,
        p_user_id: user.id
      });

      if (rpcError) throw rpcError;

      await supabase
        .from('event_revenue_authorizations')
        .update({ 
          status: 'authorized', 
          authorized_by: user.id, 
          authorized_at: new Date().toISOString() 
        })
        .eq('id', authorizationId);

      return transactionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-event-authorizations'] });
      queryClient.invalidateQueries({ queryKey: ['event-authorizations'] });
      queryClient.invalidateQueries({ queryKey: ['event-authorization-stats'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const rejectAuthorization = useMutation({
    mutationFn: async (authorizationId: string) => {
      if (!user?.id) throw new Error('Não autenticado');
      
      const { error } = await supabase
        .from('event_revenue_authorizations')
        .update({ 
          status: 'rejected', 
          authorized_by: user.id, 
          authorized_at: new Date().toISOString() 
        })
        .eq('id', authorizationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-event-authorizations'] });
      queryClient.invalidateQueries({ queryKey: ['event-authorizations'] });
      queryClient.invalidateQueries({ queryKey: ['event-authorization-stats'] });
    },
  });

  const autoRegisterRevenue = useMutation({
    mutationFn: async (registrationId: string) => {
      const { data, error } = await supabase.rpc('register_event_revenue', {
        p_registration_id: registrationId
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const createPendingAuthorization = async (
    registrationId: string,
    eventId: string,
    amount: number,
    churchId: string,
    memberId?: string
  ) => {
    const { error } = await supabase
      .from('event_revenue_authorizations')
      .insert({
        church_id: churchId,
        registration_id: registrationId,
        event_id: eventId,
        amount: amount,
        member_id: memberId,
        status: 'pending',
      });

    if (error) throw error;
  };

  return {
    usePendingAuthorizations,
    useAllAuthorizations,
    useAuthorizationStats,
    authorizeRevenue,
    rejectAuthorization,
    autoRegisterRevenue,
    createPendingAuthorization,
    canAuthorize,
  };
}