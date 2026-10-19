import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  ShieldCheck,
  User,
  Clock,
  Layers,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';
import { useTotus } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, formatDate } from '../lib/utils';
import { AuditLog } from '../types';

export const HistoricoPage: React.FC = () => {
  const { logsAuditoria, usuarios } = useTotus();
  const { isAdmin } = useAuth();

  const [busca, setBusca] = useState('');
  const [filtroModulo, setFiltroModulo] = useState<string>('todos');
  const [filtroAcao, setFiltroAcao] = useState<string>('todos');
  const [filtroUsuario, setFiltroUsuario] = useState<string>('todos');

  // Módulos únicos disponíveis nos logs
  const modulosDisponiveis = useMemo(() => {
    const set = new Set<string>();
    logsAuditoria.forEach(l => {
      if (l.tabela) set.add(l.tabela);
    });
    return Array.from(set).sort();
  }, [logsAuditoria]);

  // Lista de usuários únicos que realizaram ações
  const usuariosNosLogs = useMemo(() => {
    const map = new Map<string, string>();
    logsAuditoria.forEach(l => {
      if (l.user_id && l.user_nome) {
        map.set(l.user_id, l.user_nome);
      }
    });
    return Array.from(map.entries()).map(([id, nome]) => ({ id, nome }));
  }, [logsAuditoria]);

  // Filtragem dos logs
  const logsFiltrados = useMemo(() => {
    return logsAuditoria.filter(log => {
      // 1. Busca textual
      if (busca.trim()) {
        const q = busca.toLowerCase();
        const matchNome = log.user_nome?.toLowerCase().includes(q);
        const matchEmail = log.user_email?.toLowerCase().includes(q);
        const matchAcao = log.acao?.toLowerCase().includes(q);
        const matchTabela = log.tabela?.toLowerCase().includes(q);
        const matchDetalhes = log.detalhes?.toLowerCase().includes(q);
        if (!matchNome && !matchEmail && !matchAcao && !matchTabela && !matchDetalhes) {
          return false;
        }
      }

      // 2. Filtro por Módulo / Tabela
      if (filtroModulo !== 'todos' && log.tabela !== filtroModulo) {
        return false;
      }

      // 3. Filtro por Tipo de Ação
      if (filtroAcao !== 'todos') {
        const acao = log.acao.toLowerCase();
        if (filtroAcao === 'login' && !acao.includes('login') && !acao.includes('logout')) return false;
        if (filtroAcao === 'cadastro' && !acao.includes('cadastrar') && !acao.includes('novo') && !acao.includes('criar')) return false;
        if (filtroAcao === 'edicao' && !acao.includes('editar') && !acao.includes('alterar') && !acao.includes('atualizar')) return false;
        if (filtroAcao === 'pagamento' && !acao.includes('pagamento') && !acao.includes('pagar')) return false;
        if (filtroAcao === 'exclusao' && !acao.includes('excluir') && !acao.includes('deletar') && !acao.includes('suspender') && !acao.includes('cancelar')) return false;
        if (filtroAcao === 'bonus' && !acao.includes('bonus') && !acao.includes('dispensar')) return false;
      }

      // 4. Filtro por Usuário
      if (filtroUsuario !== 'todos' && log.user_id !== filtroUsuario) {
        return false;
      }

      return true;
    });
  }, [logsAuditoria, busca, filtroModulo, filtroAcao, filtroUsuario]);

  // Métricas do topo
  const totalLogs = logsAuditoria.length;
  const hojeStr = new Date().toISOString().split('T')[0];
  const logsHoje = logsAuditoria.filter(l => l.created_at?.startsWith(hojeStr)).length;
  const modulosCount = modulosDisponiveis.length;
  const usuariosAtivosCount = usuariosNosLogs.length;

  // Função para estilizar o badge da ação
  const getBadgeStyle = (acao: string) => {
    const a = acao.toLowerCase();
    if (a.includes('pagamento') || a.includes('pagar')) {
      return { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' };
    }
    if (a.includes('cadastrar') || a.includes('novo') || a.includes('criar') || a.includes('ativar')) {
      return { bg: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)', border: '1px solid rgba(99, 102, 241, 0.3)' };
    }
    if (a.includes('editar') || a.includes('alterar') || a.includes('atualizar')) {
      return { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' };
    }
    if (a.includes('suspender') || a.includes('excluir') || a.includes('cancelar') || a.includes('inativar')) {
      return { bg: 'rgba(244, 63, 94, 0.12)', color: 'var(--accent-rose)', border: '1px solid rgba(244, 63, 94, 0.3)' };
    }
    if (a.includes('login') || a.includes('logout')) {
      return { bg: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)', border: '1px solid rgba(6, 182, 212, 0.3)' };
    }
    if (a.includes('bonus') || a.includes('dispensar')) {
      return { bg: 'rgba(236, 72, 153, 0.12)', color: '#ec4899', border: '1px solid rgba(236, 72, 153, 0.3)' };
    }
    return { bg: 'var(--bg-tertiary)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)' };
  };

  // Exportar auditoria completa para CSV
  const exportarAuditoriaCSV = () => {
    const headers = ['Data & Hora', 'Usuário', 'E-mail', 'Ação', 'Módulo', 'Detalhes'];
    const rows = logsFiltrados.map(log => [
      `"${formatDateTime(log.created_at)}"`,
      `"${log.user_nome || ''}"`,
      `"${log.user_email || ''}"`,
      `"${log.acao || ''}"`,
      `"${log.tabela || ''}"`,
      `"${(log.detalhes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `totustv_historico_auditoria_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={24} color="var(--accent-primary)" />
            Histórico
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={exportarAuditoriaCSV}
            className="btn btn-secondary"
            title="Exportar todos os registros de auditoria em CSV"
            id="btn-exportar-historico-csv"
          >
            <Download size={16} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Métricas do Histórico / Trilha de Auditoria */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Activity size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Total de Atividades</span>
          </div>
          <div className="card-value">{totalLogs}</div>
          <div className="card-subtext">
            <span>Registros gravados no sistema</span>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-emerald)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Clock size={16} color="var(--accent-emerald)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Ações Hoje</span>
          </div>
          <div className="card-value" style={{ color: 'var(--accent-emerald)' }}>{logsHoje}</div>
          <div className="card-subtext">
            <span>Operações nas últimas 24h</span>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-cyan)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Layers size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Módulos Monitorados</span>
          </div>
          <div className="card-value" style={{ color: 'var(--accent-cyan)' }}>{modulosCount}</div>
          <div className="card-subtext">
            <span>Clientes, pagamentos, faturas, usuários</span>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-purple)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <User size={16} color="var(--accent-purple)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Usuários Ativos</span>
          </div>
          <div className="card-value" style={{ color: 'var(--accent-purple)' }}>{usuariosAtivosCount}</div>
          <div className="card-subtext">
            <span>Equipe e revendedores com atividades</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
          {/* Campo de Busca Geral */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por usuário, ação, detalhes ou módulo..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ paddingLeft: '38px' }}
            />
          </div>

          {/* Filtro por Módulo */}
          <select
            className="form-control"
            value={filtroModulo}
            onChange={e => setFiltroModulo(e.target.value)}
            style={{ width: '170px' }}
            title="Filtrar por Módulo"
          >
            <option value="todos">Todos os Módulos</option>
            {modulosDisponiveis.map(mod => (
              <option key={mod} value={mod}>
                📁 {mod.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Filtro por Tipo de Ação */}
          <select
            className="form-control"
            value={filtroAcao}
            onChange={e => setFiltroAcao(e.target.value)}
            style={{ width: '180px' }}
            title="Filtrar por Tipo de Ação"
          >
            <option value="todos">Todas as Ações</option>
            <option value="pagamento">💰 Pagamentos</option>
            <option value="cadastro">➕ Cadastros / Criações</option>
            <option value="edicao">✏️ Edições & Alterações</option>
            <option value="bonus">🎁 Bônus & Isenções</option>
            <option value="exclusao">⚠️ Suspensões / Cancelamentos</option>
            <option value="login">🔐 Logins & Sessões</option>
          </select>

          {/* Filtro por Usuário */}
          <select
            className="form-control"
            value={filtroUsuario}
            onChange={e => setFiltroUsuario(e.target.value)}
            style={{ width: '180px' }}
            title="Filtrar por Usuário Responsável"
          >
            <option value="todos">Todos os Usuários</option>
            {usuariosNosLogs.map(u => (
              <option key={u.id} value={u.id}>
                👤 {u.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Resumo da Contagem */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          <span>
            Exibindo <strong>{logsFiltrados.length}</strong> de {logsAuditoria.length} registros
          </span>

          {(busca || filtroModulo !== 'todos' || filtroAcao !== 'todos' || filtroUsuario !== 'todos') && (
            <button
              onClick={() => {
                setBusca('');
                setFiltroModulo('todos');
                setFiltroAcao('todos');
                setFiltroUsuario('todos');
              }}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {/* Tabela de Histórico & Auditoria */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Data & Hora</th>
                <th>Usuário Responsável</th>
                <th>Ação Realizada</th>
                <th>Tabela / Módulo</th>
                <th>Detalhes da Operação</th>
              </tr>
            </thead>
            <tbody>
              {logsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-subtle)' }}>
                    Nenhum registro encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                logsFiltrados.map(log => {
                  const badgeStyle = getBadgeStyle(log.acao);
                  return (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                        {formatDateTime(log.created_at)}
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{log.user_nome || 'Sistema'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{log.user_email || '-'}</div>
                        </div>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: badgeStyle.bg,
                            color: badgeStyle.color,
                            border: badgeStyle.border,
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {log.acao}
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-subtle)',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                          }}
                        >
                          {log.tabela}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                          {log.detalhes || '-'}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
