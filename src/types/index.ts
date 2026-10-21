// ==============================================================================
// TOTUS TV - TYPES & INTERFACES (Full Domain Model)
// ==============================================================================

export type ClienteStatus = 'ativo' | 'inativo';

export type CobrancaStatus =
  | 'pendente'
  | 'avisado'
  | 'prometeu_pagar'
  | 'pago'
  | 'atrasado'
  | 'cancelado'
  | 'dispensado_bonus'
  | 'dispensado_aniversario';

export type FormaPagamento = 'pix' | 'dinheiro' | 'transferencia' | 'cartao' | 'outro';

export type PromessaSituacao = 'aguardando' | 'cumprida' | 'nao_cumprida';

export type BonusTipo = 'indicacao' | 'aniversario' | 'manual' | (string & {});

export type BonusStatus = 'pendente' | 'disponivel' | 'utilizado' | 'cancelado';

export type DespesaStatus = 'pendente' | 'paga' | 'cancelada';

export type FluxoTipo = 'entrada' | 'saida';

export type UserRole = 'admin' | 'reseller';
export type UserStatus = 'ativo' | 'suspenso' | 'inativo';

export interface UserProfile {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  ultimo_acesso?: string;
  telefone?: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_nome: string;
  user_email: string;
  acao: string; // 'login', 'logout', 'criar_cliente', 'editar_cliente', 'transferir_cliente', etc.
  tabela: string;
  registro_id?: string;
  detalhes?: string;
  dados_anteriores?: any;
  dados_novos?: any;
  created_at: string;
}

export interface Cliente {
  id: string;
  nome: string;
  whatsapp: string;
  valor_mensalidade: number;
  dia_vencimento: number; // 10, 20, 30 etc.
  data_cadastro: string;
  data_inicio_servico: string;
  data_nascimento?: string;
  pais?: string;
  estado?: string;
  cidade?: string;
  status: ClienteStatus;
  reseller_id?: string; // id do revendedor responsável (ou vazio/null para admin)
  indicado_por?: string; // id do cliente padrinho
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface Cobranca {
  id: string;
  cliente_id: string;
  competencia_mes: number; // 1-12
  competencia_ano: number; // ex: 2026
  valor: number;
  data_vencimento: string; // YYYY-MM-DD
  status: CobrancaStatus;
  motivo_cancelamento?: string;
  bonus_aplicado_id?: string;
  created_at: string;
  updated_at: string;
}

export interface HistoricoVencimento {
  id: string;
  cliente_id: string;
  cobranca_id?: string;
  dia_anterior?: number;
  dia_novo?: number;
  data_vencimento_anterior?: string;
  data_vencimento_nova?: string;
  motivo?: string;
  alterado_em: string;
}

export interface Pagamento {
  id: string;
  cobranca_id: string;
  cliente_id: string;
  valor_pago: number;
  data_pagamento: string;
  forma_pagamento: FormaPagamento;
  observacao?: string;
  comprovante_ref?: string;
  created_at: string;
}

export interface PromessaPagamento {
  id: string;
  cliente_id: string;
  cobranca_id?: string;
  data_promessa: string; // YYYY-MM-DD
  data_combinada: string; // YYYY-MM-DD
  valor_prometido: number;
  situacao: PromessaSituacao;
  observacao?: string;
  created_at: string;
  updated_at: string;
}

export interface ContatoHistorico {
  id: string;
  cliente_id: string;
  cobranca_id?: string;
  tipo_mensagem: string;
  mensagem_texto: string;
  status_envio: 'preparada' | 'enviada_manual' | 'enviada_auto';
  enviado_em: string;
}

export interface BonusBeneficio {
  id: string;
  cliente_id: string; // Quem ganha o benefício
  tipo: BonusTipo;
  status: BonusStatus;
  indicado_id?: string; // Quem foi indicado
  competencia_uso_mes?: number;
  competencia_uso_ano?: number;
  cobranca_dispensada_id?: string;
  motivo_justificativa?: string;
  data_concessao: string;
  data_utilizacao?: string;
}

export interface ProgramaBonus {
  id: string;
  titulo: string;
  descricao: string;
  cor?: string;
  icone?: string;
  ativo?: boolean;
  created_at?: string;
}

export interface CategoriaDespesa {
  id: string;
  nome: string;
  cor: string;
  icone: string;
}

export interface Despesa {
  id: string;
  descricao: string;
  categoria_id?: string;
  categoria_nome: string;
  valor: number;
  data_competencia: string;
  data_vencimento: string;
  data_pagamento?: string;
  status: DespesaStatus;
  forma_pagamento?: FormaPagamento;
  recorrente: boolean;
  periodicidade?: string;
  observacoes?: string;
  motivo_cancelamento?: string;
  created_at: string;
  updated_at: string;
}

export interface FluxoCaixaItem {
  id: string;
  data_movimento: string;
  tipo: FluxoTipo;
  valor: number;
  descricao: string;
  origem: 'pagamento_cliente' | 'despesa_paga' | 'ajuste_manual';
  origem_id?: string;
  cliente_id?: string;
  forma_pagamento: FormaPagamento;
  created_at: string;
}

export interface ConfiguracoesApp {
  id: string;
  nome_negocio: string;
  moeda: string;
  fuso_horario: string;
  dias_vencimento_padrao: number[];
  valor_mensalidade_padrao: number;
  telefone_suporte: string;
  chave_pix: string;
  msg_lembrete_amanha: string;
  msg_lembrete_hoje: string;
  msg_cobranca_pendente: string;
  msg_promessa_confirmar: string;
  msg_pagamento_confirmado: string;
  permite_duplo_bonus: boolean;
}

export interface ModeloMensagem {
  id: string;
  titulo: string;
  texto: string;
  categoria: 'lembrete' | 'cobranca' | 'promessa' | 'recibo' | 'geral';
  dia_vencimento_alvo?: number; // ex: 10, 20, 30 ou undefined para qualquer dia
  padrao?: boolean;
  created_at?: string;
  updated_at?: string;
}
