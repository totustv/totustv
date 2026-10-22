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

const INITIAL_CLIENTES: Cliente[] = [
  {
    id: 'cli-1',
    nome: 'Carlos Eduardo Mendes',
    whatsapp: '11981234567',
    valor_mensalidade: 35.00,
    dia_vencimento: 10,
    data_cadastro: '2026-01-15T10:00:00Z',
    data_inicio_servico: '2026-01-15',
    data_nascimento: '1988-10-14', // Aniversariante do mês de Outubro!
    pais: 'Brasil',
    estado: 'SP',
    cidade: 'São Paulo',
    status: 'ativo',
    reseller_id: 'user-reseller-1', // Carteira do Revendedor A (Carlos Revenda SP)
    observacoes: 'Cliente pioneiro. Smart TV Samsung sala e quarto.',
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
  },
  {
    id: 'cli-2',
    nome: 'Juliana Beatriz Silveira',
    whatsapp: '11972345678',
    valor_mensalidade: 40.00,
    dia_vencimento: 20,
    data_cadastro: '2026-02-10T14:30:00Z',
    data_inicio_servico: '2026-02-10',
    data_nascimento: '1994-05-22',
    pais: 'Brasil',
    estado: 'SP',
    cidade: 'Campinas',
    status: 'ativo',
    reseller_id: 'user-reseller-1', // Carteira do Revendedor A (Carlos Revenda SP)
    observacoes: 'Plano com 2 telas simultâneas.',
    created_at: '2026-02-10T14:30:00Z',
    updated_at: '2026-10-01T10:00:00Z',
  },
  {
    id: 'cli-3',
    nome: 'Marcos Vinicius Rocha',
    whatsapp: '11993456789',
    valor_mensalidade: 35.00,
    dia_vencimento: 30,
    data_cadastro: '2026-03-01T09:00:00Z',
    data_inicio_servico: '2026-03-01',
    data_nascimento: '1990-11-03',
    pais: 'Brasil',
    estado: 'RJ',
    cidade: 'Rio de Janeiro',
    status: 'ativo',
    reseller_id: 'user-reseller-2', // Carteira do Revendedor B (Renato Revenda RJ)
    indicado_por: 'cli-1', // Indicado por Carlos!
    observacoes: 'Indicado por Carlos Eduardo. Muito pontual.',
    created_at: '2026-03-01T09:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
  },
  {
    id: 'cli-4',
    nome: 'Fernanda Cristina Souza',
    whatsapp: '11964567890',
    valor_mensalidade: 35.00,
    dia_vencimento: 10,
    data_cadastro: '2026-04-12T11:00:00Z',
    data_inicio_servico: '2026-04-12',
    data_nascimento: '1985-08-19',
    pais: 'Brasil',
    estado: 'RJ',
    cidade: 'Niterói',
    status: 'ativo',
    reseller_id: 'user-reseller-2', // Carteira do Revendedor B (Renato Revenda RJ)
    observacoes: 'Tv box Xiaomi.',
    created_at: '2026-04-12T11:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
  },
  {
    id: 'cli-5',
    nome: 'Rodrigo Barbosa Lima',
    whatsapp: '11955678901',
    valor_mensalidade: 35.00,
    dia_vencimento: 20,
    data_cadastro: '2026-05-20T16:00:00Z',
    data_inicio_servico: '2026-05-20',
    data_nascimento: '1997-10-25', // Aniversariante de Outubro!
    pais: 'Brasil',
    estado: 'MG',
    cidade: 'Belo Horizonte',
    status: 'ativo',
    reseller_id: undefined, // Carteira direta da Totus TV (Admin)
    observacoes: 'Usa no celular e Fire TV Stick.',
    created_at: '2026-05-20T16:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
  },
  {
    id: 'cli-6',
    nome: 'Patrícia Helena Alencar',
    whatsapp: '11946789012',
    valor_mensalidade: 35.00,
    dia_vencimento: 10,
    data_cadastro: '2026-07-05T10:15:00Z',
    data_inicio_servico: '2026-07-05',
    data_nascimento: '1992-03-12',
    pais: 'Brasil',
    estado: 'SP',
    cidade: 'Santos',
    status: 'inativo',
    reseller_id: 'user-reseller-1', // Pertenceu ao Revendedor A
    observacoes: 'Cancelou por mudança de cidade em agosto.',
    created_at: '2026-07-05T10:15:00Z',
    updated_at: '2026-08-30T10:00:00Z',
  },
  {
    id: 'cli-7',
    nome: 'Lucas Gabriel Martins',
    whatsapp: '11937890123',
    valor_mensalidade: 35.00,
    dia_vencimento: 10,
    data_cadastro: '2026-10-02T13:40:00Z', // Novo no mês
    data_inicio_servico: '2026-10-02',
    data_nascimento: '2001-09-15',
    status: 'ativo',
    reseller_id: undefined, // Carteira direta da Totus TV (Admin)
    observacoes: 'Novo cliente de outubro.',
    created_at: '2026-10-02T13:40:00Z',
    updated_at: '2026-10-02T13:40:00Z',
  }
];

