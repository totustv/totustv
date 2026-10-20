import React, { useState } from 'react';
import {
  Menu,
  Sun,
  Moon,
  Search,
  Plus,
  Bell,
  CheckCircle,
  Tv,
} from 'lucide-react';
import { useTotus } from '../context/AppContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenNovoCliente: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenNovoCliente,
  searchTerm,
  onSearchChange,
}) => {
  const { kpis } = useTotus();
  const [isDark, setIsDark] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const notificationCount = kpis.vencemHoje + kpis.vencemAmanha + kpis.aniversariantesMes.length;

  return (
    <header className="header">
      <div className="header-row">
        <div className="header-left">
          <button
            onClick={onToggleSidebar}
            className="btn btn-secondary btn-icon"
            title="Abrir menu lateral"
            id="btn-toggle-sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="header-brand">
            <div className="brand-logo">
              <Tv size={18} />
            </div>
            <span className="brand-name">
              TOTUS <span style={{ color: 'var(--accent-primary)' }}>TV</span>
            </span>
          </div>

          {/* Global Search Bar (desktop) */}
          <div className="header-search">
            <Search size={16} className="header-search-icon" />
            <input
              type="text"
              className="form-control"
              placeholder="Buscar cliente, WhatsApp, fatura..."
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="header-right">
          {/* Notificações rápidas */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="btn btn-secondary btn-icon"
              style={{ position: 'relative' }}
              title="Lembretes do dia"
              id="btn-notificacoes"
            >
              <Bell size={18} />
              {notificationCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '10px',
                    height: '10px',
                    backgroundColor: 'var(--accent-rose)',
                    borderRadius: '50%',
                    border: '2px solid var(--bg-secondary)',
                  }}
                />
              )}
            </button>

            {showNotifications && (
              <>
                <div className="notif-backdrop" onClick={() => setShowNotifications(false)} />
                <div className="notif-dropdown">
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      marginBottom: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>Avisos Importantes</span>
                    <span className="badge badge-pendente">{notificationCount}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.825rem' }}>
                    {kpis.vencemHoje > 0 ? (
                      <div style={{ padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                        🚨 <strong>{kpis.vencemHoje}</strong> cobrança(s) vencendo hoje!
                      </div>
                    ) : null}

                    {kpis.vencemAmanha > 0 ? (
                      <div style={{ padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                        ⏰ <strong>{kpis.vencemAmanha}</strong> cobrança(s) vencem amanhã (lembrete recomendado).
                      </div>
                    ) : null}

                    {kpis.aniversariantesMes.length > 0 ? (
                      <div style={{ padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                        🎂 <strong>{kpis.aniversariantesMes.length}</strong> aniversariante(s) com isenção neste mês.
                      </div>
                    ) : null}

                    {notificationCount === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--text-subtle)', padding: '12px' }}>
                        <CheckCircle size={24} color="var(--accent-emerald)" style={{ margin: '0 auto 6px' }} />
                        Tudo em dia para hoje!
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Toggle Dark/Light Mode */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary btn-icon"
            title={isDark ? 'Tema Claro' : 'Tema Escuro'}
            id="btn-toggle-theme"
          >
            {isDark ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} />}
          </button>

          {/* Botão Novo Cliente */}
          <button
            onClick={onOpenNovoCliente}
            className="btn btn-primary header-new-btn"
            id="btn-header-novo-cliente"
            title="Novo Cliente"
          >
            <Plus size={16} />
            <span className="btn-label">Novo Cliente</span>
          </button>
        </div>
      </div>

    </header>
  );
};
