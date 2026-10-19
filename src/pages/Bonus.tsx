import React, { useState, useMemo } from 'react';
import {
  Gift,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Users,
} from 'lucide-react';
import { useTotus } from '../context/AppContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { BonusBeneficio, ProgramaBonus } from '../types';
import { ProgramaBonusModal } from '../components/modals/ProgramaBonusModal';
import { BONUS_ICON_MAP } from '../lib/bonusIcons';

interface BonusPageProps {
  onOpenNovoBonus?: () => void;
  onEditBonus?: (bonus: BonusBeneficio) => void;
  onOpenConcederManual?: () => void;
}

export const BonusPage: React.FC<BonusPageProps> = ({
  onOpenNovoBonus,
  onEditBonus,
  onOpenConcederManual,
}) => {
  const {
    bonus,
    clientes,
    cobrancas,
    aplicarBonusNaCobranca,
    cancelarBonus,
    deletarBonus,
    programasBonus,
    deletarProgramaBonus,
  } = useTotus();
  const [modalPrograma, setModalPrograma] = useState<{ open: boolean; programa?: ProgramaBonus | null }>({
    open: false,
  });
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'indicacao' | 'aniversario' | 'manual'>('todos');

  // Mapear bônus enriquecidos
  const bonusDetalhados = useMemo(() => {
    return bonus.map(b => {
      const cliente = clientes.find(c => c.id === b.cliente_id);
      const indicado = b.indicado_id ? clientes.find(c => c.id === b.indicado_id) : undefined;
      const cobrancaDispensada = b.cobranca_dispensada_id ? cobrancas.find(c => c.id === b.cobranca_dispensada_id) : undefined;
      return { b, cliente, indicado, cobrancaDispensada };
    });
  }, [bonus, clientes, cobrancas]);

  const filtrados = useMemo(() => {
    return bonusDetalhados.filter(({ b }) => {
      if (filtroTipo === 'todos') return true;
      return b.tipo === filtroTipo;
    });
  }, [bonusDetalhados, filtroTipo]);

  // Contadores
  const pendentesConfirmacao = bonus.filter(b => b.status === 'pendente').length;
  const disponiveis = bonus.filter(b => b.status === 'disponivel').length;
  const utilizados = bonus.filter(b => b.status === 'utilizado').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gift size={24} color="#ec4899" />
            Sistema de Bônus
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setModalPrograma({ open: true, programa: null })}
            className="btn btn-primary"
            style={{ backgroundColor: '#ec4899', borderColor: '#ec4899' }}
            title="Cadastrar um novo card de bônus com título e descrição"
          >
            <Plus size={16} />
            <span>Criar Novo Bônus</span>
          </button>

          <button
            onClick={onOpenNovoBonus || onOpenConcederManual}
            className="btn btn-secondary"
            title="Conceder benefício a um cliente específico"
          >
            <Gift size={16} color="#ec4899" />
            <span>Conceder a Cliente</span>
          </button>
        </div>
      </div>

      {/* Regras Claras em Destaque (Cards Dinâmicos) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px' }}>
        {programasBonus.map(prog => {
          const IconComp = BONUS_ICON_MAP[prog.icone || 'Gift'] || Gift;
          const corCard = prog.cor || '#ec4899';
          return (
            <div
              key={prog.id}
              className="card"
              style={{
                borderLeft: `4px solid ${corCard}`,
                padding: '18px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: `${corCard}18`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <IconComp size={18} color={corCard} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', wordBreak: 'break-word' }}>
                      {prog.titulo}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button
                      onClick={() => setModalPrograma({ open: true, programa: prog })}
                      className="btn btn-secondary btn-icon"
                      style={{ width: '28px', height: '28px', padding: 0 }}
                      title="Editar este card de bônus"
                    >
                      <Edit2 size={13} />
                    </button>
                    {programasBonus.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja excluir o card "${prog.titulo}"?`)) {
                            deletarProgramaBonus(prog.id);
                          }
                        }}
                        className="btn btn-secondary btn-icon"
                        style={{ width: '28px', height: '28px', padding: 0, color: 'var(--accent-rose)' }}
                        title="Excluir este card de bônus"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.45', margin: 0 }}>
                  {prog.descricao}
                </p>
              </div>
            </div>
          );
        })}

        {/* Card Interativo para Adicionar Novo Bônus */}
        <button
          type="button"
          onClick={() => setModalPrograma({ open: true, programa: null })}
          className="card"
          style={{
            border: '2px dashed var(--border-hover)',
            backgroundColor: 'rgba(236, 72, 153, 0.03)',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            cursor: 'pointer',
            minHeight: '110px',
            transition: 'all 0.2s ease',
            gap: '8px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#ec4899';
            e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.08)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-hover)';
            e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.03)';
          }}
          title="Clique para criar um novo card de bônus"
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(236, 72, 153, 0.15)',
              color: '#ec4899',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
              + Criar Novo Bônus
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Adicione um novo card com título e descrição
            </div>
          </div>
        </button>
      </div>

      {/* Mini Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Indicações Aguardando 1º Pagamento</div>
          <div className="card-value" style={{ color: 'var(--accent-amber)' }}>{pendentesConfirmacao}</div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-emerald)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Benefícios Prontos para Uso</div>
          <div className="card-value" style={{ color: 'var(--accent-emerald)' }}>{disponiveis}</div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Isenções Efetivamente Aplicadas</div>
          <div className="card-value" style={{ color: '#ec4899' }}>{utilizados}</div>
        </div>
      </div>

      {/* Filtros por Tipo */}
      <div className="chip-row" style={{ display: 'flex', gap: '8px' }}>
        {[
          { id: 'todos', label: 'Todos os Benefícios' },
          { id: 'indicacao', label: '🤝 Por Indicação' },
          { id: 'aniversario', label: '🎂 Por Aniversário' },
          { id: 'manual', label: '⚙️ Concedidos Manualmente' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFiltroTipo(tab.id as any)}
            className={`btn btn-sm ${filtroTipo === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabela de Benefícios */}
      <div className="card" style={{ padding: '20px' }}>
        {filtrados.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-subtle)' }}>
            Nenhum benefício registrado nesta categoria.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Beneficiário (Padrinho/Cliente)</th>
                  <th>Tipo</th>
                  <th>Origem / Indicado</th>
                  <th>Status</th>
                  <th>Fatura Dispensada</th>
                  <th>Data Concessão</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(({ b, cliente, indicado, cobrancaDispensada }) => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{cliente ? cliente.nome : 'Cliente'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                        Mensalidade base: {cliente ? formatCurrency(cliente.valor_mensalidade) : '-'}
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'rgba(236,72,153,0.1)', color: '#ec4899' }}>
                        {b.tipo === 'indicacao'
                          ? 'Indicação'
                          : b.tipo === 'aniversario'
                          ? 'Aniversário'
                          : programasBonus.find(p => p.id === b.tipo)?.titulo || 'Manual'}
                      </span>
                    </td>
                    <td>
                      {indicado ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{indicado.nome}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                            Status: {b.status === 'pendente' ? 'Aguardando 1º pagamento' : '1º pagamento confirmado'}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {b.motivo_justificativa || 'Benefício direto'}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${b.status}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      {cobrancaDispensada ? (
                        <div>
                          <span style={{ fontWeight: 600 }}>
                            {String(cobrancaDispensada.competencia_mes).padStart(2, '0')}/{cobrancaDispensada.competencia_ano}
                          </span>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                            Dispensado {formatCurrency(cobrancaDispensada.valor)}
                          </div>
                        </div>
                      ) : b.status === 'disponivel' ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                          Disponível para próximo ciclo
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formatDate(b.data_concessao)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {b.status === 'disponivel' && cliente && (
                          <button
                            onClick={() => {
                              // Encontrar fatura pendente do cliente para aplicar
                              const pendente = cobrancas.find(c => c.cliente_id === cliente.id && c.status === 'pendente');
                              if (pendente) {
                                if (confirm(`Deseja aplicar esta isenção à fatura de ${pendente.competencia_mes}/${pendente.competencia_ano} de ${cliente.nome}?`)) {
                                  aplicarBonusNaCobranca(b.id, pendente.id);
                                }
                              } else {
                                alert('O cliente não possui fatura pendente no momento para aplicar este benefício.');
                              }
                            }}
                            className="btn btn-primary btn-sm"
                            title="Aplicar na Fatura"
                          >
                            Aplicar
                          </button>
                        )}

                        {/* Botão Editar Bônus */}
                        <button
                          onClick={() => onEditBonus && onEditBonus(b)}
                          className="btn btn-secondary btn-sm btn-icon"
                          title="Editar Bônus"
                        >
                          <Edit2 size={15} />
                        </button>

                        {/* Botão Deletar Bônus */}
                        <button
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja excluir/deletar permanentemente este bônus de ${cliente?.nome || 'cliente'}?`)) {
                              deletarBonus(b.id);
                            }
                          }}
                          className="btn btn-secondary btn-sm btn-icon"
                          style={{ color: 'var(--accent-rose)' }}
                          title="Deletar Bônus"
                        >
                          <Trash2 size={15} />
                        </button>

                        {b.status !== 'utilizado' && b.status !== 'cancelado' && (
                          <button
                            onClick={() => {
                              const mot = prompt('Informe o motivo do cancelamento do benefício:');
                              if (mot) cancelarBonus(b.id, mot);
                            }}
                            className="btn btn-secondary btn-sm"
                            title="Cancelar benefício"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalPrograma.open && (
        <ProgramaBonusModal
          programaParaEditar={modalPrograma.programa}
          onClose={() => setModalPrograma({ open: false, programa: null })}
        />
      )}
    </div>
  );
};
