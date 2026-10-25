import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  History,
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  MapPin,
  Trash2,
} from 'lucide-react';
import { useTotus } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Cliente, Cobranca } from '../types';
import { formatCurrency, formatDate, formatAniversario, cleanWhatsAppNumber, formatPhone, isToday, isTomorrow, isPastDate, formatStatusBadge } from '../lib/utils';

interface ClientesPageProps {
  onOpenNovoCliente: () => void;
  onEditCliente: (cliente: Cliente) => void;
  onOpenAlterarVencimento?: (cliente: Cliente) => void;
  onOpenWhatsAppModal: (cliente: Cliente, cobranca?: Cobranca, tipoMsg?: string) => void;
  onOpenPagamentoModal?: (cobrancaId: string) => void;
  onOpenPromessaModal?: (cliente: Cliente, cobrancaId?: string) => void;
  onOpenHistoricoModal: (cliente: Cliente) => void;
  onOpenConcederBonusModal?: (cliente: Cliente) => void;
  filtroGlobal?: string;
}

export const ClientesPage: React.FC<ClientesPageProps> = ({
  onOpenNovoCliente,
  onEditCliente,
  onOpenWhatsAppModal,
  onOpenHistoricoModal,
  filtroGlobal = '',
}) => {
  const { clientes, cobrancas, toggleStatusCliente, bonus, promessas, excluirCliente } = useTotus();
  const { isAdmin, currentUser } = useAuth();
  const [busca, setBusca] = useState(filtroGlobal);
  const [filtroRapido, setFiltroRapido] = useState<
    'todos' | 'ativos' | 'inativos' | 'com_indicacao' | 'diretos'
  >('todos');

  // Relacionar cada cliente com a sua cobrança mais recente/ativa (garantindo unicidade de cliente)
  const clientesComDados = useMemo(() => {
    const uniqueClients = new Map<string, typeof clientes[0]>();
    for (const c of clientes) {
      if (c && c.id && !uniqueClients.has(c.id)) {
        uniqueClients.set(c.id, c);
      }
    }

    return Array.from(uniqueClients.values()).map(cli => {
      // Pega cobranças do cliente ordenadas por competência decrescente
      const cobs = cobrancas
        .filter(c => c.cliente_id === cli.id)
        .sort((a, b) => {
          if (b.competencia_ano !== a.competencia_ano) return b.competencia_ano - a.competencia_ano;
          return b.competencia_mes - a.competencia_mes;
        });

      const cobrancaAtual = cobs[0]; // mais recente
      const ultPagamento = cobrancas.find(c => c.cliente_id === cli.id && c.status === 'pago');
      const possuiBonus = bonus.some(b => b.cliente_id === cli.id && (b.status === 'disponivel' || b.status === 'utilizado'));
      const promessaAtiva = promessas.find(p => p.cliente_id === cli.id && p.situacao === 'aguardando');

      return {
        cli,
        cobrancaAtual,
        ultPagamento,
        possuiBonus,
        promessaAtiva,
      };
    });
  }, [clientes, cobrancas, bonus, promessas]);

  // Filtragem e Ordenação Alfabética (A-Z)
  const clientesFiltrados = useMemo(() => {
    return clientesComDados
      .filter(({ cli }) => {
        // 1. Busca textual
        const query = busca.toLowerCase().trim();
        if (query) {
          const matchNome = cli.nome.toLowerCase().includes(query);
          const queryDigits = query.replace(/\D/g, '');
          const matchTel = cli.whatsapp.toLowerCase().includes(query) || (queryDigits.length > 0 && cli.whatsapp.replace(/\D/g, '').includes(queryDigits));
          const matchCidade = cli.cidade ? cli.cidade.toLowerCase().includes(query) : false;
          const matchEstado = cli.estado ? cli.estado.toLowerCase().includes(query) : false;
          const matchPais = cli.pais ? cli.pais.toLowerCase().includes(query) : false;
          const padrinho = cli.indicado_por ? clientes.find(c => c.id === cli.indicado_por) : null;
          const matchPadrinho = padrinho ? padrinho.nome.toLowerCase().includes(query) : false;
          if (!matchNome && !matchTel && !matchCidade && !matchEstado && !matchPais && !matchPadrinho) return false;
        }

        // 2. Filtro Rápido
        if (filtroRapido === 'ativos') return cli.status === 'ativo';
        if (filtroRapido === 'inativos') return cli.status === 'inativo';
        if (filtroRapido === 'com_indicacao') return Boolean(cli.indicado_por);
        if (filtroRapido === 'diretos') return !cli.indicado_por;

        return true;
      })
      .sort((a, b) => a.cli.nome.localeCompare(b.cli.nome, 'pt-BR', { sensitivity: 'base' }));
  }, [clientesComDados, busca, filtroRapido, clientes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header da Página */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={24} color="var(--accent-primary)" />
            Clientes
          </h1>
        </div>

        <button onClick={onOpenNovoCliente} className="btn btn-primary" id="btn-adicionar-cliente">
          <Plus size={16} />
          <span>Cadastrar Novo Cliente</span>
        </button>
      </div>

      {/* Busca e Tabela Principal */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nome, telefone, cidade, país ou indicação..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ paddingLeft: '38px' }}
            />
          </div>

          {/* Select de Filtro Rápido */}
          <select
            className="form-control"
            value={filtroRapido}
            onChange={e => setFiltroRapido(e.target.value as any)}
            style={{ width: '200px' }}
            title="Filtrar cadastros"
          >
            <option value="todos">Todos os Cadastros</option>
            <option value="ativos">Clientes Ativos</option>
            <option value="inativos">Clientes Inativos</option>
            <option value="com_indicacao">Com Indicação (Padrinho)</option>
            <option value="diretos">Cadastros Diretos</option>
          </select>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            Exibindo <strong>{clientesFiltrados.length}</strong> de {clientes.length} clientes
          </div>
        </div>

        {/* Legenda de Status com as Bolinhas */}
        <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.785rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)', display: 'inline-block' }} />
            <span>Bolinha Verde: <strong>Cliente Ativo</strong></span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#ef4444', boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)', display: 'inline-block' }} />
            <span>Bolinha Vermelha: <strong>Cliente Inativo</strong></span>
          </span>
        </div>

        {clientesFiltrados.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-subtle)' }}>
            Nenhum cliente encontrado com os filtros selecionados.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>País</th>
                  <th>Estado</th>
                  <th>Cidade</th>
                  <th>Indicação</th>
                  <th>Aniversário</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map(({ cli, cobrancaAtual, possuiBonus }) => {
                  const padrinho = cli.indicado_por ? clientes.find(c => c.id === cli.indicado_por) : null;
                  const isAniversarianteMes = (dataNasc?: string) => {
                    if (!dataNasc) return false;
                    const parts = dataNasc.split('-');
                    if (parts.length < 2) return false;
                    const mesNasc = parseInt(parts[1], 10);
                    const currentMonth = new Date().getMonth() + 1;
                    return mesNasc === currentMonth;
                  };

                  return (
                    <tr key={cli.id}>
                      <td>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => toggleStatusCliente(cli.id)}
                              style={{
                                border: 'none',
                                background: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                              }}
                              title={`Status: ${cli.status === 'ativo' ? 'Cliente Ativo (Bolinha Verde). Clique para inativar.' : 'Cliente Inativo (Bolinha Vermelha). Clique para ativar.'}`}
                            >
                              <span
                                style={{
                                  width: '10px',
                                  height: '10px',
                                  borderRadius: '50%',
                                  backgroundColor: cli.status === 'ativo' ? '#10b981' : '#ef4444',
                                  boxShadow: cli.status === 'ativo' ? '0 0 6px rgba(16, 185, 129, 0.7)' : '0 0 6px rgba(239, 68, 68, 0.7)',
                                  display: 'inline-block',
                                }}
                              />
                            </button>
                            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                              {cli.nome}
                            </span>
                            {possuiBonus && (
                              <span title="Cliente possui ou usou bônus" style={{ cursor: 'pointer' }}>
                                🎁
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '2px', paddingLeft: '17px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)' }}>{formatPhone(cli.whatsapp)}</span>
                          </div>
                          {cli.observacoes && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px', paddingLeft: '17px' }}>
                              {cli.observacoes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {cli.pais || 'Brasil'}
                        </span>
                      </td>
                      <td>
                        {cli.estado ? (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: 'var(--bg-tertiary)',
                              color: 'var(--text-main)',
                              border: '1px solid var(--border-subtle)',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                            }}
                          >
                            {cli.estado.toUpperCase()}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-subtle)' }}>-</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                          {cli.cidade || '-'}
                        </span>
                      </td>
                      <td>
                        {padrinho ? (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: 'rgba(99, 102, 241, 0.12)',
                              color: 'var(--accent-primary)',
                              border: '1px solid rgba(99, 102, 241, 0.25)',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                            }}
                            title={`Indicado por ${padrinho.nome}`}
                          >
                            🎁 {padrinho.nome}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
                            Direto
                          </span>
                        )}
                      </td>
                      <td>
                        {cli.data_nascimento ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                              {formatAniversario(cli.data_nascimento)}
                            </span>
                            {isAniversarianteMes(cli.data_nascimento) && (
                              <span title="Aniversariante deste mês!" style={{ fontSize: '0.85rem' }}>
                                🎂
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-subtle)' }}>-</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        {/* WhatsApp */}
                        <button
                          onClick={() => onOpenWhatsAppModal(cli, cobrancaAtual)}
                          className="btn btn-whatsapp btn-sm btn-icon"
                          title="Falar no WhatsApp"
                        >
                          <MessageCircle size={15} />
                        </button>

                        {/* Histórico Completo */}
                        <button
                          onClick={() => onOpenHistoricoModal(cli)}
                          className="btn btn-secondary btn-sm btn-icon"
                          title="Histórico Completo do Cliente"
                        >
                          <History size={15} />
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => onEditCliente(cli)}
                          className="btn btn-secondary btn-sm btn-icon"
                          title="Editar Cadastro"
                        >
                          <Edit2 size={15} />
                        </button>

                        {/* Excluir Cliente */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (window.confirm(`Tem certeza que deseja excluir o cliente "${cli.nome}"? Todas as faturas e registros vinculados serão removidos permanentemente.`)) {
                              try {
                                excluirCliente(cli.id);
                              } catch (err: any) {
                                console.error('Erro ao excluir cliente:', err);
                                alert(err?.message || 'Erro ao excluir cliente');
                              }
                            }
                          }}
                          className="btn btn-secondary btn-sm btn-icon"
                          title="Excluir Cliente"
                          style={{ color: 'var(--accent-rose)' }}
                        >
                          <Trash2 size={15} />
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
