import { useMemo } from 'react';
import { Member } from './useMembers';

interface DuplicateGroup {
  key: string;
  members: Member[];
  reason: string;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      d[i][j] = a[i - 1] === b[j - 1]
        ? d[i - 1][j - 1]
        : 1 + Math.min(d[i - 1][j], d[i][j - 1], d[i - 1][j - 1]);
    }
  }
  return d[m][n];
}

function areSimilar(a: string, b: string): boolean {
  if (a === b) return true;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return true;
  const dist = levenshtein(a, b);
  return dist <= Math.max(2, Math.floor(maxLen * 0.15));
}

export function useDuplicateMembers(members: Member[] | undefined): DuplicateGroup[] {
  return useMemo(() => {
    if (!members || members.length < 2) return [];

    const groups: Map<string, { members: Member[]; reason: string }> = new Map();
    const assigned = new Set<string>();

    // Sort by name for consistent grouping
    const sorted = [...members].sort((a, b) => a.full_name.localeCompare(b.full_name));

    for (let i = 0; i < sorted.length; i++) {
      if (assigned.has(sorted[i].id)) continue;
      const nameA = normalize(sorted[i].full_name);

      const group: Member[] = [sorted[i]];

      for (let j = i + 1; j < sorted.length; j++) {
        if (assigned.has(sorted[j].id)) continue;
        const nameB = normalize(sorted[j].full_name);

        // Check exact name match
        if (nameA === nameB) {
          group.push(sorted[j]);
          continue;
        }

        // Check fuzzy name similarity
        if (areSimilar(nameA, nameB)) {
          group.push(sorted[j]);
          continue;
        }

        // Check same phone or email (if both exist)
        if (
          sorted[i].phone && sorted[j].phone &&
          sorted[i].phone.replace(/\D/g, '') === sorted[j].phone.replace(/\D/g, '')
        ) {
          group.push(sorted[j]);
          continue;
        }

        if (
          sorted[i].email && sorted[j].email &&
          sorted[i].email.toLowerCase() === sorted[j].email.toLowerCase()
        ) {
          group.push(sorted[j]);
          continue;
        }
      }

      if (group.length > 1) {
        const key = group.map(m => m.id).sort().join('-');
        for (const m of group) assigned.add(m.id);

        // Determine reason
        const names = group.map(m => normalize(m.full_name));
        const allSameName = names.every(n => n === names[0]);
        const reason = allSameName
          ? 'Nomes idênticos'
          : 'Nomes semelhantes ou dados de contato iguais';

        groups.set(key, { members: group, reason });
      }
    }

    return Array.from(groups.entries()).map(([key, val]) => ({
      key,
      members: val.members,
      reason: val.reason,
    }));
  }, [members]);
}
