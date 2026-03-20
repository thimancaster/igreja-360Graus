import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function hexToHSL(hex: string): string | null {
  if (!hex || !hex.startsWith('#')) return null;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function useChurchTheme() {
  const { profile } = useAuth();

  const { data: colors } = useQuery({
    queryKey: ['church-theme', profile?.church_id],
    queryFn: async () => {
      if (!profile?.church_id) return null;
      const { data } = await supabase
        .from('churches')
        .select('primary_color, secondary_color, accent_color, logo_url')
        .eq('id', profile.church_id)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.church_id,
    staleTime: 1000 * 60 * 10, // 10 min cache
  });

  useEffect(() => {
    if (!colors) return;
    const root = document.documentElement;

    const primary = hexToHSL((colors as any).primary_color);
    const secondary = hexToHSL((colors as any).secondary_color);
    const accent = hexToHSL((colors as any).accent_color);

    if (primary) root.style.setProperty('--primary', primary);
    if (secondary) root.style.setProperty('--secondary', secondary);
    if (accent) root.style.setProperty('--accent', accent);

    return () => {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--secondary');
      root.style.removeProperty('--accent');
    };
  }, [colors]);

  return { colors };
}
