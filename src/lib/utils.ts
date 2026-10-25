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
 * Formata aniversário apenas como Dia e Mês (DD/MM)
 */
export function formatAniversario(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}`;
    }
    return dateString;
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
 * Formata telefone para exibição legível com máscara (Brasil ou Internacional)
 */
export function formatPhone(phone: string): string {
  if (!phone) return '';
  const trimmed = phone.trim();

  // Se já possui DDI internacional explícito com '+'
  if (trimmed.startsWith('+')) {
    // Se for +55 sem formatação (ex: +5521995651510)
    const digitsOnly = trimmed.slice(1).replace(/\D/g, '');
    if (digitsOnly.startsWith('55')) {
      const rest = digitsOnly.slice(2);
      if (rest.length === 11) {
        return `+55 (${rest.slice(0, 2)}) ${rest.slice(2, 7)}-${rest.slice(7)}`;
      }
      if (rest.length === 10) {
        return `+55 (${rest.slice(0, 2)}) ${rest.slice(2, 6)}-${rest.slice(6)}`;
      }
    }
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.startsWith('55') && digits.length === 13) {
    const ddd = digits.slice(2, 4);
    const num = digits.slice(4);
    return `+55 (${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`;
  }
  if (digits.startsWith('55') && digits.length === 12) {
    const ddd = digits.slice(2, 4);
    const num = digits.slice(4);
    return `+55 (${ddd}) ${num.slice(0, 4)}-${num.slice(4)}`;
  }
  return phone;
}

/**
 * Retorna número pronto para link da API oficial do WhatsApp wa.me (apenas dígitos com DDI)
 * Suporta perfeitamente números nacionais e clientes internacionais
 */
export function cleanWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  const trimmed = phone.trim();

  // Se inicia com '+' indicando formato internacional E.164 (ex: +351 912 345 678 ou +1 555 123 4567)
  if (trimmed.startsWith('+')) {
    return trimmed.replace(/\D/g, '');
  }

  const digits = trimmed.replace(/\D/g, '');

  // Se tem 12 ou mais dígitos e já começa com 55 (ex: 5521999999999)
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }

  // Se tem 10 ou 11 dígitos (padrão Brasil sem DDI)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

/**
 * Converte valor em formato monetário (ex: "28,00" ou "28" ou "1.250,50") para número puro
 */
export function parseCurrencyInput(value: string | number): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  const limpo = String(value).replace(/[^\d.,]/g, '');
  if (!limpo) return 0;
  if (limpo.includes(',')) {
    const semPontoMilhar = limpo.replace(/\./g, '');
    const comPontoDecimal = semPontoMilhar.replace(',', '.');
    const parsed = parseFloat(comPontoDecimal);
    return isNaN(parsed) ? 0 : parsed;
  }
  const parsed = parseFloat(limpo);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formata um valor numérico para exibição limpa em input monetário brasileiro ("28,00")
 */
export function formatCurrencyInput(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return '';
  const num = typeof value === 'number' ? value : parseCurrencyInput(value);
  if (isNaN(num)) return '';
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