const INITIAL_COBRANCAS: Cobranca[] = [
  // Carlos (cli-1) Vencimento dia 10 - Outubro (Dispensado por Aniversário de Carlos!)
  {
    id: 'cob-1',
    cliente_id: 'cli-1',
    competencia_mes: 10,
    competencia_ano: 2026,
    valor: 35.00,
    data_vencimento: '2026-10-10',
    status: 'dispensado_aniversario',
    bonus_aplicado_id: 'bon-aniv-1',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
  },
  // Fernanda (cli-4) Vencimento dia 10 - Outubro (Venceu ontem/hoje, atrasado aguardando)
  {
    id: 'cob-2',
    cliente_id: 'cli-4',
    competencia_mes: 10,
    competencia_ano: 2026,
    valor: 35.00,
    data_vencimento: '2026-10-10',
    status: 'prometeu_pagar',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-11T09:00:00Z',
  },
  // Lucas (cli-7) Vencimento dia 10 - Outubro (Pago na ativação)
  {
    id: 'cob-3',
    cliente_id: 'cli-7',
    competencia_mes: 10,
    competencia_ano: 2026,
    valor: 35.00,
    data_vencimento: '2026-10-10',
    status: 'pago',
    created_at: '2026-10-02T00:00:00Z',
    updated_at: '2026-10-02T14:00:00Z',
  },
  // Juliana (cli-2) Vencimento dia 20 - Outubro (Pendente)
  {
    id: 'cob-4',
    cliente_id: 'cli-2',
    competencia_mes: 10,
    competencia_ano: 2026,
    valor: 40.00,
    data_vencimento: '2026-10-20',
    status: 'pendente',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
  },
  // Rodrigo (cli-5) Vencimento dia 20 - Outubro (Dispensado por Aniversário de Outubro)
  {
    id: 'cob-5',
    cliente_id: 'cli-5',
    competencia_mes: 10,
    competencia_ano: 2026,
    valor: 35.00,
    data_vencimento: '2026-10-20',
    status: 'dispensado_aniversario',
    bonus_aplicado_id: 'bon-aniv-2',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
  },
  // Marcos (cli-3) Vencimento dia 30 - Outubro (Pendente)
  {
    id: 'cob-6',
    cliente_id: 'cli-3',
    competencia_mes: 10,
    competencia_ano: 2026,
    valor: 35.00,
    data_vencimento: '2026-10-30',
    status: 'pendente',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
  },
  // Cobranças Setembro (Mês anterior - para comparativos financeiros)
  {
    id: 'cob-set-1',
    cliente_id: 'cli-1',
    competencia_mes: 9,
    competencia_ano: 2026,
    valor: 35.00,
    data_vencimento: '2026-09-10',
    status: 'pago',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-10T10:00:00Z',
  },
  {
    id: 'cob-set-2',
    cliente_id: 'cli-2',
    competencia_mes: 9,
    competencia_ano: 2026,
    valor: 40.00,
    data_vencimento: '2026-09-20',
    status: 'pago',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-19T11:00:00Z',
  },
  {
    id: 'cob-set-3',
    cliente_id: 'cli-3',
    competencia_mes: 9,
    competencia_ano: 2026,
    valor: 35.00,
    data_vencimento: '2026-09-30',
    status: 'pago',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-30T16:00:00Z',
  },
  {
    id: 'cob-set-4',
    cliente_id: 'cli-4',
    competencia_mes: 9,
    competencia_ano: 2026,
    valor: 35.00,
    data_vencimento: '2026-09-10',
    status: 'pago',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-09T18:00:00Z',
  },
  {
    id: 'cob-set-5',
    cliente_id: 'cli-5',
    competencia_mes: 9,
    competencia_ano: 2026,
    valor: 35.00,
    data_vencimento: '2026-09-20',
    status: 'pago',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-20T14:30:00Z',
  }
];

