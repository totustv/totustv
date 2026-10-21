import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useTotus } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { useResponsiveTables } from './lib/useResponsiveTables';

// Páginas
import { LoginPage } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ClientesPage } from './pages/Clientes';
import { CobrancasPage } from './pages/Cobrancas';
import { BonusPage } from './pages/Bonus';
import { FinanceiroPage } from './pages/Financeiro';
import { DespesasPage } from './pages/Despesas';
import { UsuariosPage } from './pages/Usuarios';
import { RelatoriosPage } from './pages/Relatorios';
import { ConfiguracoesPage } from './pages/Configuracoes';
import { HistoricoPage } from './pages/Historico';
import { WhatsAppPage } from './pages/WhatsApp';

// Modais
import { ClienteModal } from './components/modals/ClienteModal';
import { PagamentoModal } from './components/modals/PagamentoModal';
import { WhatsAppModal } from './components/modals/WhatsAppModal';
import { PromessaModal } from './components/modals/PromessaModal';
import { AlterarVencimentoModal } from './components/modals/AlterarVencimentoModal';
import { DespesaModal } from './components/modals/DespesaModal';
import { HistoricoModal } from './components/modals/HistoricoModal';
import { ConcederBonusModal } from './components/modals/ConcederBonusModal';

import { Cliente, Cobranca, Despesa, BonusBeneficio } from './types';

