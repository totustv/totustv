import React, { useState, useMemo } from 'react';
import {
  MessageCircle,
  Plus,
  Send,
  Edit2,
  Trash2,
  Copy,
  Check,
  CheckSquare,
  Square,
  Search,
  Filter,
  Calendar,
  Clock,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  User,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  ListOrdered,
  X,
  Play,
  ArrowRight,
} from 'lucide-react';
import { useTotus } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Cliente, Cobranca, ModeloMensagem } from '../types';
import { formatCurrency, formatDate, cleanWhatsAppNumber, formatPhone, isToday, isTomorrow, isPastDate } from '../lib/utils';

export const WhatsAppPage: React.FC = () => {
  const {
    clientes,
    cobrancas,
    config,
    modelosMensagem,
    salvarModeloMensagem,
    deletarModeloMensagem,
    resetarModelosPadrao,
    registrarContato,
  } = useTotus();
  const { isAdmin, currentUser } = useAuth();

  // Abas principais: "Disparar Mensagens" e "Modelos & Lembretes"
  const [abaAtiva, setAbaAtiva] = useState<'disparo' | 'modelos'>('disparo');

  // Filtros de seleção de contatos
  const [filtroDiaVencimento, setFiltroDiaVencimento] = useState<string>('todos'); // 'todos', '5', '10', '15', '20', '25', '30'
  const [filtroStatusCobranca, setFiltroStatusCobranca] = useState<string>('todos'); // 'todos', 'vencem_hoje', 'vencem_amanha', 'atrasados', 'pendentes', 'pagos'
  const [busca, setBusca] = useState<string>('');

  // Modelo de mensagem selecionado para o disparo
  const [modeloSelecionadoId, setModeloSelecionadoId] = useState<string>(
    modelosMensagem.length > 0 ? modelosMensagem[0].id : 'mod-1'
  );

  // Seleção de clientes (IDs dos clientes com checkbox marcado)
  const [clientesSelecionados, setClientesSelecionados] = useState<Set<string>>(new Set());

  // Estados de cópia e feedback
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  // Modal de Adicionar / Editar Modelo
  const [modalModelo, setModalModelo] = useState<{
    open: boolean;
    modelo: Partial<ModeloMensagem> | null;
  }>({ open: false, modelo: null });

  // Modal / Assistente de Disparo em Fila
  const [modalFila, setModalFila] = useState<{
    open: boolean;
    indiceAtual: number;
    enviados: Set<string>;
  }>({ open: false, indiceAtual: 0, enviados: new Set() });

  // Lista de dias de vencimento presentes nos clientes cadastrados
  const diasDisponiveis = useMemo(() => {
    const setDias = new Set<number>();
    clientes.forEach(c => {
      if (c.dia_vencimento) setDias.add(c.dia_vencimento);
    });
    // Garante que dias tradicionais apareçam
    [5, 10, 15, 20, 25, 30].forEach(d => setDias.add(d));
    return Array.from(setDias).sort((a, b) => a - b);
  }, [clientes]);

  // Modelo atual ativo
  const modeloAtual = useMemo(() => {
    return (
      modelosMensagem.find(m => m.id === modeloSelecionadoId) ||
      modelosMensagem[0] || {
        id: 'fallback',
        titulo: 'Mensagem',
        texto: 'Olá, {NOME}!',
        categoria: 'geral',
      }
    );
  }, [modelosMensagem, modeloSelecionadoId]);

  // Mapear clientes com a sua cobrança ativa mais recente
  const clientesComDados = useMemo(() => {
    return clientes.map(cli => {
      const cobs = cobrancas
        .filter(c => c.cliente_id === cli.id)
        .sort((a, b) => {
          if (b.competencia_ano !== a.competencia_ano) return b.competencia_ano - a.competencia_ano;
          return b.competencia_mes - a.competencia_mes;
        });
      const cobrancaAtual = cobs[0];
      return { cli, cobrancaAtual };
    });
  }, [clientes, cobrancas]);

  // Filtrar clientes conforme os seletores
  const clientesFiltrados = useMemo(() => {
    return clientesComDados.filter(({ cli, cobrancaAtual }) => {
      // 1. Filtro por Dia de Vencimento
      if (filtroDiaVencimento !== 'todos') {
        const diaNum = Number(filtroDiaVencimento);
        if (cli.dia_vencimento !== diaNum) return false;
      }

      // 2. Filtro por Status da Cobrança
      if (filtroStatusCobranca !== 'todos' && cobrancaAtual) {
        if (filtroStatusCobranca === 'vencem_hoje') {
          if (!isToday(cobrancaAtual.data_vencimento) || cobrancaAtual.status === 'pago') return false;
        } else if (filtroStatusCobranca === 'vencem_amanha') {
          if (!isTomorrow(cobrancaAtual.data_vencimento) || cobrancaAtual.status === 'pago') return false;
        } else if (filtroStatusCobranca === 'atrasados') {
          if (cobrancaAtual.status !== 'atrasado' && !isPastDate(cobrancaAtual.data_vencimento) && cobrancaAtual.status !== 'pago') return false;
        } else if (filtroStatusCobranca === 'pendentes') {
          if (cobrancaAtual.status !== 'pendente' && cobrancaAtual.status !== 'avisado' && cobrancaAtual.status !== 'atrasado') return false;
        } else if (filtroStatusCobranca === 'pagos') {
          if (cobrancaAtual.status !== 'pago') return false;
        }
      }

      // 3. Busca textual
      if (busca.trim()) {
        const q = busca.toLowerCase().trim();
        const matchNome = cli.nome.toLowerCase().includes(q);
        const matchTel = cli.whatsapp.includes(q);
        if (!matchNome && !matchTel) return false;
      }

      return true;
    });
  }, [clientesComDados, filtroDiaVencimento, filtroStatusCobranca, busca]);

  // Helper para interpolar variáveis no texto
  const interpolarTexto = (template: string, cli: Cliente, cob?: Cobranca) => {
    const primeiroNome = cli.nome.trim().split(' ')[0] || cli.nome;
    const valorStr = cob ? formatCurrency(cob.valor) : formatCurrency(cli.valor_mensalidade);
    const dataStr = cob ? formatDate(cob.data_vencimento) : `dia ${cli.dia_vencimento}`;

    return template
      .replace(/\{NOME\}/g, primeiroNome)
      .replace(/\{DATA\}/g, dataStr)
      .replace(/\{VALOR\}/g, valorStr)
      .replace(/\{PIX\}/g, config.chave_pix || 'Chave Pix não configurada')
      .replace(/\{VENCIMENTO_DIA\}/g, String(cli.dia_vencimento));
  };

  // Disparo individual direto para um cliente
  const handleDispararIndividual = (cli: Cliente, cob?: Cobranca) => {
    const texto = interpolarTexto(modeloAtual.texto, cli, cob);
    registrarContato({
      cliente_id: cli.id,
      cobranca_id: cob?.id,
      tipo_mensagem: modeloAtual.categoria,
      mensagem_texto: texto,
      status_envio: 'enviada_manual',
    });

    const num = cleanWhatsAppNumber(cli.whatsapp);
    const url = `https://wa.me/${num}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');

    mostrarToast(`WhatsApp aberto para ${cli.nome}!`);
  };

  // Copiar mensagem interpolada
  const handleCopiarMensagem = (cli: Cliente, cob?: Cobranca) => {
    const texto = interpolarTexto(modeloAtual.texto, cli, cob);
    navigator.clipboard.writeText(texto);
    setCopiadoId(cli.id);
    setTimeout(() => setCopiadoId(null), 2000);
    mostrarToast('Mensagem copiada para a área de transferência!');
  };

  const mostrarToast = (msg: string) => {
    setToastFeedback(msg);
    setTimeout(() => setToastFeedback(null), 3000);
  };

  // Toggle de seleção de todos os visíveis
  const handleToggleSelecionarTodos = () => {
    if (clientesSelecionados.size === clientesFiltrados.length && clientesFiltrados.length > 0) {
      setClientesSelecionados(new Set());
    } else {
      const novos = new Set<string>();
      clientesFiltrados.forEach(c => novos.add(c.cli.id));
      setClientesSelecionados(novos);
    }
  };

  // Toggle individual de cliente
  const handleToggleCliente = (id: string) => {
    const novos = new Set(clientesSelecionados);
    if (novos.has(id)) {
      novos.delete(id);
    } else {
      novos.add(id);
    }
    setClientesSelecionados(novos);
  };

  // Iniciar Fila de Disparo para os selecionados
  const handleIniciarFila = () => {
    if (clientesSelecionados.size === 0) {
      alert('Selecione ao menos um cliente para iniciar o envio.');
      return;
    }
    setModalFila({
      open: true,
      indiceAtual: 0,
      enviados: new Set(),
    });
  };

  // Lista dos clientes atualmente selecionados para a fila
  const clientesFila = useMemo(() => {
    return clientesComDados.filter(c => clientesSelecionados.has(c.cli.id));
  }, [clientesComDados, clientesSelecionados]);

  // Avançar no assistente de fila
  const handleFilaEnviarEAvancar = () => {
    const atual = clientesFila[modalFila.indiceAtual];
    if (!atual) return;

    handleDispararIndividual(atual.cli, atual.cobrancaAtual);

    const novosEnviados = new Set(modalFila.enviados);
    novosEnviados.add(atual.cli.id);

    if (modalFila.indiceAtual + 1 < clientesFila.length) {
      setModalFila({
        ...modalFila,
        indiceAtual: modalFila.indiceAtual + 1,
        enviados: novosEnviados,
      });
    } else {
      // Concluiu todos
      setModalFila({
        open: false,
        indiceAtual: 0,
        enviados: novosEnviados,
      });
      mostrarToast(`Envio concluído para todos os ${clientesFila.length} contatos selecionados!`);
    }
  };

  // Salvar novo/editado modelo
  const handleSalvarModelo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalModelo.modelo?.titulo || !modalModelo.modelo?.texto) {
      alert('Preencha o título e o texto da mensagem.');
      return;
    }
    salvarModeloMensagem({
      id: modalModelo.modelo.id,
      titulo: modalModelo.modelo.titulo,
      texto: modalModelo.modelo.texto,
      categoria: modalModelo.modelo.categoria || 'geral',
      dia_vencimento_alvo: modalModelo.modelo.dia_vencimento_alvo,
    });
    setModalModelo({ open: false, modelo: null });
    mostrarToast('Modelo de mensagem salvo com sucesso!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Feedback Flutuante */}
      {toastFeedback && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#10b981',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 700,
            fontSize: '0.875rem',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{toastFeedback}</span>
        </div>
      )}

      {/* Top Header da Página */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'rgba(37, 211, 102, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#25d366',
              }}
            >
              <MessageCircle size={22} />
            </div>
            WhatsApp & Cobrança
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Disparo ágil de lembretes, cobranças por data de vencimento e personalização de mensagens prontas.
          </p>
        </div>

        {/* Abas Alternadoras no Topo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-tertiary)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={() => setAbaAtiva('disparo')}
              className={`btn ${abaAtiva === 'disparo' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.85rem',
                border: 'none',
              }}
            >
              <Send size={15} />
              <span>Disparar Mensagens</span>
            </button>
            <button
              onClick={() => setAbaAtiva('modelos')}
              className={`btn ${abaAtiva === 'modelos' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.85rem',
                border: 'none',
              }}
            >
              <Edit2 size={15} />
              <span>Modelos & Lembretes</span>
              <span className="badge badge-em-dia" style={{ marginLeft: '4px', fontSize: '0.7rem' }}>
                {modelosMensagem.length}
              </span>
            </button>
          </div>

          <button
            onClick={() =>
              setModalModelo({
                open: true,
                modelo: {
                  titulo: '',
                  texto: 'Olá, {NOME}! Tudo bem? Passando para avisar...',
                  categoria: 'lembrete',
                  dia_vencimento_alvo: filtroDiaVencimento !== 'todos' ? Number(filtroDiaVencimento) : undefined,
                },
              })
            }
            className="btn btn-primary"
            style={{ backgroundColor: '#25d366', borderColor: '#25d366' }}
            id="btn-novo-modelo-whatsapp"
          >
            <Plus size={16} />
            <span>Novo Lembrete</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          ABA 1: DISPARAR MENSAGENS (FILTRO POR VENCIMENTO & SELEÇÃO DE CONTATOS)
          ========================================================================= */}
      {abaAtiva === 'disparo' && (
        <>
          {/* Card 1: Seleção de Modelo & Filtro por Vencimento */}
          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="var(--accent-primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>1. Escolha a Mensagem Pronta que deseja Enviar:</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  value={modeloSelecionadoId}
                  onChange={e => {
                    const novoId = e.target.value;
                    setModeloSelecionadoId(novoId);
                    const mod = modelosMensagem.find(m => m.id === novoId);
                    // Se o modelo tem um dia específico atrelado, sugere filtrar por ele
                    if (mod?.dia_vencimento_alvo) {
                      setFiltroDiaVencimento(String(mod.dia_vencimento_alvo));
                    }
                  }}
                  className="form-control"
                  style={{ minWidth: '280px', fontWeight: 600, height: '40px' }}
                >
                  {modelosMensagem.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.titulo} {m.dia_vencimento_alvo ? `(Foco Dia ${m.dia_vencimento_alvo})` : ''}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setModalModelo({ open: true, modelo: modeloAtual })}
                  className="btn btn-secondary btn-icon"
                  title="Editar este modelo de mensagem"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            </div>

            {/* Preview do Modelo Selecionado */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
                color: 'var(--text-main)',
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#25d366', textTransform: 'uppercase' }}>
                  💬 Prévia do Modelo Selecionado:
                </span>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>
                  Tags dinâmicas: <code>{'{NOME}'}</code>, <code>{'{DATA}'}</code>, <code>{'{VALOR}'}</code>, <code>{'{PIX}'}</code>
                </span>
              </div>
              <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-muted)' }}>
                "{modeloAtual.texto}"
              </p>
            </div>

            {/* Filtro Rápido por Dia de Vencimento (Destaque Principal) */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}
              >
                <Calendar size={14} color="var(--accent-primary)" />
                2. Selecionar Vencimento dos Clientes (Ex: Apenas Vencimento Dia 10):
              </label>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setFiltroDiaVencimento('todos')}
                  className={`btn ${filtroDiaVencimento === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '0.825rem' }}
                >
                  Todos os Dias ({clientes.length})
                </button>

                {diasDisponiveis.map(dia => {
                  const qtd = clientes.filter(c => c.dia_vencimento === dia).length;
                  const ativo = filtroDiaVencimento === String(dia);
                  return (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => setFiltroDiaVencimento(String(dia))}
                      className={`btn ${ativo ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        borderRadius: '20px',
                        padding: '6px 14px',
                        fontSize: '0.825rem',
                        backgroundColor: ativo ? 'var(--accent-primary)' : undefined,
                        borderColor: ativo ? 'var(--accent-primary)' : undefined,
                      }}
                    >
                      <span>Vencimento Dia {dia}</span>
                      <span
                        style={{
                          marginLeft: '6px',
                          fontSize: '0.7rem',
                          padding: '1px 6px',
                          borderRadius: '10px',
                          backgroundColor: ativo ? 'rgba(255,255,255,0.25)' : 'var(--bg-tertiary)',
                          color: ativo ? '#ffffff' : 'var(--text-muted)',
                          fontWeight: 700,
                        }}
                      >
                        {qtd}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Barra de Filtros Complementares: Busca e Status */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-subtle)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar contato por nome ou WhatsApp..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }}
                />
              </div>

              <select
                value={filtroStatusCobranca}
                onChange={e => setFiltroStatusCobranca(e.target.value)}
                className="form-control"
                style={{ width: '200px', height: '38px', fontSize: '0.85rem' }}
              >
                <option value="todos">Todos os Status</option>
                <option value="vencem_hoje">🚨 Vencem Hoje</option>
                <option value="vencem_amanha">⏰ Vencem Amanhã</option>
                <option value="atrasados">❌ Atrasados / Inadimplentes</option>
                <option value="pendentes">⏳ Pendentes em Aberto</option>
                <option value="pagos">✓ Pagos</option>
              </select>
            </div>
          </div>

          {/* Card 2: Barra de Ações em Massa & Tabela de Contatos */}
          <div className="card" style={{ padding: '20px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleToggleSelecionarTodos}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.825rem', padding: '6px 12px' }}
                >
                  {clientesSelecionados.size === clientesFiltrados.length && clientesFiltrados.length > 0 ? (
                    <>
                      <CheckSquare size={16} color="var(--accent-primary)" />
                      <span>Desmarcar Todos</span>
                    </>
                  ) : (
                    <>
                      <Square size={16} />
                      <span>Selecionar Todos ({clientesFiltrados.length})</span>
                    </>
                  )}
                </button>

                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <strong>{clientesSelecionados.size}</strong> de <strong>{clientesFiltrados.length}</strong> contatos selecionados
                </span>
              </div>

              {/* Botão de Disparo em Lote / Assistente de Fila */}
              <button
                type="button"
                onClick={handleIniciarFila}
                disabled={clientesSelecionados.size === 0}
                className="btn btn-primary"
                style={{
                  backgroundColor: clientesSelecionados.size > 0 ? '#25d366' : undefined,
                  borderColor: clientesSelecionados.size > 0 ? '#25d366' : undefined,
                  fontWeight: 700,
                  boxShadow: clientesSelecionados.size > 0 ? '0 4px 14px rgba(37, 211, 102, 0.35)' : undefined,
                }}
                id="btn-disparar-selecionados"
              >
                <Play size={16} />
                <span>Disparar para {clientesSelecionados.size} Selecionado(s)</span>
              </button>
            </div>

            {/* Listagem Responsiva de Clientes */}
            {clientesFiltrados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-subtle)' }}>
                <AlertCircle size={36} style={{ margin: '0 auto 10px', opacity: 0.6 }} />
                <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Nenhum contato encontrado com os filtros aplicados.</p>
                <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                  Experimente mudar o filtro de dia de vencimento ou limpar a busca.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={clientesSelecionados.size === clientesFiltrados.length && clientesFiltrados.length > 0}
                          onChange={handleToggleSelecionarTodos}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          title="Selecionar todos os clientes listados"
                        />
                      </th>
                      <th>Cliente</th>
                      <th>WhatsApp</th>
                      <th>Dia Vencimento</th>
                      <th>Mensalidade</th>
                      <th>Situação Fatura</th>
                      <th style={{ textAlign: 'right' }}>Ações Rápidas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesFiltrados.map(({ cli, cobrancaAtual }) => {
                      const selecionado = clientesSelecionados.has(cli.id);
                      const textoMensagem = interpolarTexto(modeloAtual.texto, cli, cobrancaAtual);

                      let badgeStatus = null;
                      if (cobrancaAtual) {
                        if (cobrancaAtual.status === 'pago') {
                          badgeStatus = <span className="badge badge-em-dia">Pago</span>;
                        } else if (isToday(cobrancaAtual.data_vencimento)) {
                          badgeStatus = <span className="badge badge-pendente">Vence Hoje!</span>;
                        } else if (isTomorrow(cobrancaAtual.data_vencimento)) {
                          badgeStatus = <span className="badge badge-pendente">Vence Amanhã</span>;
                        } else if (cobrancaAtual.status === 'atrasado' || isPastDate(cobrancaAtual.data_vencimento)) {
                          badgeStatus = <span className="badge badge-atrasado">Atrasado</span>;
                        } else {
                          badgeStatus = <span className="badge badge-pendente">Pendente</span>;
                        }
                      }

                      return (
                        <tr
                          key={cli.id}
                          style={{
                            backgroundColor: selecionado ? 'rgba(37, 211, 102, 0.05)' : undefined,
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={selecionado}
                              onChange={() => handleToggleCliente(cli.id)}
                              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                            />
                          </td>

                          {/* Nome e Avatar */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  backgroundColor: 'var(--bg-tertiary)',
                                  color: 'var(--accent-primary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                }}
                              >
                                {cli.nome.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                  {cli.nome}
                                </div>
                                {cli.cidade && (
                                  <div style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>
                                    {cli.cidade} {cli.estado ? `- ${cli.estado}` : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* WhatsApp */}
                          <td>
                            <a
                              href={`https://wa.me/${cleanWhatsAppNumber(cli.whatsapp)}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: '#25d366',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <MessageCircle size={14} />
                              {formatPhone(cli.whatsapp)}
                            </a>
                          </td>

                          {/* Dia do Vencimento */}
                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '8px',
                                backgroundColor: cli.dia_vencimento === 10 ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-tertiary)',
                                color: cli.dia_vencimento === 10 ? 'var(--accent-primary)' : 'var(--text-main)',
                                fontWeight: 700,
                                fontSize: '0.825rem',
                              }}
                            >
                              <Calendar size={13} />
                              Dia {cli.dia_vencimento}
                            </span>
                          </td>

                          {/* Valor da Mensalidade */}
                          <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {formatCurrency(cli.valor_mensalidade)}
                          </td>

                          {/* Status da Fatura */}
                          <td>{badgeStatus || <span className="badge badge-em-dia">Sem pendências</span>}</td>

                          {/* Ações */}
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleCopiarMensagem(cli, cobrancaAtual)}
                                className="btn btn-secondary btn-icon"
                                title="Copiar texto da mensagem personalizada"
                                style={{ width: '32px', height: '32px' }}
                              >
                                {copiadoId === cli.id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDispararIndividual(cli, cobrancaAtual)}
                                className="btn btn-primary"
                                style={{
                                  backgroundColor: '#25d366',
                                  borderColor: '#25d366',
                                  fontSize: '0.775rem',
                                  padding: '5px 12px',
                                  height: '32px',
                                }}
                                title="Abrir WhatsApp com mensagem pronta"
                              >
                                <MessageCircle size={14} />
                                <span>Enviar</span>
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
        </>
      )}

      {/* =========================================================================
          ABA 2: GERENCIAMENTO DE MODELOS & LEMBRETES PRONTOS
          ========================================================================= */}
      {abaAtiva === 'modelos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--accent-primary)" />
                  Catálogo de Mensagens Prontas
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', margin: '4px 0 0 0' }}>
                  Crie, edite ou personalize as mensagens disparadas pelo sistema. As variáveis entre chaves são preenchidas dinamicamente.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Deseja restaurar as mensagens de fábrica do Totus TV? Modelos personalizados serão redefinidos.')) {
                      resetarModelosPadrao();
                      mostrarToast('Modelos padrões restaurados!');
                    }
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem' }}
                  title="Restaurar mensagens padrão originais"
                >
                  <RotateCcw size={14} />
                  <span>Restaurar Padrões</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setModalModelo({
                      open: true,
                      modelo: {
                        titulo: '',
                        texto: 'Olá, {NOME}! Tudo bem? Passando para lembrar...',
                        categoria: 'lembrete',
                      },
                    })
                  }
                  className="btn btn-primary"
                  style={{ backgroundColor: '#25d366', borderColor: '#25d366' }}
                >
                  <Plus size={16} />
                  <span>Novo Modelo</span>
                </button>
              </div>
            </div>

            {/* Dica de Variáveis */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                fontSize: '0.825rem',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: '16px',
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>Tags dinâmicas disponíveis:</span>
              <code>{'{NOME}'}</code> (Primeiro nome do cliente) •
              <code>{'{DATA}'}</code> (Data de vencimento formatada) •
              <code>{'{VALOR}'}</code> (Valor da mensalidade R$) •
              <code>{'{PIX}'}</code> (Chave Pix configurada) •
              <code>{'{VENCIMENTO_DIA}'}</code> (Número do dia de vencimento)
            </div>

            {/* Grid de Modelos Cadastrados */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
              {modelosMensagem.map(mod => {
                return (
                  <div
                    key={mod.id}
                    className="card"
                    style={{
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid var(--border-subtle)',
                      position: 'relative',
                      backgroundColor: 'var(--bg-secondary)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '8px' }}>
                        <div>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                            {mod.titulo}
                          </h3>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                            <span
                              className="badge"
                              style={{
                                fontSize: '0.65rem',
                                backgroundColor: 'rgba(37, 211, 102, 0.15)',
                                color: '#25d366',
                              }}
                            >
                              {mod.categoria.toUpperCase()}
                            </span>
                            {mod.dia_vencimento_alvo && (
                              <span className="badge badge-em-dia" style={{ fontSize: '0.65rem' }}>
                                Foco Dia {mod.dia_vencimento_alvo}
                              </span>
                            )}
                            {mod.padrao && (
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-subtle)', alignSelf: 'center' }}>
                                (Padrão)
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => setModalModelo({ open: true, modelo: mod })}
                            className="btn btn-secondary btn-icon"
                            style={{ width: '32px', height: '32px' }}
                            title="Editar Modelo"
                          >
                            <Edit2 size={14} />
                          </button>

                          {!mod.padrao && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Deseja excluir o modelo "${mod.titulo}"?`)) {
                                  deletarModeloMensagem(mod.id);
                                  mostrarToast('Modelo excluído!');
                                }
                              }}
                              className="btn btn-secondary btn-icon"
                              style={{ width: '32px', height: '32px', color: 'var(--accent-rose)' }}
                              title="Excluir Modelo"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-tertiary)',
                          fontSize: '0.85rem',
                          color: 'var(--text-main)',
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                          maxHeight: '140px',
                          overflowY: 'auto',
                        }}
                      >
                        {mod.texto}
                      </div>
                    </div>

                    <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setModeloSelecionadoId(mod.id);
                          if (mod.dia_vencimento_alvo) {
                            setFiltroDiaVencimento(String(mod.dia_vencimento_alvo));
                          }
                          setAbaAtiva('disparo');
                          mostrarToast(`Modelo selecionado para disparo!`);
                        }}
                        className="btn btn-primary"
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                      >
                        <Send size={14} />
                        <span>Usar no Disparo</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADICIONAR / EDITAR MODELO DE MENSAGEM
          ========================================================================= */}
      {modalModelo.open && modalModelo.modelo && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModalModelo({ open: false, modelo: null }); }}>
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <MessageCircle size={20} color="#25d366" />
                {modalModelo.modelo.id ? 'Editar Modelo de Mensagem' : 'Cadastrar Novo Modelo'}
              </h2>
              <button
                type="button"
                onClick={() => setModalModelo({ open: false, modelo: null })}
                className="btn btn-secondary btn-icon"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSalvarModelo} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Título / Identificação do Lembrete *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Cobrança Especial Dia 10 ou Lembrete Amigável"
                  value={modalModelo.modelo.titulo || ''}
                  onChange={e => setModalModelo({
                    ...modalModelo,
                    modelo: { ...modalModelo.modelo, titulo: e.target.value },
                  })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Categoria do Lembrete</label>
                  <select
                    className="form-control"
                    value={modalModelo.modelo.categoria || 'geral'}
                    onChange={e => setModalModelo({
                      ...modalModelo,
                      modelo: { ...modalModelo.modelo, categoria: e.target.value as any },
                    })}
                  >
                    <option value="lembrete">Lembrete Preventivo</option>
                    <option value="cobranca">Cobrança de Vencimento</option>
                    <option value="promessa">Confirmação de Promessa</option>
                    <option value="recibo">Recibo / Confirmação de Pagamento</option>
                    <option value="geral">Mensagem Geral / Comunicado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Dia de Vencimento Alvo (Opcional)</label>
                  <select
                    className="form-control"
                    value={modalModelo.modelo.dia_vencimento_alvo || ''}
                    onChange={e => setModalModelo({
                      ...modalModelo,
                      modelo: { ...modalModelo.modelo, dia_vencimento_alvo: e.target.value ? Number(e.target.value) : undefined },
                    })}
                  >
                    <option value="">Qualquer Dia / Geral</option>
                    <option value={10}>Dia 10 (Específico)</option>
                    <option value={20}>Dia 20 (Específico)</option>
                    <option value={30}>Dia 30 (Específico)</option>
                    <option value={5}>Dia 5 (Especial)</option>
                    <option value={15}>Dia 15 (Especial)</option>
                    <option value={25}>Dia 25 (Especial)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Texto da Mensagem *</label>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>
                    Clique nas tags para inserir no texto:
                  </span>
                </div>

                {/* Botões rápidos para injetar tags no cursor */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {[
                    { tag: '{NOME}', label: '+ {NOME}' },
                    { tag: '{DATA}', label: '+ {DATA}' },
                    { tag: '{VALOR}', label: '+ {VALOR}' },
                    { tag: '{PIX}', label: '+ {PIX}' },
                    { tag: '{VENCIMENTO_DIA}', label: '+ {VENCIMENTO_DIA}' },
                  ].map(item => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => {
                        const atual = modalModelo.modelo?.texto || '';
                        setModalModelo({
                          ...modalModelo,
                          modelo: { ...modalModelo.modelo, texto: atual + ` ${item.tag}` },
                        });
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.725rem', padding: '3px 8px', borderRadius: '6px' }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <textarea
                  className="form-control"
                  rows={4}
                  value={modalModelo.modelo.texto || ''}
                  onChange={e => setModalModelo({
                    ...modalModelo,
                    modelo: { ...modalModelo.modelo, texto: e.target.value },
                  })}
                  placeholder="Escreva a mensagem aqui usando {NOME}, {DATA}, {VALOR}, {PIX}..."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalModelo({ open: false, modelo: null })}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: '#25d366', borderColor: '#25d366' }}
                >
                  <Check size={16} />
                  <span>Salvar Modelo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ASSISTENTE DE FILA DE DISPARO (PASSO A PASSO SEQUENCIAL SEGURO)
          ========================================================================= */}
      {modalFila.open && clientesFila.length > 0 && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            {(() => {
              const clienteAtual = clientesFila[modalFila.indiceAtual];
              if (!clienteAtual) return null;

              const textoAtual = interpolarTexto(modeloAtual.texto, clienteAtual.cli, clienteAtual.cobrancaAtual);
              const progresso = Math.round(((modalFila.indiceAtual + 1) / clientesFila.length) * 100);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Top Bar da Fila */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className="badge badge-em-dia" style={{ backgroundColor: '#25d366', color: '#fff' }}>
                        Disparo Sequencial Seguro
                      </span>
                      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '6px 0 0 0' }}>
                        Contato {modalFila.indiceAtual + 1} de {clientesFila.length}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => setModalFila({ open: false, indiceAtual: 0, enviados: new Set() })}
                      className="btn btn-secondary btn-icon"
                      title="Fechar assistente de envio"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Barra de Progresso */}
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${progresso}%`,
                        height: '100%',
                        backgroundColor: '#25d366',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  {/* Dados do Cliente Atual */}
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
                        {clienteAtual.cli.nome}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#25d366', fontWeight: 600, marginTop: '2px' }}>
                        {formatPhone(clienteAtual.cli.whatsapp)}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Vencimento</div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-primary)' }}>
                        Dia {clienteAtual.cli.dia_vencimento}
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        {formatCurrency(clienteAtual.cli.valor_mensalidade)}
                      </div>
                    </div>
                  </div>

                  {/* Prévia da Mensagem Formatada */}
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Mensagem Pronta Personalizada:</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(textoAtual);
                          mostrarToast('Texto copiado!');
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Copy size={12} />
                        Copiar
                      </button>
                    </label>

                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.85rem',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {textoAtual}
                    </div>
                  </div>

                  {/* Botões de Ação do Assistente */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleFilaEnviarEAvancar}
                      className="btn btn-primary"
                      style={{
                        backgroundColor: '#25d366',
                        borderColor: '#25d366',
                        height: '46px',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)',
                      }}
                    >
                      <MessageCircle size={18} />
                      <span>Abrir WhatsApp e Ir para o Próximo</span>
                      <ArrowRight size={16} />
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (modalFila.indiceAtual + 1 < clientesFila.length) {
                            setModalFila({ ...modalFila, indiceAtual: modalFila.indiceAtual + 1 });
                          } else {
                            setModalFila({ open: false, indiceAtual: 0, enviados: new Set() });
                          }
                        }}
                        className="btn btn-secondary"
                        style={{ flex: 1, fontSize: '0.825rem' }}
                      >
                        Pular este contato
                      </button>

                      <button
                        type="button"
                        onClick={() => setModalFila({ open: false, indiceAtual: 0, enviados: new Set() })}
                        className="btn btn-secondary"
                        style={{ flex: 1, fontSize: '0.825rem' }}
                      >
                        Cancelar Envio
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
