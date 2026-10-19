import React from 'react';
import { LayoutDashboard, Users, CreditCard, Gift, Menu } from 'lucide-react';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenMenu: () => void;
  promessasCount?: number;
  aniversariantesCount?: number;
}

/**
 * Barra de navegação inferior exibida apenas no layout mobile (≤ 768px).
 * Dá acesso rápido às telas mais usadas; as demais ficam no menu lateral ("Mais").
 */
export const BottomNav: React.FC<BottomNavProps> = ({
  currentPage,
  onNavigate,
  onOpenMenu,
  promessasCount = 0,
  aniversariantesCount = 0,
}) => {
  const items = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'cobrancas', label: 'Cobranças', icon: CreditCard, badge: promessasCount },
    { id: 'bonus', label: 'Bônus', icon: Gift, badge: aniversariantesCount },
  ];

  const mainIds = items.map(i => i.id);
  const isOtherPage = !mainIds.includes(currentPage);

  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {items.map(item => {
        const Icon = item.icon;
        const active = currentPage === item.id;
        return (
          <button
            key={item.id}
            id={`bottom-nav-${item.id}`}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
            onClick={() => {
              onNavigate(item.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className="bottom-nav-icon">
              <Icon size={21} strokeWidth={active ? 2.4 : 2} />
              {!!item.badge && item.badge > 0 && <span className="bottom-nav-badge">{item.badge}</span>}
            </span>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        );
      })}

      <button
        id="bottom-nav-mais"
        className={`bottom-nav-item ${isOtherPage ? 'active' : ''}`}
        onClick={onOpenMenu}
      >
        <span className="bottom-nav-icon">
          <Menu size={21} strokeWidth={isOtherPage ? 2.4 : 2} />
        </span>
        <span className="bottom-nav-label">Mais</span>
      </button>
    </nav>
  );
};
