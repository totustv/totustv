import {
  Cliente,
  ClienteStatus,
  Cobranca,
  HistoricoVencimento,
  Pagamento,
  PromessaPagamento,
  ContatoHistorico,
  BonusBeneficio,
  BonusTipo,
  BonusStatus,
  ProgramaBonus,
  CategoriaDespesa,
  Despesa,
  FluxoCaixaItem,
  ConfiguracoesApp,
  FormaPagamento,
  UserProfile,
  AuditLog,
  ModeloMensagem,
} from '../types';
import { getValidDateForMonth, isPastDate } from './utils';
import { supabase, isSupabaseConfigured } from './supabase';

// ==============================================================================
// SEED INICIAL REALISTA E COERENTE PARA DEMONSTRAÇÃO E OPERAÇÃO IMEDIATA
// ==============================================================================

export const INITIAL_USERS: (UserProfile & { senhaHash?: string })[] = [
  {
    id: 'user-admin-1',
    email: 'admin@totustv.com',
    nome: 'Administrador Totus TV',
    role: 'admin',
    status: 'ativo',
    telefone: '11987654321',
    created_at: '2026-01-01T00:00:00Z',
    ultimo_acesso: '2026-10-11T12:00:00Z',
  },
  {
    id: 'user-reseller-1',
    email: 'revendedor.sp@totustv.com',
    nome: 'Carlos Revenda SP (Revendedor A)',
    role: 'reseller',
    status: 'ativo',
    telefone: '11988887777',
    created_at: '2026-03-01T10:00:00Z',
    ultimo_acesso: '2026-10-10T15:30:00Z',
  },
  {
    id: 'user-reseller-2',
    email: 'revendedor.rj@totustv.com',
    nome: 'Renato Revenda RJ (Revendedor B)',
    role: 'reseller',
    status: 'ativo',
    telefone: '21977776666',
    created_at: '2026-05-15T14:00:00Z',
    ultimo_acesso: '2026-10-09T18:20:00Z',
  },
  {
    id: 'user-reseller-3',
    email: 'marcos.suspenso@totustv.com',
    nome: 'Marcos Bloqueado (Conta Suspensa)',
    role: 'reseller',
    status: 'suspenso',
    telefone: '31966665555',
    created_at: '2026-06-01T09:00:00Z',
    ultimo_acesso: '2026-09-20T11:00:00Z',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    user_id: 'user-admin-1',
    user_nome: 'Administrador Totus TV',
    user_email: 'admin@totustv.com',
    acao: 'login',
    tabela: 'auth',
    detalhes: 'Login administrativo com sucesso',
    created_at: '2026-10-11T12:00:00Z',
  },
  {
    id: 'aud-2',
    user_id: 'user-admin-1',
    user_nome: 'Administrador Totus TV',
    user_email: 'admin@totustv.com',
    acao: 'cadastrar_revendedor',
    tabela: 'perfis',
    registro_id: 'user-reseller-1',
    detalhes: 'Cadastro do revendedor Carlos Revenda SP',
    created_at: '2026-03-01T10:00:00Z',
  },
];

const INITIAL_CONFIG: ConfiguracoesApp = {
  id: 'config_geral',
  nome_negocio: 'Totus TV',
  moeda: 'BRL',
  fuso_horario: 'America/Sao_Paulo',
  dias_vencimento_padrao: [10, 20, 30],
  valor_mensalidade_padrao: 35.00,
  telefone_suporte: '11987654321',
  chave_pix: 'pix@totustv.com.br',
  msg_lembrete_amanha: 'Olá, {NOME}! Tudo bem? Passando para lembrar que o vencimento da sua mensalidade Totus TV é amanhã, dia {DATA}. Caso precise de alguma informação, estou à disposição!',
  msg_lembrete_hoje: 'Olá, {NOME}! Tudo bem? Passando para avisar que sua mensalidade Totus TV vence hoje, dia {DATA}. Chave Pix para pagamento: {PIX}',
  msg_cobranca_pendente: 'Olá, {NOME}! Tudo bem? Identifiquei que sua mensalidade Totus TV está pendente. Você poderia me informar quando pretende realizar o pagamento?',
  msg_promessa_confirmar: 'Olá, {NOME}! Tudo bem? Estou passando para confirmar o pagamento que combinamos para hoje, referente à sua mensalidade Totus TV.',
  msg_pagamento_confirmado: 'Olá, {NOME}! Pagamento recebido com sucesso. Obrigado pela preferência e por continuar com a Totus TV! 🎉',
  permite_duplo_bonus: false,
};

export const INITIAL_MODELOS_MENSAGEM: ModeloMensagem[] = [
  {
    id: 'mod-1',
    titulo: '1. Lembrete: Vencimento Amanhã',
    texto: 'Olá, {NOME}! Tudo bem? Passando para lembrar que o vencimento da sua mensalidade Totus TV é amanhã, dia {DATA}. Caso precise de alguma informação, estou à disposição!',
    categoria: 'lembrete',
    padrao: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'mod-2',
    titulo: '2. Lembrete: Vencimento Hoje',
    texto: 'Olá, {NOME}! Tudo bem? Passando para avisar que sua mensalidade Totus TV vence hoje, dia {DATA}. Chave Pix para pagamento: {PIX}',
    categoria: 'lembrete',
    padrao: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'mod-3',
    titulo: '3. Cobrança de Fatura Pendente / Atrasada',
    texto: 'Olá, {NOME}! Tudo bem? Identifiquei que sua mensalidade Totus TV está pendente. Você poderia me informar quando pretende realizar o pagamento?',
    categoria: 'cobranca',
    padrao: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'mod-4',
    titulo: '4. Confirmação de Promessa de Pagamento',
    texto: 'Olá, {NOME}! Tudo bem? Estou passando para confirmar o pagamento que combinamos para hoje, referente à sua mensalidade Totus TV.',
    categoria: 'promessa',
    padrao: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'mod-5',
    titulo: '5. Recibo / Confirmação de Pagamento Recebido',
    texto: 'Olá, {NOME}! Pagamento recebido com sucesso. Obrigado pela preferência e por continuar com a Totus TV! 🎉',
    categoria: 'recibo',
    padrao: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'mod-6',
    titulo: '6. Cobrança Especial: Vencimento Dia 10',
    texto: 'Olá, {NOME}! Tudo bem? Passando para lembrar que sua mensalidade Totus TV referente ao vencimento do dia 10 ({DATA}) no valor de {VALOR} já está disponível para acerto. Chave Pix: {PIX}. Qualquer dúvida estou à disposição!',
    categoria: 'cobranca',
    dia_vencimento_alvo: 10,
    padrao: false,
    created_at: '2026-01-01T00:00:00Z',
  },
];


const INITIAL_CATEGORIAS: CategoriaDespesa[] = [
  { id: 'cat-1', nome: 'Servidores e Hospedagem', cor: '#3b82f6', icone: 'Server' },
  { id: 'cat-2', nome: 'Sistemas e Ferramentas', cor: '#8b5cf6', icone: 'Cpu' },
  { id: 'cat-3', nome: 'Licenças e Assinaturas', cor: '#06b6d4', icone: 'Key' },
  { id: 'cat-4', nome: 'Internet e Telefonia', cor: '#10b981', icone: 'Wifi' },
  { id: 'cat-5', nome: 'Marketing e Tráfego', cor: '#f59e0b', icone: 'Megaphone' },
  { id: 'cat-6', nome: 'Taxas e Tarifas', cor: '#ef4444', icone: 'Percent' },
  { id: 'cat-7', nome: 'Equipamentos', cor: '#6366f1', icone: 'Tv' },
  { id: 'cat-8', nome: 'Outros', cor: '#64748b', icone: 'HelpCircle' },
];

const INITIAL_CLIENTES: Cliente[] = [];
const INITIAL_COBRANCAS: Cobranca[] = [];
const INITIAL_PAGAMENTOS: Pagamento[] = [];
const INITIAL_PROMESSAS: PromessaPagamento[] = [];
const INITIAL_BONUS: BonusBeneficio[] = [];

export const INITIAL_PROGRAMAS_BONUS: ProgramaBonus[] = [
  {
    id: 'prog-1',
    titulo: 'Bônus 1: Indicação de Clientes',
    descricao: 'Quando o cliente A indica o cliente B, o benefício fica pendente até que o cliente B realize e confirme o seu primeiro pagamento elegível. O bônus gera 1 mês grátis seguro para o padrinho.',
    cor: '#6366f1',
    icone: 'Share2',
    ativo: true,
  },
  {
    id: 'prog-2',
    titulo: 'Bônus 2: Mês de Aniversário',
    descricao: 'No mês de aniversário, a fatura correspondente é dispensada automaticamente sem receita fictícia, mantendo a integridade do livro caixa e auditoria contábil.',
    cor: '#ec4899',
    icone: 'Cake',
    ativo: true,
  },
];

const INITIAL_DESPESAS: Despesa[] = [];
const INITIAL_FLUXO: FluxoCaixaItem[] = [];

// ==============================================================================
// GERENCIADOR DE BANCO DE DADOS LOCAL E PERSISTENTE (AUDITÁVEL E ATÔMICO)
// ==============================================================================

const STORAGE_KEY = 'totustv_database_v1';
const DELETED_CLIENTS_KEY = 'totustv_deleted_clients_v1';
const DELETED_DESPESAS_KEY = 'totustv_deleted_despesas_v1';

export interface TotusDatabase {
  config: ConfiguracoesApp;
  clientes: Cliente[];
  cobrancas: Cobranca[];
  pagamentos: Pagamento[];
  historico_vencimentos: HistoricoVencimento[];
  promessas: PromessaPagamento[];
  contatos: ContatoHistorico[];
  bonus: BonusBeneficio[];
  programas_bonus: ProgramaBonus[];
  categorias_despesas: CategoriaDespesa[];
  despesas: Despesa[];
  fluxo_caixa: FluxoCaixaItem[];
  usuarios: UserProfile[];
  logs_auditoria: AuditLog[];
  modelos_mensagem?: ModeloMensagem[];
  clientes_excluidos?: string[];
  despesas_excluidas?: string[];
}

export class TotusDBManager {
  private db: TotusDatabase;
  private listeners: (() => void)[] = [];
  private deletedClientIds: Set<string> = new Set();
  private deletedDespesaIds: Set<string> = new Set();

  constructor() {
    this.loadDeletedIds();
    this.db = this.loadFromStorage();
    this.autoCalculateAtrasos();
    this.reconciliarFluxoDespesas();
    this.reconciliarClientesExcluidos();
    this.reconciliarTodasCobrancasAoInicioServico();
    this.deduplicarCobrancas();
  }