const INITIAL_PAGAMENTOS: Pagamento[] = [
  {
    id: 'pag-1',
    cobranca_id: 'cob-3',
    cliente_id: 'cli-7',
    valor_pago: 35.00,
    data_pagamento: '2026-10-02T14:00:00Z',
    forma_pagamento: 'pix',
    observacao: 'Pagamento inicial na adesão via Pix',
    created_at: '2026-10-02T14:00:00Z',
  },
  {
    id: 'pag-set-1',
    cobranca_id: 'cob-set-1',
    cliente_id: 'cli-1',
    valor_pago: 35.00,
    data_pagamento: '2026-09-10T10:00:00Z',
    forma_pagamento: 'pix',
    created_at: '2026-09-10T10:00:00Z',
  },
  {
    id: 'pag-set-2',
    cobranca_id: 'cob-set-2',
    cliente_id: 'cli-2',
    valor_pago: 40.00,
    data_pagamento: '2026-09-19T11:00:00Z',
    forma_pagamento: 'pix',
    created_at: '2026-09-19T11:00:00Z',
  },
  {
    id: 'pag-set-3',
    cobranca_id: 'cob-set-3',
    cliente_id: 'cli-3',
    valor_pago: 35.00,
    data_pagamento: '2026-09-30T16:00:00Z',
    forma_pagamento: 'dinheiro',
    created_at: '2026-09-30T16:00:00Z',
  },
  {
    id: 'pag-set-4',
    cobranca_id: 'cob-set-4',
    cliente_id: 'cli-4',
    valor_pago: 35.00,
    data_pagamento: '2026-09-09T18:00:00Z',
    forma_pagamento: 'pix',
    created_at: '2026-09-09T18:00:00Z',
  },
  {
    id: 'pag-set-5',
    cobranca_id: 'cob-set-5',
    cliente_id: 'cli-5',
    valor_pago: 35.00,
    data_pagamento: '2026-09-20T14:30:00Z',
    forma_pagamento: 'pix',
    created_at: '2026-09-20T14:30:00Z',
  }
];

const INITIAL_PROMESSAS: PromessaPagamento[] = [
  {
    id: 'prom-1',
    cliente_id: 'cli-4',
    cobranca_id: 'cob-2',
    data_promessa: '2026-10-10',
    data_combinada: '2026-10-13',
    valor_prometido: 35.00,
    situacao: 'aguardando',
    observacao: 'Cliente pediu para pagar na terça-feira dia 13 quando recebe adiantamento.',
    created_at: '2026-10-10T15:20:00Z',
    updated_at: '2026-10-10T15:20:00Z',
  }
];

const INITIAL_BONUS: BonusBeneficio[] = [
  {
    id: 'bon-aniv-1',
    cliente_id: 'cli-1',
    tipo: 'aniversario',
    status: 'utilizado',
    competencia_uso_mes: 10,
    competencia_uso_ano: 2026,
    cobranca_dispensada_id: 'cob-1',
    motivo_justificativa: 'Mês de aniversário do cliente (14/10)',
    data_concessao: '2026-10-01T00:00:00Z',
    data_utilizacao: '2026-10-01T00:00:00Z',
  },
  {
    id: 'bon-aniv-2',
    cliente_id: 'cli-5',
    tipo: 'aniversario',
    status: 'utilizado',
    competencia_uso_mes: 10,
    competencia_uso_ano: 2026,
    cobranca_dispensada_id: 'cob-5',
    motivo_justificativa: 'Mês de aniversário do cliente (25/10)',
    data_concessao: '2026-10-01T00:00:00Z',
    data_utilizacao: '2026-10-01T00:00:00Z',
  },
  {
    id: 'bon-ind-1',
    cliente_id: 'cli-1', // Carlos indicou Marcos
    tipo: 'indicacao',
    status: 'disponivel', // Disponível para novembro ou próximo ciclo
    indicado_id: 'cli-3', // Marcos Vinicius
    motivo_justificativa: 'Indicação confirmada de Marcos Vinicius Rocha',
    data_concessao: '2026-03-31T00:00:00Z',
  }
];

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

