import React, { useState, useMemo } from 'react';
import {
  Menu,
  Sun,
  Moon,
  Search,
  Plus,
  Bell,
  CheckCircle2,
  Tv,
  MessageCircle,
  Cake,
  Sparkles,
  AlertCircle,
  Clock,
  Calendar,
  Handshake,
  ChevronRight,
  X,
  ExternalLink,
  DollarSign,
  ArrowRight,
  Gift,
} from 'lucide-react';
import { useTotus } from '../context/AppContext';
import { Cliente, Cobranca } from '../types';
import {
  formatCurrency,
  formatDate,
  cleanWhatsAppNumber,
  formatPhone,
  isToday,
  isTomorrow,
  isPastDate,
  isBirthdayToday,
  isBirthdayThisMonth,
  getDaysUntilBirthday,
  getOverdueDays,
} from '../lib/utils';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenNovoCliente: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onNavigate?: (page: string) => void;
  onOpenWhatsAppModal?: (cliente?: Cliente, cobranca?: Cobranca, tipoMsg?: string) => void;
  onOpenPagamentoModal?: (cobrancaId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenNovoCliente,
  searchTerm,
  onSearchChange,
  onNavigate,
  onOpenWhatsAppModal,
  onOpenPagamentoModal,
}) => {
  const { clientes, cobrancas, config, registrarContato } = useTotus();
  const [isDark, setIsDark] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'tudo' | 'aniversarios' | 'cobrancas' | 'promessas'>('tudo');

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  // Helper para mapa rápido de clientes por ID
  const clientesMap = useMemo(() => {
    const map = new Map<string, Cliente>();
    clientes.forEach(c => map.set(c.id, c));
    return map;
  }, [clientes]);

  // 1. ANIVERSARIANTES
  const aniversariantesHoje = useMemo(() => {
    return clientes.filter(c => c.status === 'ativo' && isBirthdayToday(c.data_nascimento));
  }, [clientes]);

  const aniversariantesMes = useMemo(() => {
    return clientes
      .filter(c => c.status === 'ativo' && isBirthdayThisMonth(c.data_nascimento))
      .sort((a, b) => {
        const diaA = parseInt(a.data_nascimento?.split('-')[2] || '0', 10);
        const diaB = parseInt(b.data_nascimento?.split('-')[2] || '0', 10);
        return diaA - diaB;
      });
  }, [clientes]);

  // 2. COBRANÇAS
  const cobrancasHoje = useMemo(() => {
    return cobrancas.filter(c => c.status === 'pendente' && isToday(c.data_vencimento));
  }, [cobrancas]);

  const cobrancasAtrasadas = useMemo(() => {
    return cobrancas
      .filter(c => c.status === 'pendente' && isPastDate(c.data_vencimento))
      .sort((a, b) => getOverdueDays(b.data_vencimento) - getOverdueDays(a.data_vencimento));
  }, [cobrancas]);

  const cobrancasAmanha = useMemo(() => {
    return cobrancas.filter(c => c.status === 'pendente' && isTomorrow(c.data_vencimento));
  }, [cobrancas]);

  // 3. PROMESSAS DE PAGAMENTO (Cobranças com status prometeu_pagar)
  const promessasHoje = useMemo(() => {
    return cobrancas.filter(c => c.status === 'prometeu_pagar');
  }, [cobrancas]);

  // 4. VENCIMENTOS DO DIA ATUAL EM LOTE (Ex: clientes cujo dia_vencimento coincide com o dia atual do mês)
  const diaHojeNum = new Date().getDate();
  const clientesLoteHoje = useMemo(() => {
    return clientes.filter(c => c.status === 'ativo' && c.dia_vencimento === diaHojeNum);
  }, [clientes, diaHojeNum]);

  // Contadores
  const urgentCount = aniversariantesHoje.length + cobrancasHoje.length + cobrancasAtrasadas.length + promessasHoje.length;
  const totalCount = urgentCount + cobrancasAmanha.length + (aniversariantesMes.length - aniversariantesHoje.length);

  // Abertura direta do WhatsApp com mensagem pronta
  const handleEnviarWhatsApp = (url: string, clienteId?: string, motivo: string = 'Alerta') => {
    if (clienteId) {
      registrarContato({
        cliente_id: clienteId,
        tipo_mensagem: motivo,
        mensagem_texto: `Notificação: ${motivo}`,
        status_envio: 'enviada_manual',
      });
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Gerador de mensagem de aniversário
  const getUrlParabens = (cli: Cliente) => {
    const primeiroNome = cli.nome.trim().split(' ')[0];
    const msg = `Olá, ${primeiroNome}! 🎂🎉\nPassando em nome da equipe Totus TV para lhe desejar um Feliz Aniversário! Muita saúde, paz, conquistas e muitas alegrias no seu dia. Conte sempre conosco!`;
    return `https://wa.me/${cleanWhatsAppNumber(cli.whatsapp)}?text=${encodeURIComponent(msg)}`;
  };

  // Gerador de cobrança hoje
  const getUrlCobrancaHoje = (cli?: Cliente, cob?: Cobranca) => {
    if (!cli) return '#';
    const primeiroNome = cli.nome.trim().split(' ')[0];
    const pix = config.chave_pix ? `\nChave Pix para pagamento: ${config.chave_pix}` : '';
    const msg = `Olá, ${primeiroNome}! Tudo bem? Passando para avisar que sua mensalidade Totus TV vence hoje, dia ${formatDate(cob?.data_vencimento)}. Valor: ${formatCurrency(cob?.valor)}.${pix}`;
    return `https://wa.me/${cleanWhatsAppNumber(cli.whatsapp)}?text=${encodeURIComponent(msg)}`;
  };

  // Gerador de cobrança atrasada
  const getUrlCobrancaAtrasada = (cli?: Cliente, cob?: Cobranca) => {
    if (!cli) return '#';
    const primeiroNome = cli.nome.trim().split(' ')[0];
    const pix = config.chave_pix ? `\nChave Pix: ${config.chave_pix}` : '';
    const msg = `Olá, ${primeiroNome}! Tudo bem? Identifiquei que sua mensalidade Totus TV no valor de ${formatCurrency(cob?.valor)} referente a ${formatDate(cob?.data_vencimento)} está pendente.${pix}\nVocê poderia me informar quando pretende realizar o pagamento?`;
    return `https://wa.me/${cleanWhatsAppNumber(cli.whatsapp)}?text=${encodeURIComponent(msg)}`;
  };

  // Gerador de lembrete amanhã
  const getUrlLembreteAmanha = (cli?: Cliente, cob?: Cobranca) => {
    if (!cli) return '#';
    const primeiroNome = cli.nome.trim().split(' ')[0];
    const msg = `Olá, ${primeiroNome}! Tudo bem? Passando para lembrar que o vencimento da sua mensalidade Totus TV é amanhã, dia ${formatDate(cob?.data_vencimento)} (${formatCurrency(cob?.valor)}). Caso precise de alguma informação, estou à disposição!`;
    return `https://wa.me/${cleanWhatsAppNumber(cli.whatsapp)}?text=${encodeURIComponent(msg)}`;
  };

  // Gerador de confirmação de promessa
  const getUrlPromessa = (cli?: Cliente, cob?: Cobranca) => {
    if (!cli) return '#';
    const primeiroNome = cli.nome.trim().split(' ')[0];
    const pix = config.chave_pix ? `\nChave Pix: ${config.chave_pix}` : '';
    const msg = `Olá, ${primeiroNome}! Tudo bem? Estou passando para confirmar o pagamento de ${formatCurrency(cob?.valor)} que combinamos para hoje referente à sua mensalidade Totus TV.${pix}`;
    return `https://wa.me/${cleanWhatsAppNumber(cli.whatsapp)}?text=${encodeURIComponent(msg)}`;
  };

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

          {/* Barra de Busca Global (desktop) */}
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
          {/* Central de Notificações Aprimorada */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="btn btn-secondary btn-icon"
              style={{ position: 'relative' }}
              title="Central de Avisos e Notificações"
              id="btn-notificacoes"
            >
              <Bell size={18} />
              {totalCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    minWidth: '18px',
                    height: '18px',
                    padding: '0 4px',
                    backgroundColor: urgentCount > 0 ? '#ef4444' : '#f59e0b',
                    color: '#ffffff',
                    borderRadius: '10px',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--bg-secondary)',
                    boxShadow: urgentCount > 0 ? '0 0 10px rgba(239, 68, 68, 0.6)' : 'none',
                  }}
                >
                  {totalCount > 99 ? '99+' : totalCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div className="notif-backdrop" onClick={() => setShowNotifications(false)} />
                <div className="notif-dropdown">
                  {/* Cabeçalho do Dropdown */}
                  <div className="notif-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: urgentCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: urgentCount > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Bell size={15} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                            Central de Notificações
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {urgentCount > 0 ? `${urgentCount} pendência(s) prioritária(s)` : 'Tudo sob controle'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          className={`badge ${urgentCount > 0 ? 'badge-atrasado' : 'badge-em-dia'}`}
                          style={{ fontSize: '0.75rem', fontWeight: 700 }}
                        >
                          {totalCount} alerta(s)
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowNotifications(false)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Fechar"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Abas de Filtro da Notificação */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '4px',
                        background: 'var(--bg-tertiary)',
                        padding: '3px',
                        borderRadius: '8px',
                        overflowX: 'auto',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setAbaAtiva('tudo')}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: abaAtiva === 'tudo' ? 700 : 500,
                          cursor: 'pointer',
                          background: abaAtiva === 'tudo' ? 'var(--bg-secondary)' : 'transparent',
                          color: abaAtiva === 'tudo' ? 'var(--accent-primary)' : 'var(--text-muted)',
                          boxShadow: abaAtiva === 'tudo' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Tudo ({totalCount})
                      </button>

                      <button
                        type="button"
                        onClick={() => setAbaAtiva('aniversarios')}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: abaAtiva === 'aniversarios' ? 700 : 500,
                          cursor: 'pointer',
                          background: abaAtiva === 'aniversarios' ? 'var(--bg-secondary)' : 'transparent',
                          color: abaAtiva === 'aniversarios' ? '#ec4899' : 'var(--text-muted)',
                          boxShadow: abaAtiva === 'aniversarios' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>🎂 Niver</span>
                        <span>({aniversariantesMes.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAbaAtiva('cobrancas')}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: abaAtiva === 'cobrancas' ? 700 : 500,
                          cursor: 'pointer',
                          background: abaAtiva === 'cobrancas' ? 'var(--bg-secondary)' : 'transparent',
                          color: abaAtiva === 'cobrancas' ? 'var(--accent-rose)' : 'var(--text-muted)',
                          boxShadow: abaAtiva === 'cobrancas' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>🚨 Cobranças</span>
                        <span>({cobrancasHoje.length + cobrancasAtrasadas.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAbaAtiva('promessas')}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: abaAtiva === 'promessas' ? 700 : 500,
                          cursor: 'pointer',
                          background: abaAtiva === 'promessas' ? 'var(--bg-secondary)' : 'transparent',
                          color: abaAtiva === 'promessas' ? '#3b82f6' : 'var(--text-muted)',
                          boxShadow: abaAtiva === 'promessas' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>🤝 Promessas</span>
                        <span>({promessasHoje.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Corpo Rolável dos Alertas */}
                  <div className="notif-body">
                    {/* 1. SEÇÃO DE ANIVERSARIANTES DE HOJE (Prioridade Máxima) */}
                    {(abaAtiva === 'tudo' || abaAtiva === 'aniversarios') && aniversariantesHoje.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Sparkles size={14} />
                          <span>Aniversariante(s) de Hoje ({aniversariantesHoje.length})</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {aniversariantesHoje.map(cli => (
                            <div key={`niver-hoje-${cli.id}`} className="notif-item notif-bday-today">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ fontSize: '1.4rem' }}>🎂</div>
                                  <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                      {cli.nome}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                      {formatPhone(cli.whatsapp)} • Mensalidade: <strong>{formatCurrency(cli.valor_mensalidade)}</strong> (Venc. dia {cli.dia_vencimento})
                                    </div>
                                  </div>
                                </div>
                                <span className="badge" style={{ backgroundColor: '#f59e0b', color: '#000', fontWeight: 800, fontSize: '0.7rem' }}>
                                  🎉 É HOJE!
                                </span>
                              </div>

                              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleEnviarWhatsApp(getUrlParabens(cli), cli.id, 'Parabéns Aniversário')}
                                  className="btn btn-primary"
                                  style={{
                                    flex: 1,
                                    height: '34px',
                                    backgroundColor: '#25d366',
                                    borderColor: '#25d366',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    padding: '0 10px',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)',
                                  }}
                                >
                                  <MessageCircle size={15} />
                                  <span>Enviar Parabéns (WhatsApp)</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. SEÇÃO DE PROMESSAS DE PAGAMENTO PARA HOJE */}
                    {(abaAtiva === 'tudo' || abaAtiva === 'promessas') && promessasHoje.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Handshake size={14} />
                          <span>Promessas para Hoje ({promessasHoje.length})</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {promessasHoje.map(cob => {
                            const cli = clientesMap.get(cob.cliente_id);
                            return (
                              <div key={`promessa-${cob.id}`} className="notif-item notif-card-promise">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                                      {cli ? cli.nome : 'Cliente #' + cob.cliente_id}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                      Prometeu pagar hoje • Valor: <strong style={{ color: 'var(--accent-emerald)' }}>{formatCurrency(cob.valor)}</strong>
                                    </div>
                                  </div>
                                  <span className="badge badge-pendente" style={{ fontSize: '0.7rem' }}>
                                    Promessa Hoje
                                  </span>
                                </div>

                                <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                                  {cli && (
                                    <button
                                      type="button"
                                      onClick={() => handleEnviarWhatsApp(getUrlPromessa(cli, cob), cli.id, 'Confirmação de Promessa')}
                                      className="btn btn-secondary"
                                      style={{ flex: 1, height: '30px', fontSize: '0.75rem', color: '#25d366', fontWeight: 600, padding: '0 8px', justifyContent: 'center' }}
                                    >
                                      <MessageCircle size={14} />
                                      <span>Cobrar Promessa</span>
                                    </button>
                                  )}
                                  {onOpenPagamentoModal && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setShowNotifications(false);
                                        onOpenPagamentoModal(cob.id);
                                      }}
                                      className="btn btn-secondary"
                                      style={{ height: '30px', fontSize: '0.75rem', padding: '0 8px' }}
                                    >
                                      Receber
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 3. SEÇÃO DE COBRANÇAS VENCENDO HOJE */}
                    {(abaAtiva === 'tudo' || abaAtiva === 'cobrancas') && cobrancasHoje.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <AlertCircle size={14} />
                          <span>Vencem Hoje ({cobrancasHoje.length})</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {cobrancasHoje.map(cob => {
                            const cli = clientesMap.get(cob.cliente_id);
                            return (
                              <div key={`vence-hoje-${cob.id}`} className="notif-item notif-card-today">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                                      {cli ? cli.nome : 'Cliente #' + cob.cliente_id}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                      {cli ? formatPhone(cli.whatsapp) : ''} • Valor: <strong style={{ color: 'var(--text-main)' }}>{formatCurrency(cob.valor)}</strong>
                                    </div>
                                  </div>
                                  <span className="badge badge-pendente" style={{ fontSize: '0.7rem' }}>
                                    Vence Hoje
                                  </span>
                                </div>

                                <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                                  {cli && (
                                    <button
                                      type="button"
                                      onClick={() => handleEnviarWhatsApp(getUrlCobrancaHoje(cli, cob), cli.id, 'Lembrete Vencimento Hoje')}
                                      className="btn btn-secondary"
                                      style={{ flex: 1, height: '30px', fontSize: '0.75rem', color: '#25d366', fontWeight: 600, padding: '0 8px', justifyContent: 'center' }}
                                    >
                                      <MessageCircle size={14} />
                                      <span>Enviar WhatsApp</span>
                                    </button>
                                  )}
                                  {onOpenPagamentoModal && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setShowNotifications(false);
                                        onOpenPagamentoModal(cob.id);
                                      }}
                                      className="btn btn-secondary"
                                      style={{ height: '30px', fontSize: '0.75rem', padding: '0 8px' }}
                                    >
                                      Receber
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 4. SEÇÃO DE COBRANÇAS ATRASADAS / PENDENTES */}
                    {(abaAtiva === 'tudo' || abaAtiva === 'cobrancas') && cobrancasAtrasadas.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-rose)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} />
                          <span>Cobranças Atrasadas ({cobrancasAtrasadas.length})</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {cobrancasAtrasadas.map(cob => {
                            const cli = clientesMap.get(cob.cliente_id);
                            const diasAtraso = getOverdueDays(cob.data_vencimento);
                            return (
                              <div key={`atrasada-${cob.id}`} className="notif-item notif-card-overdue">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                                      {cli ? cli.nome : 'Cliente #' + cob.cliente_id}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                      Venceu {formatDate(cob.data_vencimento)} • Valor: <strong style={{ color: 'var(--accent-rose)' }}>{formatCurrency(cob.valor)}</strong>
                                    </div>
                                  </div>
                                  <span className="badge badge-atrasado" style={{ fontSize: '0.7rem' }}>
                                    {diasAtraso === 1 ? '1 dia atrasado' : `${diasAtraso} dias atrasado`}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                                  {cli && (
                                    <button
                                      type="button"
                                      onClick={() => handleEnviarWhatsApp(getUrlCobrancaAtrasada(cli, cob), cli.id, 'Cobrança Fatura Atrasada')}
                                      className="btn btn-secondary"
                                      style={{ flex: 1, height: '30px', fontSize: '0.75rem', color: '#25d366', fontWeight: 600, padding: '0 8px', justifyContent: 'center' }}
                                    >
                                      <MessageCircle size={14} />
                                      <span>Cobrar WhatsApp</span>
                                    </button>
                                  )}
                                  {onOpenPagamentoModal && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setShowNotifications(false);
                                        onOpenPagamentoModal(cob.id);
                                      }}
                                      className="btn btn-secondary"
                                      style={{ height: '30px', fontSize: '0.75rem', padding: '0 8px' }}
                                    >
                                      Receber
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 5. SEÇÃO DE ANIVERSARIANTES DO MÊS (Lista Completa) */}
                    {(abaAtiva === 'tudo' || abaAtiva === 'aniversarios') && aniversariantesMes.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Cake size={14} />
                          <span>Aniversariantes do Mês Atual ({aniversariantesMes.length})</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {aniversariantesMes.map(cli => {
                            const diaNiver = cli.data_nascimento?.split('-')[2];
                            const diasFaltando = getDaysUntilBirthday(cli.data_nascimento);
                            const ehHoje = isBirthdayToday(cli.data_nascimento);

                            return (
                              <div
                                key={`niver-mes-${cli.id}`}
                                className={`notif-item ${ehHoje ? 'notif-bday-today' : ''}`}
                                style={{
                                  borderLeft: ehHoje ? '3px solid #f59e0b' : '3px solid #ec4899',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span>{cli.nome}</span>
                                      {ehHoje && <span style={{ fontSize: '0.75rem' }}>🎉</span>}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                      Aniversário: <strong>Dia {diaNiver}</strong> • {formatPhone(cli.whatsapp)}
                                    </div>
                                  </div>

                                  <div>
                                    {ehHoje ? (
                                      <span className="badge" style={{ backgroundColor: '#f59e0b', color: '#000', fontWeight: 800, fontSize: '0.7rem' }}>
                                        HOJE!
                                      </span>
                                    ) : diasFaltando !== null && diasFaltando > 0 ? (
                                      <span className="badge badge-em-dia" style={{ fontSize: '0.7rem' }}>
                                        Em {diasFaltando} dia(s)
                                      </span>
                                    ) : (
                                      <span className="badge badge-inativo" style={{ fontSize: '0.7rem' }}>
                                        Já passou (Dia {diaNiver})
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleEnviarWhatsApp(getUrlParabens(cli), cli.id, 'Parabéns Aniversariante')}
                                    className="btn btn-secondary"
                                    style={{ flex: 1, height: '30px', fontSize: '0.75rem', color: '#25d366', fontWeight: 600, padding: '0 8px', justifyContent: 'center' }}
                                  >
                                    <MessageCircle size={14} />
                                    <span>{ehHoje ? 'Parabenizar Hoje' : 'Mensagem no WhatsApp'}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 6. LEMBRETE PREVENTIVO: VENCEM AMANHÃ */}
                    {(abaAtiva === 'tudo' || abaAtiva === 'cobrancas') && cobrancasAmanha.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} />
                          <span>Vencem Amanhã - Lembrete Preventivo ({cobrancasAmanha.length})</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {cobrancasAmanha.map(cob => {
                            const cli = clientesMap.get(cob.cliente_id);
                            return (
                              <div key={`vence-amanha-${cob.id}`} className="notif-item" style={{ borderLeft: '3px solid #8b5cf6' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                                      {cli ? cli.nome : 'Cliente #' + cob.cliente_id}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                      Vence amanhã ({formatDate(cob.data_vencimento)}) • {formatCurrency(cob.valor)}
                                    </div>
                                  </div>
                                  <span className="badge" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', fontSize: '0.7rem' }}>
                                    Amanhã
                                  </span>
                                </div>

                                {cli && (
                                  <button
                                    type="button"
                                    onClick={() => handleEnviarWhatsApp(getUrlLembreteAmanha(cli, cob), cli.id, 'Lembrete Vencimento Amanhã')}
                                    className="btn btn-secondary"
                                    style={{ height: '30px', fontSize: '0.75rem', color: '#25d366', fontWeight: 600, padding: '0 8px', justifyContent: 'center', marginTop: '2px' }}
                                  >
                                    <MessageCircle size={14} />
                                    <span>Lembrete Preventivo (WhatsApp)</span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Alerta de Lote de Vencimento do Dia (ex: Dia 10) */}
                    {clientesLoteHoje.length > 0 && abaAtiva === 'tudo' && (
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: '#3b82f6' }}>
                            📅 Lote de Vencimento Dia {diaHojeNum}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {clientesLoteHoje.length} clientes têm o vencimento fixo cadastrado para hoje.
                          </div>
                        </div>

                        {onNavigate && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowNotifications(false);
                              onNavigate('whatsapp');
                            }}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '4px 8px', height: '28px' }}
                          >
                            Filtrar
                          </button>
                        )}
                      </div>
                    )}

                    {/* Estado Vazio quando não há notificações na aba */}
                    {totalCount === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--text-subtle)', padding: '28px 12px' }}>
                        <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                          Tudo em dia para hoje!
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Nenhuma cobrança atrasada, vencimento urgente ou aniversário pendente.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rodapé com Ações Rápidas */}
                  <div className="notif-footer">
                    {onNavigate && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNotifications(false);
                            onNavigate('whatsapp');
                          }}
                          className="btn btn-secondary"
                          style={{
                            flex: 1,
                            fontSize: '0.775rem',
                            padding: '0 8px',
                            height: '34px',
                            justifyContent: 'center',
                            color: '#25d366',
                            fontWeight: 600,
                          }}
                        >
                          <MessageCircle size={14} />
                          <span>Disparos WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowNotifications(false);
                            onNavigate('cobrancas');
                          }}
                          className="btn btn-secondary"
                          style={{
                            flex: 1,
                            fontSize: '0.775rem',
                            padding: '0 8px',
                            height: '34px',
                            justifyContent: 'center',
                          }}
                        >
                          <span>Ver Cobranças</span>
                          <ArrowRight size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowNotifications(false);
                            onNavigate('bonus');
                          }}
                          className="btn btn-secondary btn-icon"
                          title="Ver Bônus & Aniversariantes"
                          style={{ height: '34px', width: '34px' }}
                        >
                          <Gift size={15} color="#ec4899" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Alternar Tema Claro / Escuro */}
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
