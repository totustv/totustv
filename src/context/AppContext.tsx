import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Cliente,
  Cobranca,
  Despesa,
  CategoriaDespesa,
  FluxoCaixaItem,
  BonusBeneficio,
  BonusTipo,
  BonusStatus,
  ProgramaBonus,
  PromessaPagamento,
  ConfiguracoesApp,
  FormaPagamento,
  UserProfile,
  AuditLog,
  ModeloMensagem,
} from '../types';
import { totusDB } from '../lib/db';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { isToday, isTomorrow, isPastDate } from '../lib/utils';
import { useAuth } from './AuthContext';

interface AppContextType {
  // Dados reativos com isolamento seguro por perfil
  clientes: Cliente[];
  cobrancas: Cobranca[];
  despesas: Despesa[];
  categoriasDespesas: CategoriaDespesa[];
  fluxoCaixa: FluxoCaixaItem[];
  bonus: BonusBeneficio[];
  programasBonus: ProgramaBonus[];
  promessas: PromessaPagamento[];
  config: ConfiguracoesApp;
  usuarios: UserProfile[];
  logsAuditoria: AuditLog[];
  modelosMensagem: ModeloMensagem[];
  
  // Ações do Banco
  salvarCliente: (data: any) => Cliente;
  toggleStatusCliente: (id: string) => void;
  excluirCliente: (id: string) => void;
  transferirCliente: (clienteId: string, novoResellerId: string | undefined, motivo?: string) => void;
  salvarUsuario: (data: any) => UserProfile;
  toggleStatusUsuario: (id: string) => UserProfile;
  registrarPagamento: (params: { cobranca_id: string; valor_pago: number; data_pagamento: string; forma_pagamento: FormaPagamento; observacao?: string }) => void;
  alterarVencimentoCobranca: (cobrancaId: string, novaData: string, motivo?: string) => void;
  cancelarOuDispensarCobranca: (cobrancaId: string, tipo: 'cancelado' | 'dispensado_bonus', motivo: string) => void;
  registrarPromessa: (params: { cliente_id: string; cobranca_id?: string; data_combinada: string; valor_prometido: number; observacao?: string }) => void;
  atualizarSituacaoPromessa: (promessaId: string, situacao: 'cumprida' | 'nao_cumprida') => void;
  registrarContato: (params: { cliente_id: string; cobranca_id?: string; tipo_mensagem: string; mensagem_texto: string; status_envio: 'preparada' | 'enviada_manual' | 'enviada_auto' }) => void;
  concederBonusManual: (params: { cliente_id: string; motivo: string; tipo?: 'manual' | 'indicacao' | 'aniversario' }) => void;
  salvarBonus: (data: Partial<BonusBeneficio> & { cliente_id: string; motivo_justificativa?: string; tipo: BonusTipo; status?: BonusStatus }) => BonusBeneficio;
  deletarBonus: (id: string) => void;
  salvarProgramaBonus: (data: Partial<ProgramaBonus> & { titulo: string; descricao: string }) => ProgramaBonus;
  deletarProgramaBonus: (id: string) => void;
  aplicarBonusNaCobranca: (bonusId: string, cobrancaId: string) => void;
  cancelarBonus: (bonusId: string, motivo: string) => void;
  salvarDespesa: (params: any) => void;
  marcarDespesaComoPaga: (id: string, params: { data_pagamento: string; forma_pagamento: FormaPagamento }) => void;
  cancelarDespesa: (id: string, motivo: string) => void;
  excluirDespesa: (id: string) => void;
  excluirItemFluxoCaixa: (id: string) => void;
  salvarCategoriaDespesa: (nome: string, cor?: string, icone?: string) => void;
  salvarConfig: (cfg: Partial<ConfiguracoesApp>) => void;
  salvarModeloMensagem: (data: Partial<ModeloMensagem> & { titulo: string; texto: string }) => ModeloMensagem;
  deletarModeloMensagem: (id: string) => void;
  resetarModelosPadrao: () => void;
  resetarBanco: () => void;
  exportarBackup: () => string;
  importarBackup: (json: string) => boolean;