const INITIAL_DESPESAS: Despesa[] = [
  {
    id: 'desp-1',
    descricao: 'Servidor Principal VPS / Stream Cloud',
    categoria_id: 'cat-1',
    categoria_nome: 'Servidores e Hospedagem',
    valor: 45.00,
    data_competencia: '2026-10-01',
    data_vencimento: '2026-10-05',
    data_pagamento: '2026-10-05',
    status: 'paga',
    forma_pagamento: 'pix',
    recorrente: true,
    periodicidade: 'mensal',
    observacoes: 'Servidor de alta disponibilidade.',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-05T10:00:00Z',
  },
  {
    id: 'desp-2',
    descricao: 'Painel CMS e Licença de API',
    categoria_id: 'cat-2',
    categoria_nome: 'Sistemas e Ferramentas',
    valor: 25.00,
    data_competencia: '2026-10-01',
    data_vencimento: '2026-10-15',
    status: 'pendente',
    forma_pagamento: 'pix',
    recorrente: true,
    periodicidade: 'mensal',
    observacoes: 'Vence dia 15/10.',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'desp-set-1',
    descricao: 'Servidor Principal VPS Setembro',
    categoria_id: 'cat-1',
    categoria_nome: 'Servidores e Hospedagem',
    valor: 45.00,
    data_competencia: '2026-09-01',
    data_vencimento: '2026-09-05',
    data_pagamento: '2026-09-05',
    status: 'paga',
    forma_pagamento: 'pix',
    recorrente: true,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-05T10:00:00Z',
  },
  {
    id: 'desp-set-2',
    descricao: 'Painel CMS Setembro',
    categoria_id: 'cat-2',
    categoria_nome: 'Sistemas e Ferramentas',
    valor: 25.00,
    data_competencia: '2026-09-01',
    data_vencimento: '2026-09-15',
    data_pagamento: '2026-09-15',
    status: 'paga',
    forma_pagamento: 'pix',
    recorrente: true,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-15T10:00:00Z',
  }
];

