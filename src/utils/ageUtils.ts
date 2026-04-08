import { differenceInYears, differenceInMonths } from "date-fns";

/**
 * Formats age from birth date into a string like "2 anos e 3 meses"
 */
export function calculateFormattedAge(birthDate: string | Date | null | undefined): string {
  if (!birthDate) return "Idade não informada";
  
  const birth = new Date(birthDate);
  const now = new Date();
  
  const years = differenceInYears(now, birth);
  const totalMonths = differenceInMonths(now, birth);
  const remainingMonths = totalMonths % 12;
  
  if (years === 0) {
    if (totalMonths === 0) return "Menos de 1 mês";
    return `${totalMonths} ${totalMonths === 1 ? 'mês' : 'meses'}`;
  }
  
  if (remainingMonths === 0) {
    return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  }
  
  const yearsStr = `${years} ${years === 1 ? 'ano' : 'anos'}`;
  const monthsStr = `${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}`;
  
  return `${yearsStr} e ${monthsStr}`;
}

/**
 * Converts months to a formatted age string (useful for classroom range labels)
 */
export function formatMonthsToAge(months: number | null | undefined): string {
  if (months === null || months === undefined) return "N/A";
  if (months === 0) return "0 meses";
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (years === 0) {
    return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  }
  
  if (remainingMonths === 0) {
    return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  }
  
  const yearsStr = `${years} ${years === 1 ? 'ano' : 'anos'}`;
  const monthsStr = `${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}`;
  
  return `${yearsStr} e ${monthsStr}`;
}
