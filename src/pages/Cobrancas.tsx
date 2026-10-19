import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  MessageCircle,
  DollarSign,
  Filter,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Gift,
} from 'lucide-react';
import { useTotus } from '../context/AppContext';
import { Cobranca, Cliente } from '../types';
import { formatCurrency, formatDate, isToday, isTomorrow, isPastDate, formatStatusBadge } from '../lib/utils';

interface CobrancasPageProps {
  onOpenPagamentoModal: (cobrancaId: string) => void;
  onOpenAlterarVencimentoCobranca: (cobranca: Cobranca, cliente: Cliente) => void;
  onOpenWhatsAppModal: (cliente: Cliente, cobranca?: Cobranca, tipoMsg?: string) => void;
  onOpenPromessaModal: (cliente: Cliente, cobrancaId?: string) => void;
  onOpenConcederBonusModal?: (cliente?: Cliente) => void;
}

export const CobrancasPage: React.FC<CobrancasPageProps> = ({
  onOpenPagamentoModal,
  onOpenAlterarVencimentoCobranca,
  onOpenWhatsAppModal,
  onOpenPromessaModal,
  onOpenConcederBonusModal,
}) => {
  const { cobrancas, clientes, promessas, cancelarOuDispensarCobranca, bonus, aplicarBonusNaCobranca } = useTotus();
  const [filtroAba, setFiltroAba] = useState<
    'todas' | 'dia_10' | 'dia_20' | 'dia_30' | 'vencem_hoje' | 'vencem_amanha' | 'atrasadas' | 'aguardando' | 'promessas' | 'pagas' | 'canceladas'
  >('todas');
  const [mesFiltro, setMesFiltro] = useState<number>(10);
  const [anoFiltro, setAnoFiltro] = useState<number>(2026);

  // Mapear cobranças com dados dos clientes
  const cobrancasDetalhadas = useMemo(() => {
    return cobrancas.map(cob => {
      const cliente = clientes.find(c => c.id === cob.cliente_id);
      const promessa = promessas.find(p => p.cobranca_id === cob.id && p.situacao === 'aguardando');
      return { cob, cliente, promessa };
    });
  }, [cobrancas, clientes, promessas]);

  // Filtragem
  const cobrancasFiltradas = useMemo(() => {
    return cobrancasDetalhadas.filter(({ cob, cliente, promessa }) => {
      // Filtro de mês/ano
      if (cob.competencia_mes !== mesFiltro || cob.competencia_ano !== anoFiltro) {
        return false;
      }

      const diaVenc = parseInt(cob.data_vencimento.split('-')[2], 10);

      switch (filtroAba) {
        case 'dia_10':
          return diaVenc === 10 || cliente?.dia_vencimento === 10;
        case 'dia_20':
          return diaVenc === 20 || cliente?.dia_vencimento === 20;
        case 'dia_30':
          return diaVenc === 30 || cliente?.dia_vencimento === 30;
        case 'vencem_hoje':
          return isToday(cob.data_vencimento) && cob.status !== 'pago';
        case 'vencem_amanha':
          return isTomorrow(cob.data_vencimento) && cob.status !== 'pago';
        case 'atrasadas':
          return cob.status === 'atrasado';
        case 'aguardando':
          return cob.status === 'pendente' || cob.status === 'avisado';
        case 'promessas':
          return cob.status === 'prometeu_pagar' || Boolean(promessa);
        case 'pagas':
          return cob.status === 'pago';
        case 'canceladas':
          return cob.status === 'cancelado' || cob.status.startsWith('dispensado');
        default:
          return true;
      }
    });
  }, [cobrancasDetalhadas, filtroAba, mesFiltro, anoFiltro]);

  // Totais do filtro atual
  const totais = useMemo(() => {
    let valorTotal = 0;
    let valorRecebido = 0;
    let valorPendente = 0;

    cobrancasFiltradas.forEach(({ cob }) => {
      valorTotal += cob.valor;
      if (cob.status === 'pago') {
        valorRecebido += cob.valor;
      } else if (cob.status !== 'cancelado' && !cob.status.startsWith('dispensado')) {
        valorPendente += cob.valor;
      }
    });

    return { valorTotal, valorRecebido, valorPendente };
  }, [cobrancasFiltradas]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={24} color="var(--accent-primary)" />
            Vencimentos
          </h1>
        </div>

        {/* Seletores de Filtro e Competência + Botão de Bônus */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {onOpenConcederBonusModal && (
            <button
              onClick={() => onOpenConcederBonusModal()}
              className="btn btn-secondary"
              style={{ color: '#ec4899', borderColor: 'rgba(236,72,153,0.3)', fontWeight: 600 }}
              title="Conceder bônus a um cliente"
            >
              <Gift size={16} color="#ec4899" />
              <span>Conceder Bônus</span>
            </button>
          )}

          <select
            className="form-control"
            style={{ width: '215px', height: '38px', fontSize: '0.875rem' }}
            value={filtroAba}
            onChange={e => setFiltroAba(e.target.value as any)}
            title="Filtrar faturas por ciclo ou status"
          >
            <option value="todas">Todas as Faturas</option>
            <option value="dia_10">📅 Vencimento Dia 10</option>
            <option value="dia_20">📅 Vencimento Dia 20</option>
            <option value="dia_30">📅 Vencimento Dia 30</option>
            <option value="vencem_hoje">🚨 Vencem Hoje</option>
            <option value="vencem_amanha">⏰ Vencem Amanhã</option>
            <option value="atrasadas">⚠️ Atrasadas</option>
            <option value="aguardando">Pendente</option>
            <option value="promessas">🤝 Promessas de Pagamento</option>
            <option value="pagas">✅ Pagas</option>
            <option value="canceladas">Dispensadas / Bônus</option>
          </select>

          <select
            className="form-control"
            style={{ width: '160px', height: '38px', fontSize: '0.875rem' }}
            value={mesFiltro}
            onChange={e => setMesFiltro(Number(e.target.value))}
            title="Mês de Competência"
          >
            <option value={9}>Setembro / 2026</option>
            <option value={10}>Outubro / 2026</option>
            <option value={11}>Novembro / 2026</option>
            <option value={12}>Dezembro / 2026</option>
          </select>
        </div>
      </div>

      {/* Mini Cards de Balanço do Ciclo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Total Previsto no Ciclo</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
            {formatCurrency(totais.valorTotal)}
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-emerald)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Efetivamente Recebido</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '4px' }}>
            {formatCurrency(totais.valorRecebido)}
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-amber)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Aguardando / Em Aberto</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '4px' }}>
            {formatCurrency(totais.valorPendente)}
          </div>
        </div>
      </div>

      {/* Tabela de Cobranças */}
      <div className="card" style={{ padding: '20px' }}>
        {cobrancasFiltradas.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-subtle)' }}>
            Nenhuma fatura encontrada com os filtros selecionados para este ciclo.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>WhatsApp</th>
                  <th>Ciclo</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Promessa / Detalhes</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {cobrancasFiltradas.map(({ cob, cliente, promessa }) => {
                  if (!cliente) return null;
                  const venceHoje = isToday(cob.data_vencimento);
                  const venceAmanha = isTomorrow(cob.data_vencimento);
                  const isPago = cob.status === 'pago' || cob.status.startsWith('dispensado');
                  const atrasado = isPastDate(cob.data_vencimento) && !isPago;
                  const isAtrasadoOuVencido = cob.status === 'atrasado' || atrasado || cob.status === 'cancelado';

                  let rowClass = 'row-pendente';
                  let borderColor = '#f59e0b';

                  if (isPago) {
                    rowClass = 'row-pago';
                    borderColor = '#10b981';
                  } else if (isAtrasadoOuVencido) {
                    rowClass = 'row-vencido';
                    borderColor = '#ef4444';
                  }

                  return (
                    <tr key={cob.id} className={rowClass}>
                      <td style={{ borderLeft: `4px solid ${borderColor}` }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{cliente.nome}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                          Venc. preferencial: dia {cliente.dia_vencimento}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}>
                          {cliente.whatsapp}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>
                          {String(cob.competencia_mes).padStart(2, '0')}/{cob.competencia_ano}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600 }}>{formatDate(cob.data_vencimento)}</span>
                          {venceHoje && <span className="badge badge-atrasado">Hoje</span>}
                          {venceAmanha && <span className="badge badge-pendente">Amanhã</span>}
                          {atrasado && !venceHoje && <span className="badge badge-atrasado">Vencida</span>}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800 }}>{formatCurrency(cob.valor)}</span>
                      </td>
                      <td>
                        <span className={`badge badge-${cob.status}`}>
                          {formatStatusBadge(cob.status)}
                        </span>
                      </td>
                      <td>
                        {promessa ? (
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-purple)' }}>
                            <strong>Prometeu pagar:</strong> {formatDate(promessa.data_combinada)}
                            {promessa.observacao && <div>{promessa.observacao}</div>}
                          </div>
                        ) : cob.motivo_cancelamento ? (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                            {cob.motivo_cancelamento}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {/* Abrir WhatsApp */}
                          <button
                            onClick={() => {
                              const tipo = venceAmanha ? 'lembrete_amanha' : venceHoje ? 'lembrete_hoje' : 'cobranca_pendente';
                              onOpenWhatsAppModal(cliente, cob, tipo);
                            }}
                            className="btn btn-whatsapp btn-sm btn-icon"
                            title="Cobrar via WhatsApp"
                          >
                            <MessageCircle size={15} />
                          </button>

                          {/* Dar Baixa (se pendente) */}
                          {cob.status !== 'pago' && !cob.status.startsWith('dispensado') && cob.status !== 'cancelado' && (
                            <button
                              onClick={() => onOpenPagamentoModal(cob.id)}
                              className="btn btn-success btn-sm btn-icon"
                              title="Dar baixa no pagamento"
                            >
                              <DollarSign size={15} />
                            </button>
                          )}

                          {/* Alterar Data desta fatura */}
                          <button
                            onClick={() => onOpenAlterarVencimentoCobranca(cob, cliente)}
                            className="btn btn-secondary btn-sm btn-icon"
                            title="Ajustar data de vencimento desta fatura"
                          >
                            <Calendar size={15} />
                          </button>

                          {/* Conceder ou Aplicar Bônus */}
                          <button
                            onClick={() => {
                              const bonusDisponivel = bonus.find(b => b.cliente_id === cliente.id && b.status === 'disponivel');
                              if (bonusDisponivel && cob.status !== 'pago' && !cob.status.startsWith('dispensado') && cob.status !== 'cancelado') {
                                if (confirm(`O cliente ${cliente.nome} possui um bônus disponível ("${bonusDisponivel.motivo_justificativa || 'Benefício'}").\n\nDeseja aplicar este bônus nesta fatura para dispensar a cobrança?\n(Clique em Cancelar para abrir a janela de bônus)`)) {
                                  aplicarBonusNaCobranca(bonusDisponivel.id, cob.id);
                                  return;
                                }
                              }
                              if (onOpenConcederBonusModal) {
                                onOpenConcederBonusModal(cliente);
                              }
                            }}
                            className="btn btn-secondary btn-sm btn-icon"
                            title="Conceder ou Aplicar Bônus"
                          >
                            <Gift size={15} color="#ec4899" />
                          </button>

                          {/* Registrar Promessa */}
                          {cob.status !== 'pago' && (
                            <button
                              onClick={() => onOpenPromessaModal(cliente, cob.id)}
                              className="btn btn-secondary btn-sm btn-icon"
                              title="Registrar promessa de pagamento"
                            >
                              <Clock size={15} color="var(--accent-purple)" />
                            </button>
                          )}

                          {/* Dispensar / Cancelar */}
                          {cob.status !== 'pago' && cob.status !== 'cancelado' && !cob.status.startsWith('dispensado') && (
                            <button
                              onClick={() => {
                                const mot = prompt('Informe o motivo do cancelamento ou dispensa desta fatura:');
                                if (mot) {
                                  cancelarOuDispensarCobranca(cob.id, 'cancelado', mot);
                                }
                              }}
                              className="btn btn-secondary btn-sm btn-icon"
                              title="Cancelar ou Dispensar fatura"
                            >
                              <XCircle size={15} color="var(--accent-rose)" />
                            </button>
                          )}
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