const INITIAL_FLUXO: FluxoCaixaItem[] = [
  // Outubro
  {
    id: 'flx-1',
    data_movimento: '2026-10-02',
    tipo: 'entrada',
    valor: 35.00,
    descricao: 'Mensalidade Totus TV - Lucas Gabriel Martins (10/2026)',
    origem: 'pagamento_cliente',
    origem_id: 'pag-1',
    cliente_id: 'cli-7',
    forma_pagamento: 'pix',
    created_at: '2026-10-02T14:00:00Z',
  },
  {
    id: 'flx-2',
    data_movimento: '2026-10-05',
    tipo: 'saida',
    valor: 45.00,
    descricao: 'Servidor Principal VPS / Stream Cloud',
    origem: 'despesa_paga',
    origem_id: 'desp-1',
    forma_pagamento: 'pix',
    created_at: '2026-10-05T10:00:00Z',
  },
  // Setembro
  {
    id: 'flx-set-1',
    data_movimento: '2026-09-05',
    tipo: 'saida',
    valor: 45.00,
    descricao: 'Servidor Principal VPS Setembro',
    origem: 'despesa_paga',
    origem_id: 'desp-set-1',
    forma_pagamento: 'pix',
    created_at: '2026-09-05T10:00:00Z',
  },
  {
    id: 'flx-set-2',
    data_movimento: '2026-09-09',
    tipo: 'entrada',
    valor: 35.00,
    descricao: 'Mensalidade Totus TV - Fernanda Cristina Souza (09/2026)',
    origem: 'pagamento_cliente',
    origem_id: 'pag-set-4',
    cliente_id: 'cli-4',
    forma_pagamento: 'pix',
    created_at: '2026-09-09T18:00:00Z',
  },
  {
    id: 'flx-set-3',
    data_movimento: '2026-09-10',
    tipo: 'entrada',
    valor: 35.00,
    descricao: 'Mensalidade Totus TV - Carlos Eduardo Mendes (09/2026)',
    origem: 'pagamento_cliente',
    origem_id: 'pag-set-1',
    cliente_id: 'cli-1',
    forma_pagamento: 'pix',
    created_at: '2026-09-10T10:00:00Z',
  },
  {
    id: 'flx-set-4',
    data_movimento: '2026-09-15',
    tipo: 'saida',
    valor: 25.00,
    descricao: 'Painel CMS Setembro',
    origem: 'despesa_paga',
    origem_id: 'desp-set-2',
    forma_pagamento: 'pix',
    created_at: '2026-09-15T10:00:00Z',
  },
  {
    id: 'flx-set-5',
    data_movimento: '2026-09-19',
    tipo: 'entrada',
    valor: 40.00,
    descricao: 'Mensalidade Totus TV - Juliana Beatriz Silveira (09/2026)',
    origem: 'pagamento_cliente',
    origem_id: 'pag-set-2',
    cliente_id: 'cli-2',
    forma_pagamento: 'pix',
    created_at: '2026-09-19T11:00:00Z',
  },
  {
    id: 'flx-set-6',
    data_movimento: '2026-09-20',
    tipo: 'entrada',
    valor: 35.00,
    descricao: 'Mensalidade Totus TV - Rodrigo Barbosa Lima (09/2026)',
    origem: 'pagamento_cliente',
    origem_id: 'pag-set-5',
    cliente_id: 'cli-5',
    forma_pagamento: 'pix',
    created_at: '2026-09-20T14:30:00Z',
  },
  {
    id: 'flx-set-7',
    data_movimento: '2026-09-30',
    tipo: 'entrada',
    valor: 35.00,
    descricao: 'Mensalidade Totus TV - Marcos Vinicius Rocha (09/2026)',
    origem: 'pagamento_cliente',
    origem_id: 'pag-set-3',
    cliente_id: 'cli-3',
    forma_pagamento: 'dinheiro',
    created_at: '2026-09-30T16:00:00Z',
  }
];

// ==============================================================================
// GERENCIADOR DE BANCO DE DADOS LOCAL E PERSISTENTE (AUDITÁVEL E ATÔMICO)
// ==============================================================================

const STORAGE_KEY = 'totustv_database_v1';

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
}

export class TotusDBManager {
  private db: TotusDatabase;
  private listeners: (() => void)[] = [];

  constructor() {
    this.db = this.loadFromStorage();
    this.autoCalculateAtrasos();
  }