const MainApp: React.FC = () => {
  const { kpis, clientes } = useTotus();
  const { currentUser, isAdmin, isReseller, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Rotula as células das tabelas para o layout em cards do mobile
  useResponsiveTables();

  // Modais State
  const [modalCliente, setModalCliente] = useState<{ open: boolean; cliente?: Cliente | null }>({ open: false });
  const [modalPagamento, setModalPagamento] = useState<{ open: boolean; cobrancaId?: string }>({ open: false });
  const [modalWhatsApp, setModalWhatsApp] = useState<{ open: boolean; cliente?: Cliente; cobranca?: Cobranca; tipoMsg?: string }>({ open: false });
  const [modalPromessa, setModalPromessa] = useState<{ open: boolean; cliente?: Cliente; cobrancaId?: string }>({ open: false });
  const [modalAlterarVenc, setModalAlterarVenc] = useState<{ open: boolean; cliente?: Cliente; cobranca?: Cobranca }>({ open: false });
  const [modalDespesa, setModalDespesa] = useState<{ open: boolean; despesa?: Despesa | null }>({ open: false });
  const [modalHistorico, setModalHistorico] = useState<{ open: boolean; cliente?: Cliente }>({ open: false });
  const [modalBonus, setModalBonus] = useState<{ open: boolean; cliente?: Cliente | null; bonus?: BonusBeneficio | null }>({ open: false });

  // 1. Tela de Carregamento inicial da Sessão
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          color: 'var(--text-main)',
        }}
      >
        <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          TOTUS <span style={{ color: 'var(--accent-primary)' }}>TV</span>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Autenticando sessão segura...
        </div>
      </div>
    );
  }

  // 2. Proteção contra acessos não autenticados: Se não houver usuário logado, exibe Tela de Login
  if (!currentUser) {
    return <LoginPage onSuccess={() => setCurrentPage('dashboard')} />;
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={setCurrentPage}
            onOpenPagamentoModal={(cobId) => setModalPagamento({ open: true, cobrancaId: cobId })}
            onOpenWhatsAppModal={(cli, cob, tipo) => setModalWhatsApp({ open: true, cliente: cli, cobranca: cob, tipoMsg: tipo })}
          />
        );
      case 'clientes':
        return (
          <ClientesPage
            onOpenNovoCliente={() => setModalCliente({ open: true, cliente: null })}
            onEditCliente={(cli) => setModalCliente({ open: true, cliente: cli })}
            onOpenWhatsAppModal={(cli, cob, tipo) => setModalWhatsApp({ open: true, cliente: cli, cobranca: cob, tipoMsg: tipo })}
            onOpenHistoricoModal={(cli) => setModalHistorico({ open: true, cliente: cli })}
            filtroGlobal={globalSearch}
          />
        );
      case 'cobrancas':
        return (
          <CobrancasPage
            onOpenPagamentoModal={(cobId) => setModalPagamento({ open: true, cobrancaId: cobId })}
            onOpenAlterarVencimentoCobranca={(cob, cli) => setModalAlterarVenc({ open: true, cliente: cli, cobranca: cob })}
            onOpenWhatsAppModal={(cli, cob, tipo) => setModalWhatsApp({ open: true, cliente: cli, cobranca: cob, tipoMsg: tipo })}
            onOpenPromessaModal={(cli, cobId) => setModalPromessa({ open: true, cliente: cli, cobrancaId: cobId })}
            onOpenConcederBonusModal={(cli) => setModalBonus({ open: true, cliente: cli || null, bonus: null })}
          />
        );
      case 'bonus':
        return (
          <BonusPage
            onOpenNovoBonus={() => setModalBonus({ open: true, cliente: null, bonus: null })}
            onEditBonus={(b) => setModalBonus({ open: true, cliente: null, bonus: b })}
          />
        );
      case 'financeiro':
        // Rota protegida: Revendedor não acessa financeiro global
        if (!isAdmin) {
          return (
            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Acesso Restrito</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                O financeiro global do Totus TV é reservado para a administração.
              </p>
            </div>
          );
        }
        return <FinanceiroPage />;
      case 'despesas':
        // Rota protegida: Revendedor não visualiza despesas
        if (!isAdmin) {
          return (
            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Acesso Restrito</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                A visualização e cadastro de despesas são exclusivos para administradores.
              </p>
            </div>
          );
        }
        return (
          <DespesasPage
            onOpenNovaDespesa={() => setModalDespesa({ open: true, despesa: null })}
            onEditDespesa={(desp) => setModalDespesa({ open: true, despesa: desp })}
          />
        );
      case 'usuarios':
        // Rota protegida: Equipe & Revendedores
        if (!isAdmin) {
          return (
            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Acesso Restrito</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                Apenas administradores podem gerenciar revendedores e equipe.
              </p>
            </div>
          );
        }
        return <UsuariosPage />;
      case 'relatorios':
        return <RelatoriosPage />;
      case 'configuracoes':
        if (!isAdmin) {
          return (
            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Acesso Restrito</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                As configurações globais do Totus TV são exclusivas do administrador.
              </p>
            </div>
          );
        }
        return <ConfiguracoesPage />;
      case 'historico':
        if (!isAdmin) {
          return (
            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Acesso Restrito</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                O histórico e a trilha de auditoria do sistema são exclusivos de administradores.
              </p>
            </div>
          );
        }
        return <HistoricoPage />;
      case 'whatsapp':
        return <WhatsAppPage />;
      default:
        return <Dashboard onNavigate={setCurrentPage} onOpenPagamentoModal={() => {}} onOpenWhatsAppModal={() => {}} />;
    }
  };

  return (
    <div className="app-container">
      {/* Barra Lateral Navegável */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        aniversariantesCount={kpis.aniversariantesMes.length}
        promessasCount={kpis.prometeramPagar}
      />

      <div className="main-content">
        {/* Cabeçalho */}
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenNovoCliente={() => setModalCliente({ open: true, cliente: null })}
          searchTerm={globalSearch}
          onSearchChange={(val) => {
            setGlobalSearch(val);
            if (currentPage !== 'clientes') setCurrentPage('clientes');
          }}
        />

        {/* Corpo da Página Selecionada */}
        <main className="page-body">
          {renderContent()}
        </main>
      </div>

      {/* Navegação inferior (apenas mobile) */}
      <BottomNav
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onOpenMenu={() => setSidebarOpen(true)}
        promessasCount={kpis.prometeramPagar}
        aniversariantesCount={kpis.aniversariantesMes.length}
      />

      {/* Modais Globais Reativos */}
      {modalCliente.open && (
        <ClienteModal
          cliente={modalCliente.cliente}
          onClose={() => setModalCliente({ open: false })}
        />
      )}

      {modalPagamento.open && modalPagamento.cobrancaId && (
        <PagamentoModal
          cobrancaId={modalPagamento.cobrancaId}
          onClose={() => setModalPagamento({ open: false })}
        />
      )}

      {modalWhatsApp.open && modalWhatsApp.cliente && (
        <WhatsAppModal
          cliente={modalWhatsApp.cliente}
          cobranca={modalWhatsApp.cobranca}
          tipoMsgInicial={modalWhatsApp.tipoMsg}
          onClose={() => setModalWhatsApp({ open: false })}
        />
      )}

      {modalPromessa.open && modalPromessa.cliente && (
        <PromessaModal
          cliente={modalPromessa.cliente}
          cobrancaId={modalPromessa.cobrancaId}
          onClose={() => setModalPromessa({ open: false })}
        />
      )}

      {modalAlterarVenc.open && modalAlterarVenc.cliente && (
        <AlterarVencimentoModal
          cliente={modalAlterarVenc.cliente}
          cobranca={modalAlterarVenc.cobranca}
          onClose={() => setModalAlterarVenc({ open: false })}
        />
      )}

      {modalDespesa.open && (
        <DespesaModal
          despesa={modalDespesa.despesa}
          onClose={() => setModalDespesa({ open: false })}
        />
      )}

      {modalHistorico.open && modalHistorico.cliente && (
        <HistoricoModal
          cliente={modalHistorico.cliente}
          onClose={() => setModalHistorico({ open: false })}
        />
      )}

      {modalBonus.open && (
        <ConcederBonusModal
          cliente={modalBonus.cliente}
          bonusParaEditar={modalBonus.bonus}
          onClose={() => setModalBonus({ open: false })}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </AuthProvider>
  );
}
