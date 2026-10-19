import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  Lock,
  Edit2,
  ArrowRightLeft,
  KeyRound,
  Send,
  History,
} from 'lucide-react';
import { useTotus } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { UserProfile, UserRole, UserStatus } from '../types';
import { formatDate, formatDateTime } from '../lib/utils';

export const UsuariosPage: React.FC = () => {
  const { usuarios, salvarUsuario, toggleStatusUsuario, clientes, logsAuditoria } = useTotus();
  const { currentUser, isAdmin } = useAuth();

  const [busca, setBusca] = useState('');
  const [filtroRole, setFiltroRole] = useState<'todos' | 'admin' | 'reseller'>('todos');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'suspenso'>('todos');

  // Modal Novo / Editar Usuário
  const [modalUser, setModalUser] = useState<{ open: boolean; user?: UserProfile | null }>({ open: false });
  const [formData, setFormData] = useState({
    id: '',
    nome: '',
    email: '',
    telefone: '',
    role: 'reseller' as UserRole,
    status: 'ativo' as UserStatus,
  });

  // Modal Convite / Redefinição de Acesso
  const [modalConvite, setModalConvite] = useState<{ open: boolean; user?: UserProfile | null; link?: string }>({ open: false });

  // Contagem de clientes por revendedor
  const clientesPorRevendedor = useMemo(() => {
    const counts: Record<string, number> = {};
    clientes.forEach(c => {
      const rId = c.reseller_id || 'admin_direto';
      counts[rId] = (counts[rId] || 0) + 1;
    });
    return counts;
  }, [clientes]);

  // Filtragem de Usuários
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      const q = busca.toLowerCase().trim();
      if (q) {
        const matchNome = u.nome.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        if (!matchNome && !matchEmail) return false;
      }

      if (filtroRole !== 'todos' && u.role !== filtroRole) return false;
      if (filtroStatus !== 'todos' && u.status !== filtroStatus) return false;

      return true;
    });
  }, [usuarios, busca, filtroRole, filtroStatus]);

  const abrirModalEditar = (u: UserProfile) => {
    setFormData({
      id: u.id,
      nome: u.nome,
      email: u.email,
      telefone: u.telefone || '',
      role: u.role,
      status: u.status,
    });
    setModalUser({ open: true, user: u });
  };

  const abrirModalNovo = () => {
    setFormData({
      id: '',
      nome: '',
      email: '',
      telefone: '',
      role: 'reseller',
      status: 'ativo',
    });
    setModalUser({ open: true, user: null });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return alert('Informe o nome do revendedor');
    if (!formData.email.trim()) return alert('Informe o e-mail do revendedor');

    try {
      salvarUsuario({
        id: formData.id || undefined,
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        role: formData.role,
        status: formData.status,
      });
      setModalUser({ open: false });
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar usuário');
    }
  };

  const handleGerarConvite = (u: UserProfile) => {
    const inviteLink = `${window.location.origin}/definir-senha?token=tok_${u.id}_${Date.now()}`;
    setModalConvite({ open: true, user: u, link: inviteLink });
  };

  if (!isAdmin) {
    return (
      <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
        <ShieldAlert size={48} color="var(--accent-rose)" style={{ margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Acesso Restrito</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '6px' }}>
          A gestão de equipe e usuários é exclusiva para Administradores da Totus TV.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={24} color="var(--accent-primary)" />
            Equipe
          </h1>
        </div>

        <button onClick={abrirModalNovo} className="btn btn-primary" id="btn-cadastrar-revendedor">
          <UserPlus size={16} />
          <span>Novo Revendedor</span>
        </button>
      </div>
          {/* Métricas da Equipe */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Users size={18} color="var(--accent-primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Total de Revendedores</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                {usuarios.filter(u => u.role === 'reseller').length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
                Carteiras operacionais ativas
              </div>
            </div>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-emerald)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <CheckCircle2 size={18} color="var(--accent-emerald)" />
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Contas Ativas</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                {usuarios.filter(u => u.status === 'ativo').length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
                Acesso liberado ao portal
              </div>
            </div>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-rose)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <XCircle size={18} color="var(--accent-rose)" />
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Contas Suspensas</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
                {usuarios.filter(u => u.status === 'suspenso').length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
                Acesso bloqueado pelo administrador
              </div>
            </div>

            <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-cyan)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ShieldCheck size={18} color="var(--accent-cyan)" />
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Administradores</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                {usuarios.filter(u => u.role === 'admin').length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
                Controle irrestrito do sistema
              </div>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por nome ou e-mail..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  className="form-control"
                  value={filtroRole}
                  onChange={e => setFiltroRole(e.target.value as any)}
                  style={{ width: '160px' }}
                >
                  <option value="todos">Todos os Papéis</option>
                  <option value="reseller">Apenas Revendedores</option>
                  <option value="admin">Apenas Administradores</option>
                </select>

                <select
                  className="form-control"
                  value={filtroStatus}
                  onChange={e => setFiltroStatus(e.target.value as any)}
                  style={{ width: '150px' }}
                >
                  <option value="todos">Todos os Status</option>
                  <option value="ativo">Ativos</option>
                  <option value="suspenso">Suspensos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabela de Revendedores */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nome do Usuário</th>
                    <th>E-mail</th>
                    <th>Perfil</th>
                    <th>Status</th>
                    <th>Clientes Vinculados</th>
                    <th>Data de Cadastro</th>
                    <th>Último Acesso</th>
                    <th style={{ textAlign: 'right' }}>Ações Administrativas</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-subtle)' }}>
                        Nenhum usuário encontrado com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map(user => {
                      const totalClientes = clientesPorRevendedor[user.id] || 0;
                      const isSelf = user.id === currentUser?.id;

                      return (
                        <tr key={user.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                              {user.nome}
                              {isSelf && (
                                <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                                  (Você)
                                </span>
                              )}
                            </div>
                          </td>

                          <td>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}>
                              {user.email}
                            </span>
                          </td>

                          <td>
                            {user.role === 'admin' ? (
                              <span className="badge badge-em-dia" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Shield size={12} />
                                Administrador
                              </span>
                            ) : (
                              <span className="badge badge-pendente" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Users size={12} />
                                Revendedor
                              </span>
                            )}
                          </td>

                          <td>
                            {user.status === 'ativo' ? (
                              <span className="badge badge-em-dia">Ativo</span>
                            ) : (
                              <span className="badge badge-atrasado">Suspenso</span>
                            )}
                          </td>

                          <td>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                              {totalClientes} {totalClientes === 1 ? 'cliente' : 'clientes'}
                            </span>
                          </td>

                          <td>
                            <span style={{ fontSize: '0.825rem' }}>
                              {formatDate(user.created_at)}
                            </span>
                          </td>

                          <td>
                            <span style={{ fontSize: '0.825rem', color: user.ultimo_acesso ? 'var(--text-main)' : 'var(--text-subtle)' }}>
                              {user.ultimo_acesso ? formatDateTime(user.ultimo_acesso) : 'Nunca acessou'}
                            </span>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                onClick={() => handleGerarConvite(user)}
                                className="btn btn-secondary btn-icon"
                                title="Enviar link de definição de senha"
                              >
                                <KeyRound size={15} />
                              </button>

                              <button
                                onClick={() => abrirModalEditar(user)}
                                className="btn btn-secondary btn-icon"
                                title="Editar dados cadastrais"
                              >
                                <Edit2 size={15} />
                              </button>

                              {!isSelf && (
                                <button
                                  onClick={() => toggleStatusUsuario(user.id)}
                                  className={`btn btn-icon ${user.status === 'ativo' ? 'btn-secondary' : 'btn-primary'}`}
                                  title={user.status === 'ativo' ? 'Suspender acesso' : 'Reativar acesso'}
                                  style={{
                                    color: user.status === 'ativo' ? 'var(--accent-rose)' : undefined,
                                  }}
                                >
                                  {user.status === 'ativo' ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
                                </button>
                              )}
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

      {/* Modal Criar / Editar Usuário */}
      {modalUser.open && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="var(--accent-primary)" />
                {formData.id ? 'Editar Revendedor' : 'Cadastrar Novo Revendedor'}
              </h2>
              <button onClick={() => setModalUser({ open: false })} className="btn btn-secondary btn-icon">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Nome Completo *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Carlos Oliveira"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">E-mail Corporativo *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="revendedor@totustv.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={Boolean(formData.id)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefone / WhatsApp</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="11999998888"
                  value={formData.telefone}
                  onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Perfil de Acesso</label>
                  <select
                    className="form-control"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                  >
                    <option value="reseller">Revendedor (Carteira Restrita)</option>
                    <option value="admin">Administrador (Total)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status da Conta</label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as UserStatus })}
                  >
                    <option value="ativo">Ativo</option>
                    <option value="suspenso">Suspenso</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalUser({ open: false })} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <span>{formData.id ? 'Salvar Alterações' : 'Criar Revendedor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Convite / Link de Senha */}
      {modalConvite.open && modalConvite.user && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={20} color="var(--accent-primary)" />
                Convite & Definição de Senha
              </h2>
              <button onClick={() => setModalConvite({ open: false })} className="btn btn-secondary btn-icon">
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Envie o link seguro abaixo para <strong>{modalConvite.user.nome}</strong> ({modalConvite.user.email}). Ele poderá definir sua senha inicial e acessar imediatamente sua carteira:
            </p>

            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                wordBreak: 'break-all',
                marginBottom: '16px',
              }}
            >
              {modalConvite.link}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  if (modalConvite.link) navigator.clipboard.writeText(modalConvite.link);
                  alert('Link de convite copiado para a área de transferência!');
                  setModalConvite({ open: false });
                }}
                className="btn btn-primary"
              >
                Copiar Link Seguro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