  private loadDeletedIds(): void {
    // Clientes de teste de seed inicial marcados como excluídos para nunca retornarem
    const initialTestClientIds = ['cli-1', 'cli-2', 'cli-3', 'cli-4', 'cli-5', 'cli-6', 'cli-7'];
    initialTestClientIds.forEach(id => this.deletedClientIds.add(id));

    try {
      const storedClients = localStorage.getItem(DELETED_CLIENTS_KEY);
      if (storedClients) {
        const arr = JSON.parse(storedClients);
        if (Array.isArray(arr)) {
          arr.forEach(id => {
            if (id && typeof id === 'string') this.deletedClientIds.add(id);
          });
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar lista de clientes excluídos do storage:', e);
    }

    try {
      const storedDesp = localStorage.getItem(DELETED_DESPESAS_KEY);
      if (storedDesp) {
        const arr = JSON.parse(storedDesp);
        if (Array.isArray(arr)) {
          arr.forEach(id => {
            if (id && typeof id === 'string') this.deletedDespesaIds.add(id);
          });
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar lista de despesas excluídas do storage:', e);
    }
  }

  public getDeletedClientIds(): Set<string> {
    return new Set(this.deletedClientIds);
  }

  public getDeletedDespesaIds(): Set<string> {
    return new Set(this.deletedDespesaIds);
  }

  public registerDeletedClientId(id: string): void {
    if (!id) return;
    this.deletedClientIds.add(id);
    try {
      localStorage.setItem(DELETED_CLIENTS_KEY, JSON.stringify(Array.from(this.deletedClientIds)));
    } catch (e) {
      console.error('Falha ao salvar lista de clientes excluídos:', e);
    }
    if (this.db) {
      this.db.clientes_excluidos = Array.from(this.deletedClientIds);
    }
  }

  public unregisterDeletedClientId(id: string): void {
    if (!id) return;
    this.deletedClientIds.delete(id);
    try {
      localStorage.setItem(DELETED_CLIENTS_KEY, JSON.stringify(Array.from(this.deletedClientIds)));
    } catch (e) {
      console.error('Falha ao atualizar lista de clientes excluídos:', e);
    }
    if (this.db) {
      this.db.clientes_excluidos = Array.from(this.deletedClientIds);
    }
  }

  public registerDeletedDespesaId(id: string): void {
    if (!id) return;
    this.deletedDespesaIds.add(id);
    try {
      localStorage.setItem(DELETED_DESPESAS_KEY, JSON.stringify(Array.from(this.deletedDespesaIds)));
    } catch (e) {
      console.error('Falha ao salvar lista de despesas excluídas:', e);
    }
    if (this.db) {
      this.db.despesas_excluidas = Array.from(this.deletedDespesaIds);
    }
  }

  public unregisterDeletedDespesaId(id: string): void {
    if (!id) return;
    this.deletedDespesaIds.delete(id);
    try {
      localStorage.setItem(DELETED_DESPESAS_KEY, JSON.stringify(Array.from(this.deletedDespesaIds)));
    } catch (e) {
      console.error('Falha ao atualizar lista de despesas excluídas:', e);
    }
    if (this.db) {
      this.db.despesas_excluidas = Array.from(this.deletedDespesaIds);
    }
  }

  public reconciliarClientesExcluidos() {
    if (!this.db) return;
    const deleted = this.deletedClientIds;
    if (deleted.size === 0) return;

    let changed = false;

    if (this.db.clientes.some(c => deleted.has(c.id))) {
      this.db.clientes = this.db.clientes.filter(c => !deleted.has(c.id));
      changed = true;
    }
    if (this.db.cobrancas.some(c => deleted.has(c.cliente_id))) {
      this.db.cobrancas = this.db.cobrancas.filter(c => !deleted.has(c.cliente_id));
      changed = true;
    }
    if (this.db.pagamentos.some(p => deleted.has(p.cliente_id))) {
      this.db.pagamentos = this.db.pagamentos.filter(p => !deleted.has(p.cliente_id));
      changed = true;
    }
    const testClientNames = ['Marcos Vinicius', 'Mariana Silveira', 'Carlos Eduardo Mendes', 'Juliana Beatriz', 'Fernanda Cristina', 'Rodrigo Barbosa', 'Lucas Gabriel', 'Patrícia Helena'];
    const testFluxoIds = new Set(['flx-1', 'flx-2', 'flx-3', 'flx-4', 'flx-5', 'flx-set-1', 'flx-set-2', 'flx-set-3', 'flx-set-4', 'flx-set-5', 'flx-set-6', 'flx-set-7']);

    if (this.db.fluxo_caixa.some(f => 
      testFluxoIds.has(f.id) || 
      f.id.startsWith('flx-set-') ||
      (f.cliente_id && deleted.has(f.cliente_id)) ||
      testClientNames.some(nome => f.descricao && f.descricao.includes(nome))
    )) {
      this.db.fluxo_caixa = this.db.fluxo_caixa.filter(f => 
        !testFluxoIds.has(f.id) && 
        !f.id.startsWith('flx-set-') && 
        (!f.cliente_id || !deleted.has(f.cliente_id)) && 
        !testClientNames.some(nome => f.descricao && f.descricao.includes(nome))
      );
      changed = true;
    }
    if (this.db.bonus.some(b => deleted.has(b.cliente_id) || (b.indicado_id && deleted.has(b.indicado_id)))) {
      this.db.bonus = this.db.bonus.filter(b => !deleted.has(b.cliente_id) && (!b.indicado_id || !deleted.has(b.indicado_id)));
      changed = true;
    }
    if (this.db.promessas && this.db.promessas.some(p => deleted.has(p.cliente_id))) {
      this.db.promessas = this.db.promessas.filter(p => !deleted.has(p.cliente_id));
      changed = true;
    }
    if (this.db.contatos && this.db.contatos.some(c => deleted.has(c.cliente_id))) {
      this.db.contatos = this.db.contatos.filter(c => !deleted.has(c.cliente_id));
      changed = true;
    }
    if (this.db.historico_vencimentos && this.db.historico_vencimentos.some(h => deleted.has(h.cliente_id))) {
      this.db.historico_vencimentos = this.db.historico_vencimentos.filter(h => !deleted.has(h.cliente_id));
      changed = true;
    }

    if (changed) {
      this.persist();
    }
  }

  public getCompetenciaInicialCliente(cliente: { data_inicio_servico?: string }): { mes: number; ano: number } {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    if (!cliente.data_inicio_servico) {
      return { mes: currentMonth, ano: currentYear };
    }

    const parts = cliente.data_inicio_servico.split('-');
    if (parts.length >= 2) {
      const ano = parseInt(parts[0], 10);
      const mes = parseInt(parts[1], 10);
      if (!isNaN(ano) && !isNaN(mes) && mes >= 1 && mes <= 12 && ano >= 2000) {
        return { mes, ano };
      }
    }

    return { mes: currentMonth, ano: currentYear };
  }

  public ajustarCobrancasAoInicioDoServico(cliente: Cliente, mesInicio: number, anoInicio: number) {
    if (!cliente || !cliente.id) return;

    // 1. Remover cobranças não pagas geradas para competências anteriores ao início do serviço
    const cobrancasPrematuras = this.db.cobrancas.filter(c =>
      c.cliente_id === cliente.id &&
      c.status !== 'pago' &&
      (c.competencia_ano < anoInicio || (c.competencia_ano === anoInicio && c.competencia_mes < mesInicio))
    );

    if (cobrancasPrematuras.length > 0) {
      const idsToRemove = new Set(cobrancasPrematuras.map(c => c.id));
      this.db.cobrancas = this.db.cobrancas.filter(c => !idsToRemove.has(c.id));
      for (const cob of cobrancasPrematuras) {
        this.pushToSupabase('cobrancas', null, 'delete', 'id', cob.id);
      }
      this.persist();
    }

    // 2. Garantir que a cobrança da competência de início exista
    const cobrancaInicio = this.db.cobrancas.find(c =>
      c.cliente_id === cliente.id &&
      c.competencia_mes === mesInicio &&
      c.competencia_ano === anoInicio
    );

    if (!cobrancaInicio) {
      this.gerarCobrancaParaCliente(cliente, mesInicio, anoInicio);
    }
  }

  public reconciliarTodasCobrancasAoInicioServico(): boolean {
    if (!this.db || !this.db.clientes || !this.db.cobrancas) return false;

    let changed = false;
    const clientMap = new Map<string, Cliente>();
    this.db.clientes.forEach(c => clientMap.set(c.id, c));

    // Identificar e remover cobranças prematuras não pagas
    const prematureIds = new Set<string>();
    for (const cob of this.db.cobrancas) {
      if (cob.status === 'pago') continue;
      const cli = clientMap.get(cob.cliente_id);
      if (!cli || !cli.data_inicio_servico) continue;

      const comp = this.getCompetenciaInicialCliente(cli);
      if (cob.competencia_ano < comp.ano || (cob.competencia_ano === comp.ano && cob.competencia_mes < comp.mes)) {
        prematureIds.add(cob.id);
      }
    }

    if (prematureIds.size > 0) {
      this.db.cobrancas = this.db.cobrancas.filter(c => !prematureIds.has(c.id));
      for (const id of prematureIds) {
        this.pushToSupabase('cobrancas', null, 'delete', 'id', id);
      }
      changed = true;
    }

    // Garantir que cada cliente ativo possua a cobrança de sua competência de início
    for (const cli of this.db.clientes) {
      if (cli.status === 'inativo') continue;
      const comp = this.getCompetenciaInicialCliente(cli);
      const hasCob = this.db.cobrancas.some(c =>
        c.cliente_id === cli.id &&
        c.competencia_mes === comp.mes &&
        c.competencia_ano === comp.ano
      );
      if (!hasCob) {
        this.gerarCobrancaParaCliente(cli, comp.mes, comp.ano);
        changed = true;
      }
    }

    if (changed) {
      this.persist();
    }
    return changed;
  }

  public deduplicarCobrancas(): boolean {
    if (!this.db || !this.db.cobrancas) return false;

    const seen = new Map<string, Cobranca>();
    const idsToRemove = new Set<string>();

    for (const cob of this.db.cobrancas) {
      if (!cob || !cob.cliente_id) continue;
      const key = `${cob.cliente_id}-${cob.competencia_mes}-${cob.competencia_ano}`;
      if (seen.has(key)) {
        const existing = seen.get(key)!;
        if (cob.status === 'pago' && existing.status !== 'pago') {
          idsToRemove.add(existing.id);
          seen.set(key, cob);
        } else {
          idsToRemove.add(cob.id);
        }
      } else {
        seen.set(key, cob);
      }
    }

    if (idsToRemove.size > 0) {
      this.db.cobrancas = Array.from(seen.values());
      for (const id of idsToRemove) {
        this.pushToSupabase('cobrancas', null, 'delete', 'id', id);
      }
      this.persist();
      return true;
    }
    return false;
  }

  private loadFromStorage(): TotusDatabase {
    this.loadDeletedIds();

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.clientes_excluidos)) {
          parsed.clientes_excluidos.forEach((id: string) => {
            if (id && typeof id === 'string') this.deletedClientIds.add(id);
          });
        }
        if (Array.isArray(parsed.despesas_excluidas)) {
          parsed.despesas_excluidas.forEach((id: string) => {
            if (id && typeof id === 'string') this.deletedDespesaIds.add(id);
          });
        }

        const rawClientes: any[] = Array.isArray(parsed.clientes) ? parsed.clientes : INITIAL_CLIENTES;
        const validClientes = rawClientes
          .filter((c: any) => c && c.id && !this.deletedClientIds.has(c.id))
          .map((c: any) => {
            const init = INITIAL_CLIENTES.find(ic => ic.id === c.id);
            return {
              ...init,
              ...c,
              pais: c.pais || init?.pais || 'Brasil',
              estado: c.estado || init?.estado || '',
              cidade: c.cidade || init?.cidade || '',
              data_nascimento: c.data_nascimento || init?.data_nascimento || '',
              indicado_por: c.indicado_por !== undefined ? c.indicado_por : init?.indicado_por,
            };
          });

        const rawCobrancas: any[] = Array.isArray(parsed.cobrancas) ? parsed.cobrancas : INITIAL_COBRANCAS;
        const cobMap = new Map<string, any>();
        for (const c of rawCobrancas) {
          if (!c || !c.cliente_id || this.deletedClientIds.has(c.cliente_id)) continue;
          if (c.status !== 'pago') {
            const cli = validClientes.find((cl: any) => cl.id === c.cliente_id);
            if (cli && cli.data_inicio_servico) {
              const [startAno, startMes] = cli.data_inicio_servico.split('-').map(Number);
              if (startAno && startMes && (c.competencia_ano < startAno || (c.competencia_ano === startAno && c.competencia_mes < startMes))) {
                continue;
              }
            }
          }
          const key = `${c.cliente_id}-${c.competencia_mes}-${c.competencia_ano}`;
          if (!cobMap.has(key) || c.status === 'pago') {
            cobMap.set(key, c);
          }
        }
        const validCobrancas = Array.from(cobMap.values());

        const rawPagamentos: any[] = Array.isArray(parsed.pagamentos) ? parsed.pagamentos : INITIAL_PAGAMENTOS;
        const validPagamentos = rawPagamentos.filter((p: any) => p && !this.deletedClientIds.has(p.cliente_id));

        const rawDespesas: any[] = Array.isArray(parsed.despesas) ? parsed.despesas : INITIAL_DESPESAS;
        const validDespesas = rawDespesas.filter((d: any) => d && !this.deletedDespesaIds.has(d.id));

        const testClientNames = ['Marcos Vinicius', 'Mariana Silveira', 'Carlos Eduardo Mendes', 'Juliana Beatriz', 'Fernanda Cristina', 'Rodrigo Barbosa', 'Lucas Gabriel', 'Patrícia Helena'];
        const testFluxoIds = new Set(['flx-1', 'flx-2', 'flx-3', 'flx-4', 'flx-5', 'flx-set-1', 'flx-set-2', 'flx-set-3', 'flx-set-4', 'flx-set-5', 'flx-set-6', 'flx-set-7']);

        const rawFluxo: any[] = Array.isArray(parsed.fluxo_caixa) ? parsed.fluxo_caixa : INITIAL_FLUXO;
        const validFluxo = rawFluxo.filter((f: any) => 
          f && 
          f.id &&
          !testFluxoIds.has(f.id) &&
          !f.id.startsWith('flx-set-') &&
          (!f.cliente_id || !this.deletedClientIds.has(f.cliente_id)) && 
          (!f.origem_id || !this.deletedDespesaIds.has(f.origem_id)) &&
          !testClientNames.some(nome => f.descricao && f.descricao.includes(nome))
        );

        const rawBonus: any[] = Array.isArray(parsed.bonus) ? parsed.bonus : INITIAL_BONUS;
        const validBonus = rawBonus.filter((b: any) => 
          b && 
          (!b.cliente_id || !this.deletedClientIds.has(b.cliente_id)) && 
          (!b.indicado_id || !this.deletedClientIds.has(b.indicado_id))
        );

        return {
          config: parsed.config || INITIAL_CONFIG,
          clientes: validClientes,
          cobrancas: validCobrancas,
          pagamentos: validPagamentos,
          historico_vencimentos: (parsed.historico_vencimentos || []).filter((h: any) => h && !this.deletedClientIds.has(h.cliente_id)),
          promessas: (parsed.promessas || INITIAL_PROMESSAS).filter((p: any) => p && !this.deletedClientIds.has(p.cliente_id)),
          contatos: (parsed.contatos || []).filter((c: any) => c && !this.deletedClientIds.has(c.cliente_id)),
          bonus: validBonus,
          programas_bonus: parsed.programas_bonus && parsed.programas_bonus.length > 0 ? parsed.programas_bonus : INITIAL_PROGRAMAS_BONUS,
          categorias_despesas: parsed.categorias_despesas || INITIAL_CATEGORIAS,
          despesas: validDespesas,
          fluxo_caixa: validFluxo,
          usuarios: parsed.usuarios && parsed.usuarios.length > 0 ? parsed.usuarios : INITIAL_USERS,
          logs_auditoria: parsed.logs_auditoria || INITIAL_AUDIT_LOGS,
          modelos_mensagem: parsed.modelos_mensagem && parsed.modelos_mensagem.length > 0 ? parsed.modelos_mensagem : INITIAL_MODELOS_MENSAGEM,
          clientes_excluidos: Array.from(this.deletedClientIds),
          despesas_excluidas: Array.from(this.deletedDespesaIds),
        };
      }
    } catch (e) {
      console.warn('Erro ao carregar banco do storage, usando inicial:', e);
    }

    return {
      config: INITIAL_CONFIG,
      clientes: INITIAL_CLIENTES.filter(c => !this.deletedClientIds.has(c.id)),
      cobrancas: INITIAL_COBRANCAS.filter(c => !this.deletedClientIds.has(c.cliente_id)),
      pagamentos: INITIAL_PAGAMENTOS.filter(p => !this.deletedClientIds.has(p.cliente_id)),
      historico_vencimentos: [],
      promessas: INITIAL_PROMESSAS.filter(p => !this.deletedClientIds.has(p.cliente_id)),
      contatos: [],
      bonus: INITIAL_BONUS.filter(b => !this.deletedClientIds.has(b.cliente_id) && (!b.indicado_id || !this.deletedClientIds.has(b.indicado_id))),
      programas_bonus: INITIAL_PROGRAMAS_BONUS,
      categorias_despesas: INITIAL_CATEGORIAS,
      despesas: INITIAL_DESPESAS.filter(d => !this.deletedDespesaIds.has(d.id)),
      fluxo_caixa: INITIAL_FLUXO.filter(f => (!f.cliente_id || !this.deletedClientIds.has(f.cliente_id)) && (!f.origem_id || !this.deletedDespesaIds.has(f.origem_id))),
      usuarios: INITIAL_USERS,
      logs_auditoria: INITIAL_AUDIT_LOGS,
      modelos_mensagem: INITIAL_MODELOS_MENSAGEM,
      clientes_excluidos: Array.from(this.deletedClientIds),
      despesas_excluidas: Array.from(this.deletedDespesaIds),
    };
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
      this.notify();
    } catch (e) {
      console.error('Falha ao persistir banco de dados:', e);
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public getRawData(): TotusDatabase {
    return JSON.parse(JSON.stringify(this.db));
  }

  public resetToFactory() {
    localStorage.removeItem(STORAGE_KEY);
    this.db = {
      config: INITIAL_CONFIG,
      clientes: INITIAL_CLIENTES,
      cobrancas: INITIAL_COBRANCAS,
      pagamentos: INITIAL_PAGAMENTOS,
      historico_vencimentos: [],
      promessas: INITIAL_PROMESSAS,
      contatos: [],
      bonus: INITIAL_BONUS,
      programas_bonus: INITIAL_PROGRAMAS_BONUS,
      categorias_despesas: INITIAL_CATEGORIAS,
      despesas: INITIAL_DESPESAS,
      fluxo_caixa: INITIAL_FLUXO,
      usuarios: INITIAL_USERS,
      logs_auditoria: INITIAL_AUDIT_LOGS,
      modelos_mensagem: INITIAL_MODELOS_MENSAGEM,
    };
    this.persist();
  }

  public exportBackup(): string {
    return JSON.stringify(this.db, null, 2);
  }

  public importBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.clientes && parsed.cobrancas && parsed.config) {
        if (!parsed.programas_bonus) {
          parsed.programas_bonus = INITIAL_PROGRAMAS_BONUS;
        }
        this.db = parsed;
        this.persist();
        return true;
      }
    } catch (e) {
      console.error('JSON de backup inválido', e);
    }
    return false;
  }

  // ----------------------------------------------------------------------------
  // SINCRONIZAÇÃO COMPLETA COM NUVEM SUPABASE
  // ----------------------------------------------------------------------------
  public async pushToSupabase(table: string, payload: any, mode: 'upsert' | 'insert' | 'update' | 'delete' = 'upsert', matchKey?: string, matchVal?: any) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      // Bloqueio de inserção/atualização de itens excluídos
      if (mode !== 'delete') {
        if (table === 'clientes' && payload?.id && this.deletedClientIds.has(payload.id)) {
          return;
        }
        if (table === 'despesas' && payload?.id && this.deletedDespesaIds.has(payload.id)) {
          return;
        }
        if (['cobrancas', 'pagamentos', 'fluxo_caixa', 'bonus_beneficios', 'promessas_pagamento', 'contatos_historico', 'historico_vencimentos'].includes(table)) {
          if (payload?.cliente_id && this.deletedClientIds.has(payload.cliente_id)) {
            return;
          }
        }
        if (table === 'fluxo_caixa' && payload?.origem_id && this.deletedDespesaIds.has(payload.origem_id)) {
          return;
        }
      }

      // Sanitização de campos do tipo DATE e foreign keys para evitar erro PostgreSQL de syntax inválida ("" -> null)
      let sanitizedPayload = payload;
      if (payload && typeof payload === 'object' && mode !== 'delete') {
        sanitizedPayload = { ...payload };
        if (table === 'clientes') {
          if (sanitizedPayload.data_nascimento === '') sanitizedPayload.data_nascimento = null;
          if (sanitizedPayload.data_inicio_servico === '') sanitizedPayload.data_inicio_servico = null;
          if (sanitizedPayload.indicado_por === '') sanitizedPayload.indicado_por = null;
          if (sanitizedPayload.reseller_id === '') sanitizedPayload.reseller_id = null;
        }
      }

      if (mode === 'delete' && matchKey && matchVal) {
        const { error } = await supabase.from(table).delete().eq(matchKey, matchVal);
        if (error) console.error(`[Supabase delete ${table}]`, error.message);
      } else if (mode === 'insert') {
        const { error } = await supabase.from(table).insert(sanitizedPayload);
        if (error) console.error(`[Supabase insert ${table}]`, error.message);
      } else if (mode === 'update' && matchKey && matchVal) {
        const { error } = await supabase.from(table).update(sanitizedPayload).eq(matchKey, matchVal);
        if (error) console.error(`[Supabase update ${table}]`, error.message);
      } else {
        const { error } = await supabase.from(table).upsert(sanitizedPayload);
        if (error) console.error(`[Supabase upsert ${table}]`, error.message);
      }
    } catch (err) {
      console.warn(`[Supabase sync error ${table}]`, err);
    }
  }

  public async purgeClientFromSupabase(clienteId: string) {
    if (!isSupabaseConfigured || !supabase || !clienteId) return;
    try {
      // Cascata em ordem reversa de dependência relacional no PostgreSQL
      await supabase.from('clientes').update({ indicado_por: null }).eq('indicado_por', clienteId);
      await supabase.from('bonus_beneficios').delete().eq('cliente_id', clienteId);
      await supabase.from('bonus_beneficios').delete().eq('indicado_id', clienteId);
      await supabase.from('contatos_historico').delete().eq('cliente_id', clienteId);
      await supabase.from('promessas_pagamento').delete().eq('cliente_id', clienteId);
      await supabase.from('historico_vencimentos').delete().eq('cliente_id', clienteId);
      await supabase.from('fluxo_caixa').delete().eq('cliente_id', clienteId);
      await supabase.from('pagamentos').delete().eq('cliente_id', clienteId);
      await supabase.from('cobrancas').delete().eq('cliente_id', clienteId);
      const { error } = await supabase.from('clientes').delete().eq('id', clienteId);
      if (error) {
        console.error(`[Supabase delete cliente ${clienteId}]`, error.message);
      }
    } catch (err) {
      console.warn(`[Supabase purge cliente ${clienteId} error]`, err);
    }
  }

  public async purgeDespesaFromSupabase(despesaId: string) {
    if (!isSupabaseConfigured || !supabase || !despesaId) return;
    try {
      await supabase.from('fluxo_caixa').delete().eq('origem_id', despesaId);
      await supabase.from('fluxo_caixa').delete().eq('id', `flx-desp-${despesaId}`);
      await supabase.from('fluxo_caixa').delete().eq('id', despesaId);
      await supabase.from('despesas').delete().eq('id', despesaId);
    } catch (err) {
      console.warn(`[Supabase purge despesa ${despesaId} error]`, err);
    }
  }

  public async syncFromSupabase(): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;

    try {
      const [
        resConfig,
        resClientes,
        resCobrancas,
        resPagamentos,
        resDespesas,
        resCategorias,
        resFluxo,
        resBonus,
        resProgramas,
        resPerfis,
        resAuditoria
      ] = await Promise.all([
        supabase.from('configuracoes').select('*').limit(1).maybeSingle(),
        supabase.from('clientes').select('*'),
        supabase.from('cobrancas').select('*'),
        supabase.from('pagamentos').select('*'),
        supabase.from('despesas').select('*'),
        supabase.from('categorias_despesas').select('*'),
        supabase.from('fluxo_caixa').select('*'),
        supabase.from('bonus_beneficios').select('*'),
        supabase.from('programas_bonus').select('*'),
        supabase.from('perfis').select('*'),
        supabase.from('logs_auditoria').select('*').order('created_at', { ascending: false }).limit(200),
      ]);

      let updated = false;

      if (resConfig.data) {
        this.db.config = { ...this.db.config, ...resConfig.data };
        updated = true;
      }

      if (resClientes.data && resClientes.data.length > 0) {
        // Expurgar do Supabase qualquer cliente que esteja na lista de excluídos
        const toPurge = resClientes.data.filter((c: any) => this.deletedClientIds.has(c.id));
        for (const dc of toPurge) {
          this.purgeClientFromSupabase(dc.id);
        }

        const activeCloud = resClientes.data.filter((c: any) => !this.deletedClientIds.has(c.id));
        const cloudIds = new Set(activeCloud.map((c: any) => c.id));
        const localNew = this.db.clientes.filter(c => !cloudIds.has(c.id) && !this.deletedClientIds.has(c.id));
        if (localNew.length > 0) {
          for (const lc of localNew) {
            this.pushToSupabase('clientes', lc);
          }
        }
        this.db.clientes = [...activeCloud, ...localNew];
        updated = true;
      }

      if (resCobrancas.data && resCobrancas.data.length > 0) {
        const clientStartDates = new Map<string, { ano: number; mes: number }>();
        this.db.clientes.forEach(c => {
          clientStartDates.set(c.id, this.getCompetenciaInicialCliente(c));
        });

        const activeCloud = resCobrancas.data.filter((c: any) => {
          if (!c || !c.cliente_id || this.deletedClientIds.has(c.cliente_id)) return false;
          if (c.status !== 'pago') {
            const start = clientStartDates.get(c.cliente_id);
            if (start && (c.competencia_ano < start.ano || (c.competencia_ano === start.ano && c.competencia_mes < start.mes))) {
              return false;
            }
          }
          return true;
        });

        // Deduplicação estrita na nuvem por chave cliente + mês + ano
        const cloudCobMap = new Map<string, any>();
        for (const c of activeCloud) {
          const key = `${c.cliente_id}-${c.competencia_mes}-${c.competencia_ano}`;
          if (!cloudCobMap.has(key) || c.status === 'pago') {
            cloudCobMap.set(key, c);
          }
        }

        // Itens locais novos que NÃO existem na nuvem para essa competência
        for (const lc of this.db.cobrancas) {
          if (!lc || !lc.cliente_id || this.deletedClientIds.has(lc.cliente_id)) continue;
          const key = `${lc.cliente_id}-${lc.competencia_mes}-${lc.competencia_ano}`;
          if (!cloudCobMap.has(key)) {
            cloudCobMap.set(key, lc);
            this.pushToSupabase('cobrancas', lc);
          }
        }

        this.db.cobrancas = Array.from(cloudCobMap.values());
        updated = true;
      }

      if (resPagamentos.data && resPagamentos.data.length > 0) {
        const activeCloud = resPagamentos.data.filter((p: any) => !this.deletedClientIds.has(p.cliente_id));
        const cloudIds = new Set(activeCloud.map((p: any) => p.id));
        const localNew = this.db.pagamentos.filter(p => !cloudIds.has(p.id) && !this.deletedClientIds.has(p.cliente_id));
        if (localNew.length > 0) {
          for (const lp of localNew) {
            this.pushToSupabase('pagamentos', lp);
          }
        }
        this.db.pagamentos = [...activeCloud, ...localNew];
        updated = true;
      }

      if (resDespesas.data && resDespesas.data.length > 0) {
        const toPurge = resDespesas.data.filter((d: any) => this.deletedDespesaIds.has(d.id));
        for (const dd of toPurge) {
          this.purgeDespesaFromSupabase(dd.id);
        }

        const activeCloud = resDespesas.data.filter((d: any) => !this.deletedDespesaIds.has(d.id));
        const cloudIds = new Set(activeCloud.map((d: any) => d.id));
        const localNew = this.db.despesas.filter(d => !cloudIds.has(d.id) && !this.deletedDespesaIds.has(d.id));
        if (localNew.length > 0) {
          for (const ld of localNew) {
            this.pushToSupabase('despesas', ld);
          }
        }
        this.db.despesas = [...activeCloud, ...localNew];
        updated = true;
      }

      if (resCategorias.data && resCategorias.data.length > 0) {
        this.db.categorias_despesas = resCategorias.data;
        updated = true;
      }

      if (resFluxo.data && resFluxo.data.length > 0) {
        const testClientNames = ['Marcos Vinicius', 'Mariana Silveira', 'Carlos Eduardo Mendes', 'Juliana Beatriz', 'Fernanda Cristina', 'Rodrigo Barbosa', 'Lucas Gabriel', 'Patrícia Helena'];
        const testFluxoIds = new Set(['flx-1', 'flx-2', 'flx-3', 'flx-4', 'flx-5', 'flx-set-1', 'flx-set-2', 'flx-set-3', 'flx-set-4', 'flx-set-5', 'flx-set-6', 'flx-set-7']);

        const validDespesaIds = new Set(this.db.despesas.map(d => d.id));
        const filteredCloudFluxo = resFluxo.data.filter((f: any) => {
          if (!f || !f.id) return false;
          if (testFluxoIds.has(f.id) || f.id.startsWith('flx-set-')) return false;
          if (testClientNames.some(nome => f.descricao && f.descricao.includes(nome))) return false;
          if (f.cliente_id && this.deletedClientIds.has(f.cliente_id)) {
            return false;
          }
          if (f.origem === 'despesa_paga' && f.origem_id) {
            if (this.deletedDespesaIds.has(f.origem_id) || !validDespesaIds.has(f.origem_id)) {
              return false;
            }
          }
          return true;
        });
        const cloudIds = new Set(filteredCloudFluxo.map((f: any) => f.id));
        const localNew = this.db.fluxo_caixa.filter(f => 
          !cloudIds.has(f.id) && 
          !testFluxoIds.has(f.id) &&
          !f.id.startsWith('flx-set-') &&
          !testClientNames.some(nome => f.descricao && f.descricao.includes(nome)) &&
          (!f.cliente_id || !this.deletedClientIds.has(f.cliente_id)) && 
          (!f.origem_id || !this.deletedDespesaIds.has(f.origem_id))
        );
        this.db.fluxo_caixa = [...filteredCloudFluxo, ...localNew];
        updated = true;
      }

      if (resBonus.data && resBonus.data.length > 0) {
        this.db.bonus = resBonus.data.filter((b: any) => 
          !this.deletedClientIds.has(b.cliente_id) && 
          (!b.indicado_id || !this.deletedClientIds.has(b.indicado_id))
        );
        updated = true;
      }

      if (resProgramas.data && resProgramas.data.length > 0) {
        this.db.programas_bonus = resProgramas.data;
        updated = true;
      }

      if (resPerfis.data && resPerfis.data.length > 0) {
        this.db.usuarios = resPerfis.data;
        updated = true;
      }

      if (resAuditoria.data && resAuditoria.data.length > 0) {
        this.db.logs_auditoria = resAuditoria.data;
        updated = true;
      }

      if (updated) {
        this.persist();
      }
      this.reconciliarClientesExcluidos();
      this.reconciliarFluxoDespesas();
      this.reconciliarTodasCobrancasAoInicioServico();
      this.deduplicarCobrancas();
      return true;
    } catch (e) {
      console.warn('Erro ao sincronizar dados com Supabase:', e);
      return false;
    }
  }

  // ----------------------------------------------------------------------------
  // ATUALIZAÇÃO AUTOMÁTICA DE ATRASOS
  // ----------------------------------------------------------------------------
  public autoCalculateAtrasos() {
    let changed = false;
    this.db.cobrancas.forEach(cob => {
      if (cob.status === 'pendente' || cob.status === 'avisado') {
        if (isPastDate(cob.data_vencimento)) {
          cob.status = 'atrasado';
          changed = true;
        }
      }
    });
    if (changed) {
      this.persist();
    }
  }

  // ----------------------------------------------------------------------------
  // CLIENTES
  // ----------------------------------------------------------------------------
  public getClientes(): Cliente[] {
    return this.db.clientes;
  }

  public getClienteById(id: string): Cliente | undefined {
    return this.db.clientes.find(c => c.id === id);
  }

  public saveCliente(data: Partial<Cliente> & { nome: string; whatsapp: string; dia_vencimento: number; valor_mensalidade: number }): Cliente {
    const isEdit = Boolean(data.id);
    const id = data.id || `cli-${Date.now()}`;
    const now = new Date().toISOString();

    // Se estiver re-salvando ou recriando cliente com este ID, desmarcar de excluídos
    if (data.id) {
      this.unregisterDeletedClientId(data.id);
    }

    let cliente: Cliente;

    if (isEdit) {
      const idx = this.db.clientes.findIndex(c => c.id === id);
      if (idx === -1) throw new Error('Cliente não encontrado');

      const old = this.db.clientes[idx];

      // Se mudou dia de vencimento, registrar histórico
      if (old.dia_vencimento !== data.dia_vencimento) {
        this.db.historico_vencimentos.push({
          id: `hist-${Date.now()}`,
          cliente_id: id,
          dia_anterior: old.dia_vencimento,
          dia_novo: data.dia_vencimento,
          motivo: 'Alteração cadastral no dia de vencimento preferencial',
          alterado_em: now,
        });
      }

      cliente = {
        ...old,
        ...data,
        reseller_id: data.reseller_id !== undefined ? (data.reseller_id || undefined) : old.reseller_id,
        updated_at: now,
      };
      this.db.clientes[idx] = cliente;
    } else {
      cliente = {
        id,
        nome: data.nome.trim(),
        whatsapp: data.whatsapp.replace(/\D/g, ''),
        valor_mensalidade: Number(data.valor_mensalidade),
        dia_vencimento: Number(data.dia_vencimento),
        data_cadastro: now,
        data_inicio_servico: data.data_inicio_servico || new Date().toISOString().split('T')[0],
        data_nascimento: data.data_nascimento || undefined,
        pais: data.pais?.trim() || 'Brasil',
        estado: data.estado?.trim() || undefined,
        cidade: data.cidade?.trim() || undefined,
        status: data.status || 'ativo',
        reseller_id: data.reseller_id || undefined,
        indicado_por: data.indicado_por || undefined,
        observacoes: data.observacoes || '',
        created_at: now,
        updated_at: now,
      };
      this.unregisterDeletedClientId(cliente.id);
      this.db.clientes.push(cliente);

      // Se tiver indicado_por, gerar bônus pendente para o padrinho
      if (cliente.indicado_por) {
        const bonusItem: BonusBeneficio = {
          id: `bon-ind-${Date.now()}`,
          cliente_id: cliente.indicado_por,
          tipo: 'indicacao',
          status: 'pendente', // Ativa apenas após o primeiro pagamento elegível!
          indicado_id: cliente.id,
          motivo_justificativa: `Indicação pendente do cliente ${cliente.nome} (aguardando 1º pagamento)`,
          data_concessao: now,
        };
        this.db.bonus.push(bonusItem);
        this.pushToSupabase('bonus_beneficios', bonusItem);
      }
    }

    this.persist();
    this.pushToSupabase('clientes', {
      id: cliente.id,
      nome: cliente.nome,
      whatsapp: cliente.whatsapp,
      valor_mensalidade: cliente.valor_mensalidade,
      dia_vencimento: cliente.dia_vencimento,
      data_cadastro: cliente.data_cadastro,
      data_inicio_servico: cliente.data_inicio_servico,
      data_nascimento: cliente.data_nascimento || null,
      pais: cliente.pais || 'Brasil',
      estado: cliente.estado || null,
      cidade: cliente.cidade || null,
      status: cliente.status || 'ativo',
      reseller_id: cliente.reseller_id || null,
      indicado_por: cliente.indicado_por || null,
      observacoes: cliente.observacoes || '',
      created_at: cliente.created_at,
      updated_at: cliente.updated_at
    });

    const compInicial = this.getCompetenciaInicialCliente(cliente);

    if (!isEdit) {
      // Quando cadastrar um novo cliente, as cobranças começam a contar a partir do mês da Data de Início do Serviço
      this.gerarCobrancaParaCliente(cliente, compInicial.mes, compInicial.ano);
    } else {
      // Se for edição, ajusta as cobranças para respeitar a nova data de início do serviço
      this.ajustarCobrancasAoInicioDoServico(cliente, compInicial.mes, compInicial.ano);
    }

    return cliente;
  }

  public toggleClienteStatus(clienteId: string): ClienteStatus {
    const cliente = this.db.clientes.find(c => c.id === clienteId);
    if (!cliente) throw new Error('Cliente não encontrado');

    cliente.status = cliente.status === 'ativo' ? 'inativo' : 'ativo';
    cliente.updated_at = new Date().toISOString();
    this.persist();
    this.pushToSupabase('clientes', { status: cliente.status, updated_at: cliente.updated_at }, 'update', 'id', clienteId);
    return cliente.status;
  }

  public excluirCliente(clienteId: string) {
    if (!clienteId) return;

    // 1. Gravar permanentemente na lista de clientes excluídos
    this.registerDeletedClientId(clienteId);

    // 2. Remover do array de clientes
    const idx = this.db.clientes.findIndex(c => c.id === clienteId);
    if (idx !== -1) {
      this.db.clientes.splice(idx, 1);
    }

    // 3. Cobranças do cliente
    const cobrancasRemovidas = this.db.cobrancas.filter(c => c.cliente_id === clienteId);
    const cobrancasIds = new Set(cobrancasRemovidas.map(c => c.id));
    this.db.cobrancas = this.db.cobrancas.filter(c => c.cliente_id !== clienteId);

    // 4. Pagamentos vinculados
    this.db.pagamentos = this.db.pagamentos.filter(p => p.cliente_id !== clienteId && !cobrancasIds.has(p.cobranca_id));

    // 5. Entradas do fluxo de caixa originadas desses pagamentos ou do cliente
    this.db.fluxo_caixa = this.db.fluxo_caixa.filter(f => f.cliente_id !== clienteId && (!f.origem_id || !cobrancasIds.has(f.origem_id)));

    // 6. Bônus onde o cliente é o beneficiário ou foi indicado
    this.db.bonus = this.db.bonus.filter(b => b.cliente_id !== clienteId && b.indicado_id !== clienteId);

    // 7. Histórico de vencimentos, promessas e contatos
    this.db.historico_vencimentos = (this.db.historico_vencimentos || []).filter(h => h.cliente_id !== clienteId);
    this.db.promessas = (this.db.promessas || []).filter(p => p.cliente_id !== clienteId);
    this.db.contatos = (this.db.contatos || []).filter(c => c.cliente_id !== clienteId);

    // 8. Atualizar outros clientes que tinham este como padrinho
    this.db.clientes.forEach(c => {
      if (c.indicado_por === clienteId) {
        c.indicado_por = undefined;
      }
    });

    this.persist();

    // 9. Expurgar da nuvem Supabase em cascata segura
    this.purgeClientFromSupabase(clienteId);
  }

  // ----------------------------------------------------------------------------
  // COBRANÇAS & CICLOS
  // ----------------------------------------------------------------------------
  public getCobrancas(): Cobranca[] {
    return this.db.cobrancas;
  }

  public gerarCobrancaParaCliente(cliente: Cliente, mes: number, ano: number): Cobranca {
    const existing = this.db.cobrancas.find(
      c => c.cliente_id === cliente.id && c.competencia_mes === mes && c.competencia_ano === ano
    );
    if (existing) return existing;

    const dataVencimento = getValidDateForMonth(ano, mes, cliente.dia_vencimento);
    const cobranca: Cobranca = {
      id: `cob-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      cliente_id: cliente.id,
      competencia_mes: mes,
      competencia_ano: ano,
      valor: Number(cliente.valor_mensalidade),
      data_vencimento: dataVencimento,
      status: isPastDate(dataVencimento) ? 'atrasado' : 'pendente',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Verificar se este mês é o aniversário do cliente
    if (cliente.data_nascimento) {
      const birthMonth = parseInt(cliente.data_nascimento.split('-')[1], 10);
      if (birthMonth === mes) {
        // Elegível para mês de aniversário!
        const bonusId = `bon-aniv-${Date.now()}`;
        cobranca.status = 'dispensado_aniversario';
        cobranca.bonus_aplicado_id = bonusId;
        this.db.bonus.push({
          id: bonusId,
          cliente_id: cliente.id,
          tipo: 'aniversario',
          status: 'utilizado',
          competencia_uso_mes: mes,
          competencia_uso_ano: ano,
          cobranca_dispensada_id: cobranca.id,
          motivo_justificativa: `Isenção automática por mês de aniversário do cliente`,
          data_concessao: new Date().toISOString(),
        });
      }
    }

    this.db.cobrancas.push(cobranca);
    this.persist();
    this.pushToSupabase('cobrancas', cobranca);
    return cobranca;
  }

  public alterarVencimentoCobranca(cobrancaId: string, novaData: string, motivo?: string) {
    const cob = this.db.cobrancas.find(c => c.id === cobrancaId);
    if (!cob) throw new Error('Cobrança não encontrada');

    const anterior = cob.data_vencimento;
    cob.data_vencimento = novaData;
    cob.updated_at = new Date().toISOString();

    // Reavalia atraso
    if (cob.status === 'atrasado' && !isPastDate(novaData)) {
      cob.status = 'pendente';
    } else if (cob.status === 'pendente' && isPastDate(novaData)) {
      cob.status = 'atrasado';
    }

    // Registra auditoria
    const histItem = {
      id: `hist-cob-${Date.now()}`,
      cliente_id: cob.cliente_id,
      cobranca_id: cob.id,
      data_vencimento_anterior: anterior,
      data_vencimento_nova: novaData,
      motivo: motivo || 'Ajuste individual da data de vencimento da fatura',
      alterado_em: new Date().toISOString(),
    };
    this.db.historico_vencimentos.push(histItem);

    this.persist();
    this.pushToSupabase('cobrancas', { data_vencimento: cob.data_vencimento, status: cob.status, updated_at: cob.updated_at }, 'update', 'id', cob.id);
    this.pushToSupabase('historico_vencimentos', histItem);
  }

  public cancelarOuDispensarCobranca(cobrancaId: string, tipo: 'cancelado' | 'dispensado_bonus', motivo: string) {
    const cob = this.db.cobrancas.find(c => c.id === cobrancaId);
    if (!cob) throw new Error('Cobrança não encontrada');
    if (cob.status === 'pago') throw new Error('Cobrança já paga não pode ser cancelada diretamente');

    cob.status = tipo;
    cob.motivo_cancelamento = motivo;
    cob.updated_at = new Date().toISOString();

    this.persist();
    this.pushToSupabase('cobrancas', { status: cob.status, motivo_cancelamento: cob.motivo_cancelamento, updated_at: cob.updated_at }, 'update', 'id', cob.id);
  }

  // ----------------------------------------------------------------------------
  // PAGAMENTOS (OPERAÇÃO CRÍTICA COM PROTEÇÃO CONTRA DUPLICIDADE E ATOMICA)
  // ----------------------------------------------------------------------------
  public registrarPagamento(params: {
    cobranca_id: string;
    valor_pago: number;
    data_pagamento: string;
    forma_pagamento: FormaPagamento;
    observacao?: string;
  }): Pagamento {
    const cob = this.db.cobrancas.find(c => c.id === params.cobranca_id);
    if (!cob) throw new Error('Cobrança não encontrada');

    // Proteção de duplicidade: verificar se já existe pagamento para esta cobrança
    const existingPagamento = this.db.pagamentos.find(p => p.cobranca_id === params.cobranca_id);
    if (existingPagamento || cob.status === 'pago') {
      throw new Error('Esta cobrança já possui pagamento confirmado registrado');
    }

    const cliente = this.db.clientes.find(c => c.id === cob.cliente_id);
    const pagId = `pag-${Date.now()}`;
    const now = new Date().toISOString();

    const novoPagamento: Pagamento = {
      id: pagId,
      cobranca_id: cob.id,
      cliente_id: cob.cliente_id,
      valor_pago: Number(params.valor_pago),
      data_pagamento: params.data_pagamento || now,
      forma_pagamento: params.forma_pagamento,
      observacao: params.observacao,
      created_at: now,
    };

    // 1. Salva o pagamento
    this.db.pagamentos.push(novoPagamento);

    // 2. Atualiza status da cobrança
    cob.status = 'pago';
    cob.updated_at = now;

    // 3. Registra movimentação de entrada no Livro Caixa / Fluxo de Caixa (UMA ÚNICA VEZ)
    const clienteNome = cliente ? cliente.nome : 'Cliente';
    const comp = `${String(cob.competencia_mes).padStart(2, '0')}/${cob.competencia_ano}`;
    const fluxoItem: FluxoCaixaItem = {
      id: `flx-pag-${pagId}`,
      data_movimento: params.data_pagamento.split('T')[0],
      tipo: 'entrada',
      valor: novoPagamento.valor_pago,
      descricao: `Mensalidade Totus TV - ${clienteNome} (${comp})`,
      origem: 'pagamento_cliente',
      origem_id: pagId,
      cliente_id: cliente?.id,
      forma_pagamento: params.forma_pagamento,
      created_at: now,
    };
    this.db.fluxo_caixa.push(fluxoItem);

    // 4. Se este cliente foi indicado por alguém e for o primeiro pagamento dele:
    // Convalida a indicação e disponibiliza o mês grátis para o padrinho!
    if (cliente && cliente.indicado_por) {
      const bonusPendente = this.db.bonus.find(
        b => b.cliente_id === cliente.indicado_por && b.indicado_id === cliente.id && b.status === 'pendente'
      );
      if (bonusPendente) {
        bonusPendente.status = 'disponivel';
        bonusPendente.motivo_justificativa = `Validado após confirmação do 1º pagamento de ${cliente.nome}`;
        this.pushToSupabase('bonus_beneficios', bonusPendente);
      }
    }

    // 5. Se havia promessa de pagamento em aberto para esta cobrança, conclui como cumprida
    const prom = this.db.promessas.find(p => p.cobranca_id === cob.id && p.situacao === 'aguardando');
    if (prom) {
      prom.situacao = 'cumprida';
      prom.updated_at = now;
      this.pushToSupabase('promessas_pagamento', { situacao: 'cumprida', updated_at: now }, 'update', 'id', prom.id);
    }

    this.persist();
    this.pushToSupabase('pagamentos', novoPagamento);
    this.pushToSupabase('cobrancas', { status: 'pago', updated_at: now }, 'update', 'id', cob.id);
    this.pushToSupabase('fluxo_caixa', fluxoItem);
    return novoPagamento;
  }

  // ----------------------------------------------------------------------------
  // PROMESSAS DE PAGAMENTO
  // ----------------------------------------------------------------------------
  public registrarPromessa(params: {
    cliente_id: string;
    cobranca_id?: string;
    data_combinada: string;
    valor_prometido: number;
    observacao?: string;
  }): PromessaPagamento {
    const id = `prom-${Date.now()}`;
    const now = new Date().toISOString();
    const promessa: PromessaPagamento = {
      id,
      cliente_id: params.cliente_id,
      cobranca_id: params.cobranca_id,
      data_promessa: new Date().toISOString().split('T')[0],
      data_combinada: params.data_combinada,
      valor_prometido: Number(params.valor_prometido),
      situacao: 'aguardando',
      observacao: params.observacao,
      created_at: now,
      updated_at: now,
    };

    this.db.promessas.push(promessa);

    // Se tiver cobrança vinculada, define o status para 'prometeu_pagar'
    if (params.cobranca_id) {
      const cob = this.db.cobrancas.find(c => c.id === params.cobranca_id);
      if (cob && cob.status !== 'pago') {
        cob.status = 'prometeu_pagar';
        cob.updated_at = now;
      }
    }

    this.persist();
    return promessa;
  }

  public atualizarSituacaoPromessa(promessaId: string, situacao: 'cumprida' | 'nao_cumprida') {
    const prom = this.db.promessas.find(p => p.id === promessaId);
    if (!prom) throw new Error('Promessa não encontrada');
    prom.situacao = situacao;
    prom.updated_at = new Date().toISOString();
    this.persist();
  }

  // ----------------------------------------------------------------------------
  // HISTÓRICO DE CONTATOS / WHATSAPP
  // ----------------------------------------------------------------------------
  public registrarContato(params: {
    cliente_id: string;
    cobranca_id?: string;
    tipo_mensagem: string;
    mensagem_texto: string;
    status_envio: 'preparada' | 'enviada_manual' | 'enviada_auto';
  }): ContatoHistorico {
    const contato: ContatoHistorico = {
      id: `cont-${Date.now()}`,
      cliente_id: params.cliente_id,
      cobranca_id: params.cobranca_id,
      tipo_mensagem: params.tipo_mensagem,
      mensagem_texto: params.mensagem_texto,
      status_envio: params.status_envio,
      enviado_em: new Date().toISOString(),
    };
    this.db.contatos.push(contato);

    // Se a cobrança estava pendente e foi avisado
    if (params.cobranca_id) {
      const cob = this.db.cobrancas.find(c => c.id === params.cobranca_id);
      if (cob && cob.status === 'pendente') {
        cob.status = 'avisado';
        cob.updated_at = new Date().toISOString();
      }
    }

    this.persist();
    return contato;
  }

  // ----------------------------------------------------------------------------
  // MODELOS DE MENSAGENS / LEMBRETES (WHATSAPP)
  // ----------------------------------------------------------------------------
  public getModelosMensagem(): ModeloMensagem[] {
    return this.db.modelos_mensagem && this.db.modelos_mensagem.length > 0
      ? this.db.modelos_mensagem
      : INITIAL_MODELOS_MENSAGEM;
  }

  public saveModeloMensagem(data: Partial<ModeloMensagem> & { titulo: string; texto: string }): ModeloMensagem {
    if (!this.db.modelos_mensagem || this.db.modelos_mensagem.length === 0) {
      this.db.modelos_mensagem = [...INITIAL_MODELOS_MENSAGEM];
    }

    const isEdit = Boolean(data.id);
    const id = data.id || `mod-${Date.now()}`;
    const now = new Date().toISOString();

    let item: ModeloMensagem;
    if (isEdit) {
      const idx = this.db.modelos_mensagem.findIndex(m => m.id === id);
      if (idx === -1) throw new Error('Modelo de mensagem não encontrado');
      const old = this.db.modelos_mensagem[idx];
      item = {
        ...old,
        ...data,
        titulo: data.titulo.trim(),
        texto: data.texto.trim(),
        categoria: data.categoria || old.categoria || 'geral',
        dia_vencimento_alvo: data.dia_vencimento_alvo !== undefined ? (data.dia_vencimento_alvo ? Number(data.dia_vencimento_alvo) : undefined) : old.dia_vencimento_alvo,
        updated_at: now,
      };
      this.db.modelos_mensagem[idx] = item;
    } else {
      item = {
        id,
        titulo: data.titulo.trim(),
        texto: data.texto.trim(),
        categoria: data.categoria || 'geral',
        dia_vencimento_alvo: data.dia_vencimento_alvo ? Number(data.dia_vencimento_alvo) : undefined,
        padrao: false,
        created_at: now,
        updated_at: now,
      };
      this.db.modelos_mensagem.push(item);
    }

    // Se editou os modelos padrões 1 a 5, sincroniza com config
    if (item.id === 'mod-1') this.db.config.msg_lembrete_amanha = item.texto;
    if (item.id === 'mod-2') this.db.config.msg_lembrete_hoje = item.texto;
    if (item.id === 'mod-3') this.db.config.msg_cobranca_pendente = item.texto;
    if (item.id === 'mod-4') this.db.config.msg_promessa_confirmar = item.texto;
    if (item.id === 'mod-5') this.db.config.msg_pagamento_confirmado = item.texto;

    this.persist();
    return item;
  }

  public deleteModeloMensagem(id: string): void {
    if (!this.db.modelos_mensagem || this.db.modelos_mensagem.length === 0) {
      this.db.modelos_mensagem = [...INITIAL_MODELOS_MENSAGEM];
    }
    const idx = this.db.modelos_mensagem.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('Modelo não encontrado');
    this.db.modelos_mensagem.splice(idx, 1);
    this.persist();
  }

  public resetarModelosPadrao(): void {
    this.db.modelos_mensagem = [...INITIAL_MODELOS_MENSAGEM];
    this.persist();
  }

  // ----------------------------------------------------------------------------
  // BÔNUS & BENEFÍCIOS
  // ----------------------------------------------------------------------------
  public getBonus(): BonusBeneficio[] {
    return this.db.bonus;
  }

  public concederBonusManual(params: {
    cliente_id: string;
    motivo: string;
    tipo?: 'manual' | 'indicacao' | 'aniversario';
  }): BonusBeneficio {
    const id = `bon-man-${Date.now()}`;
    const novoBonus: BonusBeneficio = {
      id,
      cliente_id: params.cliente_id,
      tipo: params.tipo || 'manual',
      status: 'disponivel',
      motivo_justificativa: params.motivo,
      data_concessao: new Date().toISOString(),
    };
    this.db.bonus.push(novoBonus);
    this.persist();
    return novoBonus;
  }

  public aplicarBonusNaCobranca(bonusId: string, cobrancaId: string) {
    const bonus = this.db.bonus.find(b => b.id === bonusId);
    if (!bonus) throw new Error('Bônus não encontrado');
    if (bonus.status !== 'disponivel') throw new Error('Este bônus não está mais disponível');

    const cob = this.db.cobrancas.find(c => c.id === cobrancaId);
    if (!cob) throw new Error('Cobrança não encontrada');
    if (cob.status === 'pago') throw new Error('Esta cobrança já foi paga');
    if (cob.status === 'dispensado_bonus' || cob.status === 'dispensado_aniversario') {
      throw new Error('Já existe um benefício aplicado a esta mensalidade');
    }

    const now = new Date().toISOString();
    bonus.status = 'utilizado';
    bonus.competencia_uso_mes = cob.competencia_mes;
    bonus.competencia_uso_ano = cob.competencia_ano;
    bonus.cobranca_dispensada_id = cob.id;
    bonus.data_utilizacao = now;

    cob.status = 'dispensado_bonus';
    cob.bonus_aplicado_id = bonus.id;
    cob.updated_at = now;

    this.persist();
  }

  public cancelarBonus(bonusId: string, motivo: string) {
    const bonus = this.db.bonus.find(b => b.id === bonusId);
    if (!bonus) throw new Error('Bônus não encontrado');
    if (bonus.status === 'utilizado') {
      throw new Error('Não é possível cancelar um bônus que já foi aplicado. Cancele a isenção na cobrança primeiro.');
    }
    bonus.status = 'cancelado';
    bonus.motivo_justificativa = `${bonus.motivo_justificativa || ''} [Cancelado: ${motivo}]`;
    this.persist();
  }

  public saveBonus(data: Partial<BonusBeneficio> & { cliente_id: string; motivo_justificativa?: string; tipo: BonusTipo; status?: BonusStatus }): BonusBeneficio {
    const isEdit = Boolean(data.id);
    const id = data.id || `bon-${Date.now()}`;
    const now = new Date().toISOString();

    let bonusItem: BonusBeneficio;
    if (isEdit) {
      const idx = this.db.bonus.findIndex(b => b.id === id);
      if (idx === -1) throw new Error('Bônus não encontrado');
      const old = this.db.bonus[idx];
      bonusItem = {
        ...old,
        ...data,
      };
      this.db.bonus[idx] = bonusItem;
    } else {
      bonusItem = {
        id,
        cliente_id: data.cliente_id,
        tipo: data.tipo || 'manual',
        status: data.status || 'disponivel',
        indicado_id: data.indicado_id || undefined,
        motivo_justificativa: data.motivo_justificativa || '',
        data_concessao: data.data_concessao || now,
      };
      this.db.bonus.push(bonusItem);
    }
    this.persist();
    this.pushToSupabase('bonus_beneficios', bonusItem);
    return bonusItem;
  }

  public deleteBonus(bonusId: string): void {
    const idx = this.db.bonus.findIndex(b => b.id === bonusId);
    if (idx === -1) throw new Error('Bônus não encontrado');
    const bonus = this.db.bonus[idx];

    // Se o bônus estava aplicado a uma cobrança, reverter a cobrança para pendente
    if (bonus.cobranca_dispensada_id) {
      const cob = this.db.cobrancas.find(c => c.id === bonus.cobranca_dispensada_id);
      if (cob && cob.status === 'dispensado_bonus') {
        cob.status = 'pendente';
        cob.bonus_aplicado_id = undefined;
        cob.updated_at = new Date().toISOString();
        this.pushToSupabase('cobrancas', { status: cob.status, bonus_aplicado_id: null, updated_at: cob.updated_at }, 'update', 'id', cob.id);
      }
    }

    this.db.bonus.splice(idx, 1);
    this.persist();
    if (isSupabaseConfigured && supabase) {
      supabase.from('bonus_beneficios').delete().eq('id', bonusId).then();
    }
  }

  // ----------------------------------------------------------------------------
  // PROGRAMAS E REGRAS DE BÔNUS (CARDS CONFIGURÁVEIS)
  // ----------------------------------------------------------------------------
  public getProgramasBonus(): ProgramaBonus[] {
    return this.db.programas_bonus && this.db.programas_bonus.length > 0
      ? this.db.programas_bonus
      : INITIAL_PROGRAMAS_BONUS;
  }

  public saveProgramaBonus(data: Partial<ProgramaBonus> & { titulo: string; descricao: string }): ProgramaBonus {
    if (!this.db.programas_bonus || this.db.programas_bonus.length === 0) {
      this.db.programas_bonus = [...INITIAL_PROGRAMAS_BONUS];
    }

    const isEdit = Boolean(data.id);
    const id = data.id || `prog-${Date.now()}`;
    const now = new Date().toISOString();

    let item: ProgramaBonus;
    if (isEdit) {
      const idx = this.db.programas_bonus.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Programa de bônus não encontrado');
      const old = this.db.programas_bonus[idx];
      item = {
        ...old,
        ...data,
        titulo: data.titulo.trim(),
        descricao: data.descricao.trim(),
      };
      this.db.programas_bonus[idx] = item;
    } else {
      item = {
        id,
        titulo: data.titulo.trim(),
        descricao: data.descricao.trim(),
        cor: data.cor || '#ec4899',
        icone: data.icone || 'Gift',
        ativo: data.ativo !== false,
        created_at: now,
      };
      this.db.programas_bonus.push(item);
    }

    this.persist();
    this.pushToSupabase('programas_bonus', item);
    return item;
  }

  public deleteProgramaBonus(id: string): void {
    if (!this.db.programas_bonus || this.db.programas_bonus.length === 0) {
      this.db.programas_bonus = [...INITIAL_PROGRAMAS_BONUS];
    }
    const idx = this.db.programas_bonus.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Programa de bônus não encontrado');
    this.db.programas_bonus.splice(idx, 1);
    this.persist();
    if (isSupabaseConfigured && supabase) {
      supabase.from('programas_bonus').delete().eq('id', id).then();
    }
  }

  // ----------------------------------------------------------------------------
  // DESPESAS
  // ----------------------------------------------------------------------------
  public getDespesas(): Despesa[] {
    return this.db.despesas;
  }

  public getCategoriasDespesas(): CategoriaDespesa[] {
    return this.db.categorias_despesas;
  }

  public saveCategoriaDespesa(nome: string, cor?: string, icone?: string): CategoriaDespesa {
    const trimmed = nome.trim();
    const existing = this.db.categorias_despesas.find(c => c.nome.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const cat: CategoriaDespesa = {
      id: `cat-${Date.now()}`,
      nome: trimmed,
      cor: cor || '#64748b',
      icone: icone || 'Tag',
    };
    this.db.categorias_despesas.push(cat);
    this.persist();
    this.pushToSupabase('categorias_despesas', cat);
    return cat;
  }

  public saveDespesa(params: {
    id?: string;
    descricao: string;
    categoria_id?: string;
    categoria_nome: string;
    valor: number;
    data_competencia: string;
    data_vencimento: string;
    data_pagamento?: string;
    status: 'pendente' | 'paga' | 'cancelada';
    forma_pagamento?: FormaPagamento;
    recorrente?: boolean;
    periodicidade?: string;
    observacoes?: string;
  }): Despesa {
    const now = new Date().toISOString();
    const isEdit = Boolean(params.id);
    const id = params.id || `desp-${Date.now()}`;

    this.unregisterDeletedDespesaId(id);

    let despesa: Despesa;

    if (isEdit) {
      const idx = this.db.despesas.findIndex(d => d.id === id);
      if (idx === -1) throw new Error('Despesa não encontrada');
      const old = this.db.despesas[idx];

      despesa = {
        ...old,
        ...params,
        valor: Number(params.valor),
        recorrente: Boolean(params.recorrente),
        updated_at: now,
      };
      this.db.despesas[idx] = despesa;
    } else {
      despesa = {
        id,
        descricao: params.descricao.trim(),
        categoria_id: params.categoria_id,
        categoria_nome: params.categoria_nome,
        valor: Number(params.valor),
        data_competencia: params.data_competencia || new Date().toISOString().split('T')[0],
        data_vencimento: params.data_vencimento,
        data_pagamento: params.data_pagamento,
        status: params.status || 'pendente',
        forma_pagamento: params.forma_pagamento,
        recorrente: Boolean(params.recorrente),
        periodicidade: params.periodicidade || 'mensal',
        observacoes: params.observacoes,
        created_at: now,
        updated_at: now,
      };
      this.db.despesas.push(despesa);
    }

    // Se já estiver paga, garantir saída correspondente no Livro Caixa
    let flxItemToPush: FluxoCaixaItem | null = null;
    if (despesa.status === 'paga' && despesa.data_pagamento) {
      const flxId = `flx-desp-${despesa.id}`;
      const flxIdx = this.db.fluxo_caixa.findIndex(f => f.id === flxId);
      const flxItem: FluxoCaixaItem = {
        id: flxId,
        data_movimento: despesa.data_pagamento.split('T')[0],
        tipo: 'saida',
        valor: despesa.valor,
        descricao: despesa.descricao,
        origem: 'despesa_paga',
        origem_id: despesa.id,
        forma_pagamento: despesa.forma_pagamento || 'pix',
        created_at: now,
      };
      flxItemToPush = flxItem;

      if (flxIdx >= 0) {
        this.db.fluxo_caixa[flxIdx] = flxItem;
      } else {
        this.db.fluxo_caixa.push(flxItem);
      }
    } else {
      // Se a despesa foi editada e não está paga, remove do fluxo de caixa
      const flxId = `flx-desp-${despesa.id}`;
      this.db.fluxo_caixa = this.db.fluxo_caixa.filter(f => f.id !== flxId && f.origem_id !== despesa.id);
    }

    this.persist();
    this.pushToSupabase('despesas', despesa);
    if (flxItemToPush) {
      this.pushToSupabase('fluxo_caixa', flxItemToPush);
    }
    return despesa;
  }

  public marcarDespesaComoPaga(despesaId: string, params: {
    data_pagamento: string;
    forma_pagamento: FormaPagamento;
  }) {
    const desp = this.db.despesas.find(d => d.id === despesaId);
    if (!desp) throw new Error('Despesa não encontrada');

    const now = new Date().toISOString();
    desp.status = 'paga';
    desp.data_pagamento = params.data_pagamento || now.split('T')[0];
    desp.forma_pagamento = params.forma_pagamento;
    desp.updated_at = now;

    // Registra no fluxo de caixa (livro caixa)
    const flxId = `flx-desp-${desp.id}`;
    const flxIdx = this.db.fluxo_caixa.findIndex(f => f.id === flxId);
    const flxItem: FluxoCaixaItem = {
      id: flxId,
      data_movimento: desp.data_pagamento.split('T')[0],
      tipo: 'saida',
      valor: desp.valor,
      descricao: desp.descricao,
      origem: 'despesa_paga',
      origem_id: desp.id,
      forma_pagamento: params.forma_pagamento,
      created_at: now,
    };

    if (flxIdx >= 0) {
      this.db.fluxo_caixa[flxIdx] = flxItem;
    } else {
      this.db.fluxo_caixa.push(flxItem);
    }

    this.persist();
    this.pushToSupabase('despesas', { status: desp.status, data_pagamento: desp.data_pagamento, forma_pagamento: desp.forma_pagamento, updated_at: desp.updated_at }, 'update', 'id', desp.id);
    this.pushToSupabase('fluxo_caixa', flxItem);
  }

  public cancelarDespesa(despesaId: string, motivo: string) {
    const desp = this.db.despesas.find(d => d.id === despesaId);
    if (!desp) throw new Error('Despesa não encontrada');

    desp.status = 'cancelada';
    desp.motivo_cancelamento = motivo;
    desp.updated_at = new Date().toISOString();

    // Se havia registro de fluxo de caixa gerado, removemos
    this.db.fluxo_caixa = this.db.fluxo_caixa.filter(f => f.origem_id !== desp.id);

    this.persist();
    this.pushToSupabase('despesas', { status: desp.status, motivo_cancelamento: desp.motivo_cancelamento, updated_at: desp.updated_at }, 'update', 'id', desp.id);
  }

  public excluirDespesa(despesaId: string) {
    if (!despesaId) return;
    this.registerDeletedDespesaId(despesaId);

    const idx = this.db.despesas.findIndex(d => d.id === despesaId);
    let despDescricao = '';
    if (idx !== -1) {
      despDescricao = this.db.despesas[idx].descricao;
      this.db.despesas.splice(idx, 1);
    }

    const flxId = `flx-desp-${despesaId}`;
    const flxIdsToRemove: string[] = [];

    this.db.fluxo_caixa = this.db.fluxo_caixa.filter(f => {
      const isMatch = (
        f.id === flxId ||
        f.id === despesaId ||
        f.origem_id === despesaId ||
        (despDescricao && (
          f.descricao === despDescricao ||
          f.descricao.includes(despDescricao) ||
          f.descricao === `Pagamento Despesa: ${despDescricao}` ||
          despDescricao === f.descricao.replace(/pagamento despesa:\s*/i, '').trim()
        ))
      );
      if (isMatch) {
        flxIdsToRemove.push(f.id);
        return false;
      }
      return true;
    });

    this.persist();
    this.purgeDespesaFromSupabase(despesaId);
    flxIdsToRemove.forEach(id => {
      this.pushToSupabase('fluxo_caixa', { id }, 'delete', 'id', id);
    });
  }

  public excluirItemFluxoCaixa(fluxoId: string) {
    const item = this.db.fluxo_caixa.find(f => f.id === fluxoId);
    if (!item) return;

    this.db.fluxo_caixa = this.db.fluxo_caixa.filter(f => f.id !== fluxoId);

    // Se tiver despesa vinculada, remove também de despesas
    if (item.origem_id) {
      this.registerDeletedDespesaId(item.origem_id);
      const despIdx = this.db.despesas.findIndex(d => d.id === item.origem_id);
      if (despIdx !== -1) {
        this.db.despesas.splice(despIdx, 1);
      }
      this.purgeDespesaFromSupabase(item.origem_id);
    }

    this.persist();
    this.pushToSupabase('fluxo_caixa', { id: fluxoId }, 'delete', 'id', fluxoId);
    if (item.origem_id) {
      this.pushToSupabase('fluxo_caixa', { origem_id: item.origem_id }, 'delete', 'origem_id', item.origem_id);
    }
  }

  public reconciliarFluxoDespesas() {
    const despesasIds = new Set(this.db.despesas.map(d => d.id));
    const despesasDescricoes = new Set(this.db.despesas.map(d => d.descricao.toLowerCase().trim()));
    const countBefore = this.db.fluxo_caixa.length;
    const flxIdsToRemove: string[] = [];

    this.db.fluxo_caixa = this.db.fluxo_caixa.filter(f => {
      if (f.origem === 'despesa_paga' || (f.tipo === 'saida' && f.descricao.toLowerCase().includes('despesa'))) {
        if (f.origem_id && despesasIds.has(f.origem_id)) return true;
        const limpa = f.descricao.replace(/pagamento despesa:\s*/i, '').toLowerCase().trim();
        if (despesasDescricoes.has(limpa)) return true;

        flxIdsToRemove.push(f.id);
        return false;
      }
      return true;
    });

    if (this.db.fluxo_caixa.length !== countBefore) {
      this.persist();
      flxIdsToRemove.forEach(id => {
        this.pushToSupabase('fluxo_caixa', { id }, 'delete', 'id', id);
      });
    }
  }

  // ----------------------------------------------------------------------------
  // FLUXO DE CAIXA
  // ----------------------------------------------------------------------------
  public getFluxoCaixa(): FluxoCaixaItem[] {
    return this.db.fluxo_caixa;
  }

  // ----------------------------------------------------------------------------
  // CONFIGURAÇÕES
  // ----------------------------------------------------------------------------
  public getConfig(): ConfiguracoesApp {
    return this.db.config;
  }

  public saveConfig(config: Partial<ConfiguracoesApp>) {
    this.db.config = {
      ...this.db.config,
      ...config,
    };
    this.persist();
    this.pushToSupabase('configuracoes', { ...this.db.config, id: this.db.config.id || 'config_singleton' });
  }

  // ----------------------------------------------------------------------------
  // HISTÓRICOS AUXILIARES
  // ----------------------------------------------------------------------------
  public getHistoricoVencimentos(clienteId?: string): HistoricoVencimento[] {
    if (clienteId) {
      return this.db.historico_vencimentos.filter(h => h.cliente_id === clienteId);
    }
    return this.db.historico_vencimentos;
  }

  public getPromessas(): PromessaPagamento[] {
    return this.db.promessas;
  }

  public getContatos(clienteId?: string): ContatoHistorico[] {
    if (clienteId) {
      return this.db.contatos.filter(c => c.cliente_id === clienteId);
    }
    return this.db.contatos;
  }

  public getPagamentos(): Pagamento[] {
    return this.db.pagamentos;
  }

  // ----------------------------------------------------------------------------
  // GESTÃO DE USUÁRIOS E EQUIPE (ADMINISTRADORES E REVENDEDORES)
  // ----------------------------------------------------------------------------
  public getUsuarios(): UserProfile[] {
    return this.db.usuarios || [];
  }

  public getUsuarioById(id: string): UserProfile | undefined {
    return (this.db.usuarios || []).find(u => u.id === id);
  }

  public salvarUsuario(data: Partial<UserProfile> & { nome: string; email: string; role?: 'admin' | 'reseller' }): UserProfile {
    const isEdit = Boolean(data.id);
    const id = data.id || `user-reseller-${Date.now()}`;
    const now = new Date().toISOString();

    let user: UserProfile;

    if (!this.db.usuarios) {
      this.db.usuarios = [...INITIAL_USERS];
    }

    if (isEdit) {
      const idx = this.db.usuarios.findIndex(u => u.id === id);
      if (idx === -1) throw new Error('Usuário não encontrado');

      const old = this.db.usuarios[idx];
      user = {
        ...old,
        ...data,
        // Proteção: não altera role acidentalmente
        role: data.role || old.role,
        status: data.status || old.status,
      };
      this.db.usuarios[idx] = user;

      this.registrarLogAuditoria({
        user_id: 'admin',
        user_nome: 'Administrador',
        user_email: 'admin@totustv.com',
        acao: 'editar_usuario',
        tabela: 'perfis',
        registro_id: id,
        detalhes: `Atualizados dados do usuário ${user.nome} (${user.email})`,
        dados_anteriores: old,
        dados_novos: user,
      });
    } else {
      // Validar email duplicado
      if (this.db.usuarios.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
        throw new Error('Já existe um usuário cadastrado com este e-mail');
      }

      user = {
        id,
        nome: data.nome.trim(),
        email: data.email.toLowerCase().trim(),
        role: data.role || 'reseller',
        status: data.status || 'ativo',
        telefone: data.telefone || '',
        created_at: now,
      };
      this.db.usuarios.push(user);

      this.registrarLogAuditoria({
        user_id: 'admin',
        user_nome: 'Administrador',
        user_email: 'admin@totustv.com',
        acao: 'cadastrar_revendedor',
        tabela: 'perfis',
        registro_id: id,
        detalhes: `Criado novo revendedor ${user.nome} (${user.email})`,
        dados_novos: user,
      });
    }

    this.persist();
    this.pushToSupabase('perfis', user);
    return user;
  }

  public toggleStatusUsuario(usuarioId: string): UserProfile {
    const user = (this.db.usuarios || []).find(u => u.id === usuarioId);
    if (!user) throw new Error('Usuário não encontrado');

    const statusAnterior = user.status;
    user.status = user.status === 'ativo' ? 'suspenso' : 'ativo';

    this.registrarLogAuditoria({
      user_id: 'admin',
      user_nome: 'Administrador',
      user_email: 'admin@totustv.com',
      acao: user.status === 'suspenso' ? 'suspender_usuario' : 'ativar_usuario',
      tabela: 'perfis',
      registro_id: usuarioId,
      detalhes: `Status do usuário ${user.nome} alterado de ${statusAnterior} para ${user.status}`,
    });

    this.persist();
    this.pushToSupabase('perfis', { status: user.status }, 'update', 'id', usuarioId);
    return user;
  }

  public transferirClienteResponsavel(clienteId: string, novoResellerId: string | undefined, motivo?: string) {
    const cli = this.db.clientes.find(c => c.id === clienteId);
    if (!cli) throw new Error('Cliente não encontrado');

    const anteriorResellerId = cli.reseller_id;
    cli.reseller_id = novoResellerId || undefined;
    cli.updated_at = new Date().toISOString();

    const anteriorNome = anteriorResellerId
      ? (this.getUsuarioById(anteriorResellerId)?.nome || anteriorResellerId)
      : 'Totus TV (Direto/Admin)';
    const novoNome = novoResellerId
      ? (this.getUsuarioById(novoResellerId)?.nome || novoResellerId)
      : 'Totus TV (Direto/Admin)';

    this.registrarLogAuditoria({
      user_id: 'admin',
      user_nome: 'Administrador',
      user_email: 'admin@totustv.com',
      acao: 'transferir_cliente',
      tabela: 'clientes',
      registro_id: clienteId,
      detalhes: `Transferência de carteira do cliente ${cli.nome}: de "${anteriorNome}" para "${novoNome}". Motivo: ${motivo || 'Reatribuição administrativa'}`,
      dados_anteriores: { reseller_id: anteriorResellerId },
      dados_novos: { reseller_id: novoResellerId },
    });

    this.persist();
    this.pushToSupabase('clientes', { reseller_id: cli.reseller_id || null, updated_at: cli.updated_at }, 'update', 'id', clienteId);
  }

  // ----------------------------------------------------------------------------
  // AUDITORIA E LOGS DE SISTEMA
  // ----------------------------------------------------------------------------
  public getLogsAuditoria(): AuditLog[] {
    return (this.db.logs_auditoria || []).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public registrarLogAuditoria(params: {
    user_id: string;
    user_nome: string;
    user_email: string;
    acao: string;
    tabela: string;
    registro_id?: string;
    detalhes?: string;
    dados_anteriores?: any;
    dados_novos?: any;
  }): AuditLog {
    if (!this.db.logs_auditoria) {
      this.db.logs_auditoria = [...INITIAL_AUDIT_LOGS];
    }

    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: params.user_id,
      user_nome: params.user_nome,
      user_email: params.user_email,
      acao: params.acao,
      tabela: params.tabela,
      registro_id: params.registro_id,
      detalhes: params.detalhes,
      dados_anteriores: params.dados_anteriores,
      dados_novos: params.dados_novos,
      created_at: new Date().toISOString(),
    };

    this.db.logs_auditoria.unshift(log);
    // Limite preventivo dos últimos 1000 logs em storage
    if (this.db.logs_auditoria.length > 1000) {
      this.db.logs_auditoria = this.db.logs_auditoria.slice(0, 1000);
    }

    this.persist();
    this.pushToSupabase('logs_auditoria', log);
    return log;
  }
}

// Instância singleton pronta para uso em toda a aplicação
export const totusDB = new TotusDBManager();
if (typeof window !== 'undefined') {
  (window as any).totusDB = totusDB;
}
