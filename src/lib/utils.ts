// ==============================================================================
// TOTUS TV - FORMATTERS & UTILITIES
// ==============================================================================

/**
 * Formata um número para o padrão de moeda brasileira (R$ 0,00)
 */
export function formatCurrency(value: number | undefined | null): string {
  const num = typeof value === 'number' && !isNaN(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Formata data no formato brasileiro DD/MM/YYYY
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    // Trata YYYY-MM-DD
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

/**
 * Formata data e hora no formato brasileiro DD/MM/YYYY HH:mm
 */
export function formatDateTime(dateTimeString: string | undefined | null): string {
  if (!dateTimeString) return '-';
  try {
    const d = new Date(dateTimeString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateTimeString;
  }
}

/**
 * Formata telefone para formato de WhatsApp brasileiro: (XX) XXXXX-XXXX
 */
export function formatPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Retorna número pronto para link do WhatsApp (ex: 5511999999999)
 */
export function cleanWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }
  if (digits.length >= 10) {
    return `55${digits}`;
  }
  return digits;
}

/**
 * Gera data YYYY-MM-DD para um dia específico e competência
 * Tratando meses curtos (ex: dia 30 em fevereiro vira o último dia do mês)
 */
export function getValidDateForMonth(year: number, month: number, targetDay: number): string {
  // month: 1-12
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const safeDay = Math.min(targetDay, lastDayOfMonth);
  const m = String(month).padStart(2, '0');
  const d = String(safeDay).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * Retorna se uma data é hoje
 */
export function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;
  return dateStr.split('T')[0] === todayStr;
}

/**
 * Retorna se uma data é amanhã
 */
export function isTomorrow(dateStr: string): boolean {
  if (!dateStr) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const y = tomorrow.getFullYear();
  const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const d = String(tomorrow.getDate()).padStart(2, '0');
  const tomorrowStr = `${y}-${m}-${d}`;
  return dateStr.split('T')[0] === tomorrowStr;
}

/**
 * Retorna se uma data está no passado (atrasada)
 */
export function isPastDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return false;
  const target = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return target < today;
}

/**
 * Nome do mês em português
 */
export function getMonthName(month: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[month - 1] || `Mês ${month}`;
}

/**
 * Formata o texto amigável exibido na badge de status de cobrança
 */
export function formatStatusBadge(status?: string): string {
  if (!status) return '-';
  if (status === 'prometeu_pagar') return 'prazo';
  if (status === 'dispensado_aniversario') return 'aniversariante';
  return status.replace(/_/g, ' ');
}

/**
 * Retorna se o cliente faz aniversário hoje
 */
export function isBirthdayToday(birthDateStr?: string | null): boolean {
  if (!birthDateStr) return false;
  const parts = birthDateStr.split('T')[0].split('-');
  if (parts.length !== 3) return false;
  const today = new Date();
  const m = today.getMonth() + 1;
  const d = today.getDate();
  return parseInt(parts[1], 10) === m && parseInt(parts[2], 10) === d;
}

/**
 * Retorna se o cliente faz aniversário no mês corrente
 */
export function isBirthdayThisMonth(birthDateStr?: string | null): boolean {
  if (!birthDateStr) return false;
  const parts = birthDateStr.split('T')[0].split('-');
  if (parts.length !== 3) return false;
  const today = new Date();
  const m = today.getMonth() + 1;
  return parseInt(parts[1], 10) === m;
}

/**
 * Retorna quantos dias faltam para o aniversário do cliente no mês atual (ou negativo se já passou)
 */
export function getDaysUntilBirthday(birthDateStr?: string | null): number | null {
  if (!birthDateStr) return null;
  const parts = birthDateStr.split('T')[0].split('-');
  if (parts.length !== 3) return null;
  const today = new Date();
  const currentDay = today.getDate();
  const birthDay = parseInt(parts[2], 10);
  return birthDay - currentDay;
}

/**
 * Retorna quantos dias uma cobrança está atrasada
 */
export function getOverdueDays(dueDateStr: string): number {
  if (!dueDateStr) return 0;
  const parts = dueDateStr.split('T')[0].split('-');
  if (parts.length !== 3) return 0;
  const due = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