  private loadFromStorage(): TotusDatabase {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Garantir retrocompatibilidade e integridade caso chaves novas não existam no localStorage anterior
        return {
          config: parsed.config || INITIAL_CONFIG,
          clientes: (parsed.clientes || INITIAL_CLIENTES).map((c: any) => {
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
          }),
          cobrancas: parsed.cobrancas || INITIAL_COBRANCAS,
          pagamentos: parsed.pagamentos || INITIAL_PAGAMENTOS,
          historico_vencimentos: parsed.historico_vencimentos || [],
          promessas: parsed.promessas || INITIAL_PROMESSAS,
          contatos: parsed.contatos || [],
          bonus: parsed.bonus || INITIAL_BONUS,
          programas_bonus: parsed.programas_bonus && parsed.programas_bonus.length > 0 ? parsed.programas_bonus : INITIAL_PROGRAMAS_BONUS,
          categorias_despesas: parsed.categorias_despesas || INITIAL_CATEGORIAS,
          despesas: parsed.despesas || INITIAL_DESPESAS,
          fluxo_caixa: parsed.fluxo_caixa || INITIAL_FLUXO,
          usuarios: parsed.usuarios && parsed.usuarios.length > 0 ? parsed.usuarios : INITIAL_USERS,
          logs_auditoria: parsed.logs_auditoria || INITIAL_AUDIT_LOGS,
          modelos_mensagem: parsed.modelos_mensagem && parsed.modelos_mensagem.length > 0 ? parsed.modelos_mensagem : INITIAL_MODELOS_MENSAGEM,
        };
      }
    } catch (e) {
      console.warn('Erro ao carregar banco do storage, usando inicial:', e);
    }

    return {
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
      if (mode === 'delete' && matchKey && matchVal) {
        const { error } = await supabase.from(table).delete().eq(matchKey, matchVal);
        if (error) console.error(`[Supabase delete ${table}]`, error.message);
      } else if (mode === 'insert') {
        const { error } = await supabase.from(table).insert(payload);
        if (error) console.error(`[Supabase insert ${table}]`, error.message);
      } else if (mode === 'update' && matchKey && matchVal) {
        const { error } = await supabase.from(table).update(payload).eq(matchKey, matchVal);
        if (error) console.error(`[Supabase update ${table}]`, error.message);
      } else {
        const { error } = await supabase.from(table).upsert(payload);
        if (error) console.error(`[Supabase upsert ${table}]`, error.message);
      }
    } catch (err) {
      console.warn(`[Supabase sync error ${table}]`, err);
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
        const cloudIds = new Set(resClientes.data.map((c: any) => c.id));
        const localNew = this.db.clientes.filter(c => !cloudIds.has(c.id));
        if (localNew.length > 0) {
          for (const lc of localNew) {
            this.pushToSupabase('clientes', lc);
          }
        }
        this.db.clientes = [...resClientes.data, ...localNew];
        updated = true;
      }
      if (resCobrancas.data && resCobrancas.data.length > 0) {
        const cloudIds = new Set(resCobrancas.data.map((c: any) => c.id));
        const localNew = this.db.cobrancas.filter(c => !cloudIds.has(c.id));
        if (localNew.length > 0) {
          for (const lc of localNew) {
            this.pushToSupabase('cobrancas', lc);
          }
        }
        this.db.cobrancas = [...resCobrancas.data, ...localNew];
        updated = true;
      }
      if (resPagamentos.data && resPagamentos.data.length > 0) {
        const cloudIds = new Set(resPagamentos.data.map((p: any) => p.id));
        const localNew = this.db.pagamentos.filter(p => !cloudIds.has(p.id));
        if (localNew.length > 0) {
          for (const lp of localNew) {
            this.pushToSupabase('pagamentos', lp);
          }
        }
        this.db.pagamentos = [...resPagamentos.data, ...localNew];
        updated = true;
      }
      if (resDespesas.data && resDespesas.data.length > 0) {
        const cloudIds = new Set(resDespesas.data.map((d: any) => d.id));
        const localNew = this.db.despesas.filter(d => !cloudIds.has(d.id));
        if (localNew.length > 0) {
          for (const ld of localNew) {
            this.pushToSupabase('despesas', ld);
          }
        }
        this.db.despesas = [...resDespesas.data, ...localNew];
        updated = true;
      }
      if (resCategorias.data && resCategorias.data.length > 0) {
        this.db.categorias_despesas = resCategorias.data;
        updated = true;
      }
      if (resFluxo.data && resFluxo.data.length > 0) {
        const cloudIds = new Set(resFluxo.data.map((f: any) => f.id));
        const localNew = this.db.fluxo_caixa.filter(f => !cloudIds.has(f.id));
        if (localNew.length > 0) {
          for (const lf of localNew) {
            this.pushToSupabase('fluxo_caixa', lf);
          }
        }
        this.db.fluxo_caixa = [...resFluxo.data, ...localNew];
        updated = true;
      }
      if (resBonus.data && resBonus.data.length > 0) {
        this.db.bonus = resBonus.data;
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

    if (!isEdit) {
      // Gera a cobrança do mês corrente para o novo cliente (após cliente já ter sido persistido)
      const today = new Date();
      const mes = today.getMonth() + 1;
      const ano = today.getFullYear();
      this.gerarCobrancaParaCliente(cliente, mes, ano);
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
    const idx = this.db.despesas.findIndex(d => d.id === despesaId);
    if (idx !== -1) {
      this.db.despesas.splice(idx, 1);
    }
    // Remove do fluxo de caixa se houver saída correspondente
    const flxId = `flx-desp-${despesaId}`;
    this.db.fluxo_caixa = this.db.fluxo_caixa.filter(f => f.id !== flxId && f.origem_id !== despesaId && f.id !== despesaId);

    this.persist();
    this.pushToSupabase('despesas', { id: despesaId }, 'delete', 'id', despesaId);
    this.pushToSupabase('fluxo_caixa', { id: flxId }, 'delete', 'id', flxId);
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
