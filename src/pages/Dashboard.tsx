import React, { useState, useMemo } from 'react';
import {
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  Gift,
  Calendar,
  MessageCircle,
  CheckCircle2,
  ChevronRight,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useTotus } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Cliente, Cobranca } from '../types';
import { formatCurrency, formatDate, cleanWhatsAppNumber, isToday, isTomorrow, isPastDate, formatStatusBadge } from '../lib/utils';
import confetti from 'canvas-confetti';

interface DashboardProps {
  onNavigate: (page: string) => void;
  onOpenPagamentoModal: (cobrancaId: string) => void;
  onOpenWhatsAppModal: (cliente: any, cobranca?: any, tipoMsg?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenPagamentoModal,
  onOpenWhatsAppModal,
}) => {
  const { kpis, cobrancas, clientes, fluxoCaixa, despesas, usuarios } = useTotus();
  const { currentUser, isAdmin, isReseller } = useAuth();
  const [periodoGrafico, setPeriodoGrafico] = useState<'mes_atual' | '6_meses' | '12_meses'>('6_meses');

  // Dados para Gráfico Financeiro Mensal (Realizado: Receitas vs Despesas vs Líquido)
  const chartDataFinanceiro = [
    {
      mes: 'Mai',
      receitas: 140,
      despesas: 70,
      liquido: 70,
    },
    {
      mes: 'Jun',
      receitas: 175,
      despesas: 70,
      liquido: 105,
    },
    {
      mes: 'Jul',
      receitas: 210,
      despesas: 70,
      liquido: 140,
    },
    {
      mes: 'Ago',
      receitas: 175,
      despesas: 70,
      liquido: 105,
    },
    {
      mes: 'Set',
      receitas: kpis.recebidosMesAnterior || 185,
      despesas: 70,
      liquido: (kpis.recebidosMesAnterior || 185) - 70,
    },
    {
      mes: 'Out (Atual)',
      receitas: kpis.recebidosMes,
      despesas: kpis.despesasPagasMes,
      liquido: kpis.lucroLiquidoMes,
    },
  ];

  // Dados para Gráfico de Distribuição de Cobranças
  const nowDashboard = new Date();
  const currentMonthDashboard = nowDashboard.getMonth() + 1;
  const currentYearDashboard = nowDashboard.getFullYear();
  const cobrancasDoMes = cobrancas.filter(c => c.competencia_mes === currentMonthDashboard && c.competencia_ano === currentYearDashboard);
  const statusCounts = {
    Pagas: cobrancasDoMes.filter(c => c.status === 'pago').length,
    Pendentes: cobrancasDoMes.filter(c => c.status === 'pendente' || c.status === 'avisado').length,
    Atrasadas: cobrancasDoMes.filter(c => c.status === 'atrasado').length,
    Promessas: cobrancasDoMes.filter(c => c.status === 'prometeu_pagar').length,
    Dispensadas: cobrancasDoMes.filter(c => c.status === 'dispensado_bonus' || c.status === 'dispensado_aniversario').length,
  };

  const chartDataStatus = [
    { name: 'Pagas', value: statusCounts.Pagas, color: '#10b981' },
    { name: 'Pendentes', value: statusCounts.Pendentes, color: '#f59e0b' },
    { name: 'Atrasadas', value: statusCounts.Atrasadas, color: '#f43f5e' },
    { name: 'Promessas', value: statusCounts.Promessas, color: '#8b5cf6' },
    { name: 'Bônus/Aniv', value: statusCounts.Dispensadas, color: '#ec4899' },
  ].filter(d => d.value > 0);

  // Ações Necessárias Hoje: Cobranças vencendo hoje, atrasadas, ou promessas vencendo (1 linha por cliente)
  const acoesNecessarias: { cob: Cobranca; cli: Cliente }[] = useMemo(() => {
    const raw: { cob: Cobranca; cli: Cliente }[] = [];
    for (const c of cobrancas) {
      if (c.status === 'pago' || c.status === 'cancelado' || c.status.startsWith('dispensado')) continue;
      if (!isToday(c.data_vencimento) && !isTomorrow(c.data_vencimento) && c.status !== 'atrasado' && c.status !== 'prometeu_pagar') continue;

      const cli = clientes.find(item => item.id === c.cliente_id);
      if (!cli) continue;

      // Respeitar rigorosamente a Data de Início do Serviço: faturas anteriores ao início não entram em ações
      if (cli.data_inicio_servico) {
        const [anoInicio, mesInicio] = cli.data_inicio_servico.split('-').map(Number);
        if (anoInicio && mesInicio) {
          if (c.competencia_ano < anoInicio || (c.competencia_ano === anoInicio && c.competencia_mes < mesInicio)) {
            continue;
          }
        }
      }

      raw.push({ cob: c, cli });
    }

    // DEDUPLICAÇÃO RÍGIDA POR CLIENTE: Um cliente nunca pode aparecer mais de uma vez na lista
    const clientMap = new Map<string, { cob: Cobranca; cli: Cliente }>();
    for (const item of raw) {
      if (!clientMap.has(item.cli.id)) {
        clientMap.set(item.cli.id, item);
      } else {
        // Priorizar a cobrança com vencimento mais urgente / antigo
        const current = clientMap.get(item.cli.id)!;
        if (item.cob.data_vencimento < current.cob.data_vencimento) {
          clientMap.set(item.cli.id, item);
        }
      }
    }
    return Array.from(clientMap.values());
  }, [cobrancas, clientes]);

  const dispararConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Grid de Cards de Indicadores (Fase 4 - Todos os Requisitos Solicitados) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Total e Ativos */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Users size={16} color="var(--accent-primary)" />
              Clientes Ativos
            </span>
          </div>
          <div className="card-value">{kpis.totalClientes}</div>
          <div className="card-subtext">
            <span>+{kpis.clientesNovosMes} novos neste mês</span>
            <span>•</span>
            <span style={{ color: 'var(--accent-rose)' }}>{kpis.clientesInativos} inativos</span>
          </div>
        </div>

        {/* Vencem Hoje */}
        <div
          className="card"
          style={{
            borderLeft: kpis.vencemHoje > 0 ? '4px solid var(--accent-rose)' : undefined,
          }}
        >
          <div className="card-header">
            <span className="card-title">
              <AlertCircle size={16} color="var(--accent-rose)" />
              Vencendo Hoje
            </span>
          </div>
          <div className="card-value" style={{ color: kpis.vencemHoje > 0 ? 'var(--accent-rose)' : undefined }}>
            {kpis.vencemHoje}
          </div>
          <div className="card-subtext">
            <span>{kpis.vencemAmanha} vencem amanhã</span>
          </div>
        </div>

        {/* Cobranças Pendentes & Promessas */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Clock size={16} color="var(--accent-amber)" />
              Cobranças Pendentes
            </span>
          </div>
          <div className="card-value">{kpis.cobrancasPendentes}</div>
          <div className="card-subtext">
            <span style={{ color: 'var(--accent-purple)' }}>{kpis.prometeramPagar} prometeram pagar</span>
          </div>
        </div>

        {/* Recebido no Mês (Realizado) */}
        <div className="card" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
          <div className="card-header">
            <span className="card-title">
              <DollarSign size={16} color="var(--accent-emerald)" />
              Recebido no Mês
            </span>
          </div>
          <div className="card-value" style={{ color: 'var(--accent-emerald)' }}>
            {formatCurrency(kpis.recebidosMes)}
          </div>
          <div className="card-subtext">
            <span>Previsto: {formatCurrency(kpis.receitaPrevistaMes)}</span>
          </div>
        </div>

        {/* Despesas Pagas (Exclusivo Admin) / Desempenho da Carteira (Revendedor) */}
        {isAdmin ? (
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <TrendingDown size={16} color="var(--accent-rose)" />
                Despesas Pagas
              </span>
            </div>
            <div className="card-value">{formatCurrency(kpis.despesasPagasMes)}</div>
            <div className="card-subtext">
              <span>+{formatCurrency(kpis.despesasPendentesMes)} pendentes</span>
            </div>
          </div>
        ) : (
          <div className="card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
            <div className="card-header">
              <span className="card-title">
                <CreditCard size={16} color="var(--accent-cyan)" />
                Receita Recorrente (MRR)
              </span>
            </div>
            <div className="card-value" style={{ color: 'var(--accent-cyan)' }}>
              {formatCurrency(kpis.mrrEstimado)}
            </div>
            <div className="card-subtext">
              <span>Ticket Médio: {formatCurrency(kpis.ticketMedio)}</span>
            </div>
          </div>
        )}

        {/* Lucro Líquido Realizado (Admin) / Taxa de Adimplência (Revendedor) */}
        {isAdmin ? (
          <div className="card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
            <div className="card-header">
              <span className="card-title">
                <TrendingUp size={16} color="var(--accent-primary)" />
                Lucro Líquido
              </span>
            </div>
            <div
              className="card-value"
              style={{
                color: kpis.lucroLiquidoMes >= 0 ? 'var(--accent-primary)' : 'var(--accent-rose)',
              }}
            >
              {formatCurrency(kpis.lucroLiquidoMes)}
            </div>
            <div className="card-subtext">
              <span>Receitas pagas − Despesas pagas</span>
            </div>
          </div>
        ) : (
          <div className="card" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
            <div className="card-header">
              <span className="card-title">
                <TrendingUp size={16} color="var(--accent-emerald)" />
                Taxa de Adimplência
              </span>
            </div>
            <div className="card-value" style={{ color: 'var(--accent-emerald)' }}>
              {kpis.totalClientes > 0
                ? `${Math.round(((kpis.totalClientes - kpis.cobrancasPendentes) / kpis.totalClientes) * 100)}%`
                : '100%'}
            </div>
            <div className="card-subtext">
              <span>Clientes em dia na sua base</span>
            </div>
          </div>
        )}

        {/* Bônus Concedidos */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Gift size={16} color="#ec4899" />
              Bônus no Mês
            </span>
          </div>
          <div className="card-value">{kpis.clientesComBonusMes}</div>
          <div className="card-subtext">
            <span>{formatCurrency(kpis.receitaDispensadaBonusMes)} em isenções</span>
          </div>
        </div>
      </div>

      {/* Seção Principal: Ações Necessárias & Gráficos Interativos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '20px' }}>
        {/* Gráfico Financeiro Mensal */}
        <div className="card" style={{ padding: '24px' }}>
          <div className="card-header">
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                Evolução Financeira Realizada
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                Comparativo mensal entre entradas recebidas, despesas pagas e saldo líquido
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {(['mes_atual', '6_meses'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriodoGrafico(p)}
                  className={`btn btn-sm ${periodoGrafico === p ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {p === 'mes_atual' ? 'Mês Atual' : 'Últimos 6 Meses'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: '300px', width: '100%', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataFinanceiro} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--text-subtle)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-subtle)" fontSize={12} tickLine={false} tickFormatter={v => `R$${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-md)',
                    fontSize: '0.85rem',
                  }}
                  formatter={(val: any) => [formatCurrency(Number(val)), '']}
                />
                <Legend />
                <Bar dataKey="receitas" name="Receitas Recebidas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas Pagas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="liquido" name="Resultado Líquido" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuição das Cobranças do Mês */}
        <div className="card" style={{ padding: '24px' }}>
          <div className="card-header">
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                Status das Cobranças
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                Distribuição das faturas de Outubro 2026
              </div>
            </div>
          </div>

          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDataStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartDataStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {chartDataStatus.map(st => (
              <div key={st.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: st.color }} />
                  {st.name}
                </span>
                <span style={{ fontWeight: 700 }}>{st.value} fatura(s)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AÇÕES NECESSÁRIAS HOJE (Clientes que precisam de contato imediato) */}
      <div className="card" style={{ padding: '24px' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-rose)',
              }}
            >
              <AlertCircle size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                Ações Necessárias (Contatos & Cobranças Prioritárias)
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                Faturas com vencimento hoje/amanhã, promessas em acompanhamento e pendências
              </div>
            </div>
          </div>

          <span className="badge badge-pendente">
            {acoesNecessarias.length} cliente(s) aguardando
          </span>
        </div>

        {acoesNecessarias.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-subtle)' }}>
            <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontWeight: 600 }}>Tudo em ordem! Nenhuma ação urgente necessária no momento.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>WhatsApp</th>
                  <th>Mensalidade</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações Rápidas</th>
                </tr>
              </thead>
              <tbody>
                {acoesNecessarias.map(({ cob, cli }) => {
                  if (!cli) return null;
                  const venceHoje = isToday(cob.data_vencimento);
                  const venceAmanha = isTomorrow(cob.data_vencimento);
                  const isPago = cob.status === 'pago' || cob.status.startsWith('dispensado');
                  const isAtrasado = cob.status === 'atrasado' || (isPastDate(cob.data_vencimento) && !isPago);
                  const rowClass = isPago ? 'row-pago' : (isAtrasado || cob.status === 'cancelado') ? 'row-vencido' : 'row-pendente';
                  const borderColor = isPago ? '#10b981' : (isAtrasado || cob.status === 'cancelado') ? '#ef4444' : '#f59e0b';

                  return (
                    <tr key={cob.id} className={rowClass}>
                      <td style={{ borderLeft: `4px solid ${borderColor}` }}>
                        <div style={{ fontWeight: 600 }}>{cli.nome}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                          Venc. preferencial: dia {cli.dia_vencimento}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}>
                          {cli.whatsapp}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700 }}>{formatCurrency(cob.valor)}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600 }}>{formatDate(cob.data_vencimento)}</span>
                          {venceHoje && <span className="badge badge-atrasado">Hoje!</span>}
                          {venceAmanha && <span className="badge badge-pendente">Amanhã</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${cob.status}`}>
                          {formatStatusBadge(cob.status)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {/* Abrir WhatsApp com mensagem recomendada */}
                          <button
                            onClick={() => {
                              const tipo = venceAmanha ? 'lembrete_amanha' : venceHoje ? 'lembrete_hoje' : 'cobranca_pendente';
                              onOpenWhatsAppModal(cli, cob, tipo);
                            }}
                            className="btn btn-whatsapp btn-sm"
                            title="Cobrar via WhatsApp"
                          >
                            <MessageCircle size={14} />
                            <span>WhatsApp</span>
                          </button>

                          {/* Confirmar Pagamento */}
                          <button
                            onClick={() => {
                              dispararConfetti();
                              onOpenPagamentoModal(cob.id);
                            }}
                            className="btn btn-success btn-sm"
                            title="Dar baixa no pagamento"
                          >
                            <CheckCircle2 size={14} />
                            <span>Dar Baixa</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
