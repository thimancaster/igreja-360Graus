import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Converts #RRGGBB → "H S% L%" for use in CSS hsl() */
function hexToHSL(hex: string | null | undefined): string | null {
  if (typeof hex !== 'string' || !hex.startsWith('#')) return null;
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

/** Lightens a hex color slightly for gradient end-stop */
function lightenHex(hex: string | null | undefined, amount = 15): string {
  if (typeof hex !== 'string' || !hex.startsWith('#')) return hex || '#f97316';
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.min(255, r + amount);
  g = Math.min(255, g + amount);
  b = Math.min(255, b + amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
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
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (!colors) return;
    const root = document.documentElement;

    const primary   = hexToHSL((colors as any).primary_color);
    const secondary = hexToHSL((colors as any).secondary_color);
    const accent    = hexToHSL((colors as any).accent_color);

    const primaryHex   = (colors as any).primary_color;
    const secondaryHex = (colors as any).secondary_color || lightenHex(primaryHex, 20);

    // ── Core color tokens ──
    if (primary) {
      root.style.setProperty('--primary',         primary);
      root.style.setProperty('--ring',            primary);
      root.style.setProperty('--brand-1',         primary);
      root.style.setProperty('--aurora-1',        primary);
      root.style.setProperty('--sidebar-primary', primary);
      root.style.setProperty('--sidebar-ring',    primary);
    }
    if (secondary) {
      root.style.setProperty('--secondary', secondary);
      root.style.setProperty('--brand-2',   secondary);
      root.style.setProperty('--aurora-2',  secondary);
    }
    if (accent) {
      root.style.setProperty('--accent',   accent);
      root.style.setProperty('--brand-3',  accent);
      root.style.setProperty('--aurora-3', accent);
    }

    // ── Derived gradient tokens ──
    if (primaryHex && secondaryHex) {
      const grad = `linear-gradient(135deg, ${primaryHex}, ${secondaryHex})`;
      root.style.setProperty('--gradient-brand',       grad);
      root.style.setProperty('--gradient-aurora',      grad);
      root.style.setProperty('--gradient-primary',     grad);
      root.style.setProperty('--gradient-brand-vivid', `linear-gradient(135deg, ${(colors as any).accent_color || primaryHex}, ${primaryHex}, ${secondaryHex})`);

      const pHSL = hexToHSL(primaryHex);
      const sHSL = hexToHSL(secondaryHex);
      if (pHSL) {
        root.style.setProperty('--glow-primary',   `0 0 24px hsl(${pHSL} / 0.40)`);
        root.style.setProperty('--shadow-glow',    `0 0 20px hsl(${pHSL} / 0.30)`);
      }
      if (sHSL) {
        root.style.setProperty('--glow-secondary', `0 0 24px hsl(${sHSL} / 0.35)`);
      }
    }

    return () => {
      const vars = [
        '--primary', '--secondary', '--accent', '--ring',
        '--brand-1', '--brand-2', '--brand-3',
        '--aurora-1', '--aurora-2', '--aurora-3',
        '--sidebar-primary', '--sidebar-ring',
        '--gradient-brand', '--gradient-aurora', '--gradient-primary', '--gradient-brand-vivid',
        '--glow-primary', '--glow-secondary', '--shadow-glow',
      ];
      vars.forEach(v => root.style.removeProperty(v));
    };
  }, [colors]);

  return { colors };
}