  // Indicadores computados do Dashboard & Financeiro
  kpis: {
    totalClientes: number;
    clientesAtivos: number;
    clientesInativos: number;
    clientesNovosMes: number;
    vencemHoje: number;
    vencemAmanha: number;
    cobrancasPendentes: number;
    prometeramPagar: number;
    recebidosMes: number;
    receitaPrevistaMes: number;
    despesasPagasMes: number;
    despesasPendentesMes: number;
    lucroLiquidoMes: number;
    lucroPrevistoMes: number;
    clientesComBonusMes: number;
    receitaDispensadaBonusMes: number;
    recebidosMesAnterior: number;
    variacaoReceitaPerc: number;
    ticketMedio: number;
    mrrEstimado: number;
    aniversariantesMes: Cliente[];
  };
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [, setTick] = useState(0);
  const { currentUser, isAdmin, isReseller } = useAuth();

  useEffect(() => {
    // Sincroniza dados com o banco Supabase na inicialização
    if (isSupabaseConfigured) {
      totusDB.syncFromSupabase();
    }

    // Subscreve a qualquer modificação no banco para re-renderizar instantaneamente
    const unsubscribe = totusDB.subscribe(() => {
      setTick(t => t + 1);
    });
    return unsubscribe;
  }, []);

  // Escuta alterações em tempo real via Supabase Realtime Channels
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const channel = client
        .channel('totus-realtime-sync')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          totusDB.syncFromSupabase();
        })
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }
  }, []);

  const rawData = totusDB.getRawData();

  // ISOLAMENTO DE DADOS REATIVO POR PERFIL
  // Administrador: visualiza toda a operação e todos os revendedores
  // Revendedor: visualiza única e exclusivamente os clientes de sua própria carteira
  const clientes = useMemo(() => {
    if (isAdmin) {
      return rawData.clientes;
    }
    if (isReseller && currentUser) {
      return rawData.clientes.filter(c => c.reseller_id === currentUser.id);
    }
    return [];
  }, [rawData.clientes, isAdmin, isReseller, currentUser]);

  const clienteIdsPermitidos = useMemo(() => {
    return new Set(clientes.map(c => c.id));
  }, [clientes]);

  const cobrancas = useMemo(() => {
    if (isAdmin) {
      return rawData.cobrancas;
    }
    return rawData.cobrancas.filter(c => clienteIdsPermitidos.has(c.cliente_id));
  }, [rawData.cobrancas, clienteIdsPermitidos, isAdmin]);

  const cobrancaIdsPermitidos = useMemo(() => {
    return new Set(cobrancas.map(c => c.id));
  }, [cobrancas]);

  // Despesas administrativas e Livro Caixa Geral: Apenas Administrador
  const despesas = useMemo(() => {
    if (isAdmin) return rawData.despesas;
    return [];
  }, [rawData.despesas, isAdmin]);

  const categoriasDespesas = useMemo(() => {
    if (isAdmin) return rawData.categorias_despesas;
    return [];
  }, [rawData.categorias_despesas, isAdmin]);

  const fluxoCaixa = useMemo(() => {
    if (isAdmin) return rawData.fluxo_caixa;
    return [];
  }, [rawData.fluxo_caixa, isAdmin]);

  const bonus = useMemo(() => {
    if (isAdmin) return rawData.bonus;
    return rawData.bonus.filter(b => clienteIdsPermitidos.has(b.cliente_id));
  }, [rawData.bonus, clienteIdsPermitidos, isAdmin]);

  const promessas = useMemo(() => {
    if (isAdmin) return rawData.promessas;
    return rawData.promessas.filter(p => clienteIdsPermitidos.has(p.cliente_id));
  }, [rawData.promessas, clienteIdsPermitidos, isAdmin]);

  const programasBonus = useMemo(() => {
    return rawData.programas_bonus && rawData.programas_bonus.length > 0
      ? rawData.programas_bonus
      : totusDB.getProgramasBonus();
  }, [rawData.programas_bonus]);

  const config = rawData.config;
  const usuarios = rawData.usuarios || [];
  const logsAuditoria = isAdmin ? (rawData.logs_auditoria || []) : [];
  const modelosMensagem = useMemo(() => {
    return totusDB.getModelosMensagem();
  }, [rawData.modelos_mensagem, rawData.config]);

  // Cálculos consolidados e reais
  const kpis = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // 1. Clientes
    const totalClientes = clientes.length;
    const clientesAtivos = clientes.filter(c => c.status === 'ativo').length;
    const clientesInativos = clientes.filter(c => c.status === 'inativo').length;
    
    const clientesNovosMes = clientes.filter(c => {
      const d = new Date(c.data_cadastro);
      return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
    }).length;

    // 2. Cobranças do Mês Atual
    const cobrancasDoMes = cobrancas.filter(
      c => c.competencia_mes === currentMonth && c.competencia_ano === currentYear
    );

    let vencemHoje = 0;
    let vencemAmanha = 0;
    let cobrancasPendentes = 0;
    let prometeramPagar = 0;
    let receitaPrevistaMes = 0;
    let clientesComBonusMes = 0;
    let receitaDispensadaBonusMes = 0;

    cobrancasDoMes.forEach(c => {
      // Prevista é a soma de tudo que estava orçado para este ciclo (exceto cancelados)
      if (c.status !== 'cancelado') {
        receitaPrevistaMes += c.valor;
      }

      if (c.status === 'pendente' || c.status === 'avisado' || c.status === 'atrasado') {
        cobrancasPendentes += 1;
      }

      if (c.status === 'prometeu_pagar') {
        prometeramPagar += 1;
      }

      if (c.status === 'dispensado_bonus' || c.status === 'dispensado_aniversario') {
        clientesComBonusMes += 1;
        receitaDispensadaBonusMes += c.valor;
      }

      // Vencimentos de hoje e amanhã (apenas em aberto)
      if (c.status !== 'pago' && c.status !== 'cancelado' && c.status !== 'dispensado_bonus' && c.status !== 'dispensado_aniversario') {
        if (isToday(c.data_vencimento)) vencemHoje += 1;
        if (isTomorrow(c.data_vencimento)) vencemAmanha += 1;
      }
    });

    // 3. Financeiro Realizado (LIVRO CAIXA REALIZADO)
    // Entradas no mês atual
    const entradasMes = fluxoCaixa.filter(f => {
      if (f.tipo !== 'entrada') return false;
      const d = new Date(f.data_movimento);
      return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
    });
    const recebidosMes = entradasMes.reduce((acc, cur) => acc + cur.valor, 0);

    // Entradas no mês anterior (para variação)
    const entradasMesAnterior = fluxoCaixa.filter(f => {
      if (f.tipo !== 'entrada') return false;
      const d = new Date(f.data_movimento);
      return d.getFullYear() === prevYear && d.getMonth() + 1 === prevMonth;
    });
    const recebidosMesAnterior = entradasMesAnterior.reduce((acc, cur) => acc + cur.valor, 0);

    const variacaoReceitaPerc = recebidosMesAnterior > 0
      ? ((recebidosMes - recebidosMesAnterior) / recebidosMesAnterior) * 100
      : (recebidosMes > 0 ? 100 : 0);

    // Despesas do mês atual
    let despesasPagasMes = 0;
    let despesasPendentesMes = 0;

    despesas.forEach(d => {
      const compDate = new Date(d.data_competencia);
      const isThisMonth = compDate.getFullYear() === currentYear && compDate.getMonth() + 1 === currentMonth;

      if (isThisMonth) {
        if (d.status === 'paga') {
          despesasPagasMes += d.valor;
        } else if (d.status === 'pendente') {
          despesasPendentesMes += d.valor;
        }
      }
    });

    // Lucro Líquido Realizado = Receitas Efetivamente Recebidas - Despesas Efetivamente Pagas
    const lucroLiquidoMes = recebidosMes - despesasPagasMes;

    // Lucro Previsto = Receita Prevista (sem bônus) - Total Despesas Previstas (pagas + pendentes)
    const lucroPrevistoMes = (receitaPrevistaMes - receitaDispensadaBonusMes) - (despesasPagasMes + despesasPendentesMes);

    // Ticket Médio dos Clientes Ativos
    const ticketMedio = clientesAtivos > 0
      ? clientes.filter(c => c.status === 'ativo').reduce((acc, cur) => acc + cur.valor_mensalidade, 0) / clientesAtivos
      : 0;

    // MRR Estimado (Receita Recorrente Mensal Estimada de Clientes Ativos)
    const mrrEstimado = clientes
      .filter(c => c.status === 'ativo')
      .reduce((acc, cur) => acc + cur.valor_mensalidade, 0);

    // Aniversariantes do Mês
    const aniversariantesMes = clientes.filter(c => {
      if (!c.data_nascimento) return false;
      const m = parseInt(c.data_nascimento.split('-')[1], 10);
      return m === currentMonth;
    });

    return {
      totalClientes,
      clientesAtivos,
      clientesInativos,
      clientesNovosMes,
      vencemHoje,
      vencemAmanha,
      cobrancasPendentes,
      prometeramPagar,
      recebidosMes,
      receitaPrevistaMes,
      despesasPagasMes,
      despesasPendentesMes,
      lucroLiquidoMes,
      lucroPrevistoMes,
      clientesComBonusMes,
      receitaDispensadaBonusMes,
      recebidosMesAnterior,
      variacaoReceitaPerc,
      ticketMedio,
      mrrEstimado,
      aniversariantesMes,
    };
  }, [clientes, cobrancas, despesas, fluxoCaixa]);

  return (
    <AppContext.Provider
      value={{
        clientes,
        cobrancas,
        despesas,
        categoriasDespesas,
        fluxoCaixa,
        bonus,
        programasBonus,
        promessas,
        config,
        usuarios,
        logsAuditoria,
        salvarCliente: (d) => {
          // Se for revendedor, vincula compulsoriamente à sua própria carteira
          const clienteParaSalvar = {
            ...d,
            reseller_id: isReseller && currentUser ? currentUser.id : d.reseller_id,
          };
          const saved = totusDB.saveCliente(clienteParaSalvar);
          totusDB.registrarLogAuditoria({
            user_id: currentUser?.id || 'anon',
            user_nome: currentUser?.nome || 'Usuário',
            user_email: currentUser?.email || '',
            acao: d.id ? 'editar_cliente' : 'cadastrar_cliente',
            tabela: 'clientes',
            registro_id: saved.id,
            detalhes: `${d.id ? 'Atualização' : 'Cadastro'} do cliente ${saved.nome}`,
          });
          return saved;
        },
        toggleStatusCliente: (id) => {
          if (!clienteIdsPermitidos.has(id) && !isAdmin) {
            throw new Error('Permissão negada: este cliente não pertence à sua carteira');
          }
          const cli = totusDB.getClienteById(id);
          const novoStatus = totusDB.toggleClienteStatus(id);
          totusDB.registrarLogAuditoria({
            user_id: currentUser?.id || 'anon',
            user_nome: currentUser?.nome || 'Usuário',
            user_email: currentUser?.email || '',
            acao: novoStatus === 'ativo' ? 'ativar_cliente' : 'inativar_cliente',
            tabela: 'clientes',
            registro_id: id,
            detalhes: `Status do cliente ${cli?.nome || id} alterado para ${novoStatus.toUpperCase()}`,
          });
        },
        excluirCliente: (id) => {
          if (!clienteIdsPermitidos.has(id) && !isAdmin) {
            throw new Error('Permissão negada: este cliente não pertence à sua carteira');
          }
          const cli = totusDB.getClienteById(id);
          totusDB.excluirCliente(id);
          totusDB.registrarLogAuditoria({
            user_id: currentUser?.id || 'anon',
            user_nome: currentUser?.nome || 'Usuário',
            user_email: currentUser?.email || '',
            acao: 'excluir_cliente',
            tabela: 'clientes',
            registro_id: id,
            detalhes: `Exclusão permanente do cliente ${cli?.nome || id} (${cli?.whatsapp || ''})`,
          });
        },
        transferirCliente: (clienteId, novoResellerId, motivo) => {
          if (!isAdmin) {
            throw new Error('Apenas administradores podem transferir clientes entre carteiras');
          }
          totusDB.transferirClienteResponsavel(clienteId, novoResellerId, motivo);
        },
        salvarUsuario: (u) => {
          if (!isAdmin) {
            throw new Error('Apenas administradores podem cadastrar ou editar usuários');
          }
          return totusDB.salvarUsuario(u);
        },
        toggleStatusUsuario: (uId) => {
          if (!isAdmin) {
            throw new Error('Apenas administradores podem suspender ou ativar usuários');
          }
          return totusDB.toggleStatusUsuario(uId);
        },
        registrarPagamento: (p) => {
          if (!cobrancaIdsPermitidos.has(p.cobranca_id) && !isAdmin) {
            throw new Error('Permissão negada para registrar pagamento desta cobrança');
          }
          const pag = totusDB.registrarPagamento(p);
          totusDB.registrarLogAuditoria({
            user_id: currentUser?.id || 'anon',
            user_nome: currentUser?.nome || 'Usuário',
            user_email: currentUser?.email || '',
            acao: 'registrar_pagamento',
            tabela: 'pagamentos',
            registro_id: pag.id,
            detalhes: `Pagamento registrado: R$ ${pag.valor_pago} (${pag.forma_pagamento.toUpperCase()})`,
          });
        },
        alterarVencimentoCobranca: (id, nova, mot) => {
          if (!cobrancaIdsPermitidos.has(id) && !isAdmin) {
            throw new Error('Permissão negada para alterar vencimento desta cobrança');
          }
          const cob = totusDB.getCobrancas().find(c => c.id === id);
          const cli = cob ? totusDB.getClienteById(cob.cliente_id) : null;
          totusDB.alterarVencimentoCobranca(id, nova, mot);
          totusDB.registrarLogAuditoria({
            user_id: currentUser?.id || 'anon',
            user_nome: currentUser?.nome || 'Usuário',
            user_email: currentUser?.email || '',
            acao: 'alterar_vencimento',
            tabela: 'cobrancas',
            registro_id: id,
            detalhes: `Vencimento de ${cli?.nome || 'Cliente'} alterado para ${nova}. Motivo: ${mot || 'Ajuste'}`,
          });
        },
        cancelarOuDispensarCobranca: (id, t, m) => {
          if (!cobrancaIdsPermitidos.has(id) && !isAdmin) {
            throw new Error('Permissão negada para esta cobrança');
          }
          const cob = totusDB.getCobrancas().find(c => c.id === id);
          const cli = cob ? totusDB.getClienteById(cob.cliente_id) : null;
          totusDB.cancelarOuDispensarCobranca(id, t, m);
          totusDB.registrarLogAuditoria({
            user_id: currentUser?.id || 'anon',
            user_nome: currentUser?.nome || 'Usuário',
            user_email: currentUser?.email || '',
            acao: `dispensar_${t}`,
            tabela: 'cobrancas',
            registro_id: id,
            detalhes: `Cobrança de ${cli?.nome || 'Cliente'} atualizada para ${t}. Motivo: ${m || '-'}`,
          });
        },
        registrarPromessa: (p) => {
          if (!clienteIdsPermitidos.has(p.cliente_id) && !isAdmin) {
            throw new Error('Permissão negada para registrar promessa para este cliente');
          }
          const prom = totusDB.registrarPromessa(p);
          const cli = totusDB.getClienteById(p.cliente_id);
          totusDB.registrarLogAuditoria({
            user_id: currentUser?.id || 'anon',
            user_nome: currentUser?.nome || 'Usuário',
            user_email: currentUser?.email || '',
            acao: 'registrar_promessa',
            tabela: 'promessas',
            registro_id: prom.id,
            detalhes: `Promessa de pagamento para ${cli?.nome || 'Cliente'} para a data ${p.data_combinada}`,
          });
        },
        atualizarSituacaoPromessa: (id, s) => {
          totusDB.atualizarSituacaoPromessa(id, s);
        },
        registrarContato: (p) => {
          totusDB.registrarContato(p);
        },
        concederBonusManual: (p) => {
          if (!isAdmin) {
            throw new Error('Apenas administradores podem conceder bônus manuais');
          }
          totusDB.concederBonusManual(p);
        },
        salvarBonus: (data) => {
          const b = totusDB.saveBonus(data);
          const cli = totusDB.getClienteById(data.cliente_id);
          totusDB.registrarLogAuditoria({
            user_id: currentUser?.id || 'anon',
            user_nome: currentUser?.nome || 'Usuário',
            user_email: currentUser?.email || '',
            acao: data.id ? 'editar_bonus' : 'conceder_bonus',
            tabela: 'bonus',
            registro_id: b.id,
            detalhes: `${data.id ? 'Atualização' : 'Concessão'} de bônus para ${cli?.nome || 'Cliente'}: ${data.motivo_justificativa || data.tipo}`,
          });
          return b;
        },
        deletarBonus: (id) => {
          totusDB.deleteBonus(id);
          totusDB.registrarLogAuditoria({
            user_id: currentUser?.id || 'anon',
            user_nome: currentUser?.nome || 'Usuário',
            user_email: currentUser?.email || '',
            acao: 'excluir_bonus',
            tabela: 'bonus',
            registro_id: id,
            detalhes: `Exclusão de registro de bônus ID: ${id}`,
          });
        },
        salvarProgramaBonus: (p) => {
          return totusDB.saveProgramaBonus(p);
        },
        deletarProgramaBonus: (id) => {
          totusDB.deleteProgramaBonus(id);
        },
        aplicarBonusNaCobranca: (bId, cId) => totusDB.aplicarBonusNaCobranca(bId, cId),
        cancelarBonus: (id, m) => {
          if (!isAdmin) {
            throw new Error('Apenas administradores podem cancelar bônus');
          }
          totusDB.cancelarBonus(id, m);
        },
        salvarDespesa: (p) => {
          if (!isAdmin) {
            throw new Error('Apenas administradores podem gerenciar despesas');
          }
          const d = totusDB.saveDespesa(p);
          totusDB.registrarLogAuditoria({
            user_id: currentUser?.id || 'anon',
            user_nome: currentUser?.nome || 'Usuário',
            user_email: currentUser?.email || '',
            acao: p.id ? 'editar_despesa' : 'cadastrar_despesa',
            tabela: 'despesas',
            registro_id: d.id,
            detalhes: `${p.id ? 'Atualização' : 'Cadastro'} da despesa: ${d.descricao} (R$ ${d.valor})`,
          });
        },
        marcarDespesaComoPaga: (id, p) => {
          if (!isAdmin) {
            throw new Error('Apenas administradores podem liquidar despesas');
          }
          totusDB.marcarDespesaComoPaga(id, p);
          totusDB.registrarLogAuditoria({
            user_id: currentUser?.id || 'anon',
            user_nome: currentUser?.nome || 'Usuário',
            user_email: currentUser?.email || '',
            acao: 'liquidar_despesa',
            tabela: 'despesas',
            registro_id: id,
            detalhes: `Despesa marcada como paga via ${p.forma_pagamento}`,
          });
        },
        cancelarDespesa: (id, m) => {
          if (!isAdmin) {
            throw new Error('Apenas administradores podem cancelar despesas');
          }
          totusDB.cancelarDespesa(id, m);
          totusDB.registrarLogAuditoria({
            user_id: currentUser?.id || 'anon',
            user_nome: currentUser?.nome || 'Usuário',
            user_email: currentUser?.email || '',
            acao: 'cancelar_despesa',
            tabela: 'despesas',
            registro_id: id,
            detalhes: `Cancelamento de despesa. Motivo: ${m || '-'}`,
          });
        },
        excluirDespesa: (id) => {
          if (!isAdmin) {
            throw new Error('Apenas administradores podem excluir despesas');
          }
          const desp = totusDB.getDespesas().find(d => d.id === id);
          totusDB.excluirDespesa(id);
          totusDB.registrarLogAuditoria({
            user_id: currentUser?.id || 'anon',
            user_nome: currentUser?.nome || 'Usuário',
            user_email: currentUser?.email || '',
            acao: 'excluir_despesa',
            tabela: 'despesas',
            registro_id: id,
            detalhes: `Exclusão permanente de despesa: ${desp?.descricao || id} (R$ ${desp?.valor || 0})`,
          });
        },
        excluirItemFluxoCaixa: (id) => {
          if (!isAdmin) {
            throw new Error('Apenas administradores podem excluir itens do fluxo de caixa');
          }
          totusDB.excluirItemFluxoCaixa(id);
          totusDB.registrarLogAuditoria({
            user_id: currentUser?.id || 'anon',
            user_nome: currentUser?.nome || 'Usuário',
            user_email: currentUser?.email || '',
            acao: 'excluir_fluxo_caixa',
            tabela: 'fluxo_caixa',
            registro_id: id,
            detalhes: `Exclusão permanente de lançamento do Livro Caixa: ID ${id}`,
          });
        },
        salvarCategoriaDespesa: (n, c, i) => {
          if (!isAdmin) {
            throw new Error('Apenas administradores podem gerenciar categorias de despesas');
          }
          totusDB.saveCategoriaDespesa(n, c, i);
        },
        salvarConfig: (c) => {
          if (!isAdmin) {
            throw new Error('Apenas administradores podem alterar configurações gerais');
          }
          totusDB.saveConfig(c);
          totusDB.registrarLogAuditoria({
            user_id: currentUser?.id || 'anon',
            user_nome: currentUser?.nome || 'Usuário',
            user_email: currentUser?.email || '',
            acao: 'alterar_configuracoes',
            tabela: 'config',
            detalhes: 'Configurações globais do sistema atualizadas',
          });
        },
        modelosMensagem,
        salvarModeloMensagem: (m) => totusDB.saveModeloMensagem(m),
        deletarModeloMensagem: (id) => totusDB.deleteModeloMensagem(id),
        resetarModelosPadrao: () => totusDB.resetarModelosPadrao(),
        resetarBanco: () => {
          if (!isAdmin) {
            throw new Error('Apenas administradores podem resetar o banco de dados');
          }
          totusDB.resetToFactory();
        },
        exportarBackup: () => {
          if (!isAdmin) {
            throw new Error('Apenas administradores podem exportar backup integral');
          }
          return totusDB.exportBackup();
        },
        importarBackup: (j) => {
          if (!isAdmin) {
            throw new Error('Apenas administradores podem importar backup');
          }
          return totusDB.importBackup(j);
        },
        kpis,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useTotus = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useTotus deve ser usado dentro de AppProvider');
  return context;
};
