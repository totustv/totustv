import React from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Gift,
  DollarSign,
  TrendingDown,
  Settings,
  Tv,
  X,
  Sparkles,
  UserCheck,
  LogOut,
  User,
  History,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
  aniversariantesCount?: number;
  promessasCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpen,
  onClose,
  aniversariantesCount = 0,
  promessasCount = 0,
}) => {
  const { currentUser, isAdmin, isReseller, logout } = useAuth();

  // Menu adaptado estritamente por perfil de usuário
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: Users,
      visible: true,
    },
    {
      id: 'cobrancas',
      label: 'Vencimentos',
      icon: CreditCard,
      visible: true,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      visible: true,
    },
    {
      id: 'bonus',
      label: 'Bônus',
      icon: Gift,
      visible: true,
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      icon: DollarSign,
      visible: isAdmin, // Revendedor NÃO tem acesso ao financeiro global
    },
    {
      id: 'despesas',
      label: 'Despesas',
      icon: TrendingDown,
      visible: isAdmin, // Revendedor NÃO pode visualizar despesas
    },
    {
      id: 'usuarios',
      label: 'Equipe',
      icon: UserCheck,
      visible: isAdmin, // Exclusivo de administradores
    },
    {
      id: 'historico',
      label: 'Histórico',
      icon: History,
      visible: isAdmin, // Trilha de auditoria e segurança
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: Settings,
      visible: isAdmin, // Revendedor não pode alterar configurações globais
    },
  ].filter(item => item.visible);

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(2px)',
            zIndex: 95,
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div
          style={{
            height: '64px',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Tv size={20} />
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
                TOTUS <span style={{ color: 'var(--accent-primary)' }}>TV</span>
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--text-subtle)',
                }}
              >
                PAINEL ADMIN
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary btn-icon"
            style={{ display: 'flex' }}
            title="Fechar menu lateral"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-subtle)',
              padding: '0 12px 8px 12px',
              letterSpacing: '0.05em',
            }}
          >
            Menu Principal
          </div>

          {menuItems.map(item => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: active ? 'var(--accent-glow)' : 'transparent',
                  color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    e.currentTarget.style.color = 'var(--text-main)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon size={18} color={active ? 'var(--accent-primary)' : 'currentColor'} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer info & Perfil Autenticado */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Card do Usuário Conectado */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              background: isAdmin
                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: isAdmin ? 'rgba(99, 102, 241, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                  border: isAdmin ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(6, 182, 212, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isAdmin ? 'var(--accent-primary)' : 'var(--accent-cyan)',
                  flexShrink: 0,
                }}
              >
                <User size={18} />
              </div>

              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={currentUser?.nome || 'Usuário'}
                >
                  {currentUser?.nome || 'Usuário'}
                </div>
                <div style={{ marginTop: '2px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '1px 7px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      borderRadius: '4px',
                      letterSpacing: '0.02em',
                      background: isAdmin ? 'rgba(99, 102, 241, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                      color: isAdmin ? 'var(--accent-primary)' : 'var(--accent-cyan)',
                      border: isAdmin ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(6, 182, 212, 0.3)',
                    }}
                  >
                    {isAdmin ? 'Admin' : 'Revendedor'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="btn btn-secondary btn-icon"
              title="Encerrar Sessão (Logout)"
              style={{ flexShrink: 0, width: '30px', height: '30px' }}
            >
              <LogOut size={14} color="var(--accent-rose)" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
