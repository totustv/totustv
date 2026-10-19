import React, { useState } from 'react';
import { X, MessageCircle, Send, Copy, Check } from 'lucide-react';
import { Cliente, Cobranca } from '../../types';
import { useTotus } from '../../context/AppContext';
import { cleanWhatsAppNumber, formatCurrency, formatDate } from '../../lib/utils';

interface WhatsAppModalProps {
  cliente: Cliente;
  cobranca?: Cobranca;
  tipoMsgInicial?: string;
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  cliente,
  cobranca,
  tipoMsgInicial = 'lembrete_amanha',
  onClose,
}) => {
  const { config, registrarContato } = useTotus();
  const [tipoMsg, setTipoMsg] = useState(tipoMsgInicial);
  const [copied, setCopied] = useState(false);

  // Gerar texto dinâmico com interpolação de variáveis
  const getMensagemInterpolada = (tipo: string) => {
    let template = '';
    switch (tipo) {
      case 'lembrete_amanha':
        template = config.msg_lembrete_amanha;
        break;
      case 'lembrete_hoje':
        template = config.msg_lembrete_hoje;
        break;
      case 'cobranca_pendente':
        template = config.msg_cobranca_pendente;
        break;
      case 'promessa_confirmar':
        template = config.msg_promessa_confirmar;
        break;
      case 'confirmacao_pagamento':
        template = config.msg_pagamento_confirmado;
        break;
      default:
        template = config.msg_cobranca_pendente;
    }

    const valorStr = cobranca ? formatCurrency(cobranca.valor) : formatCurrency(cliente.valor_mensalidade);
    const dataStr = cobranca ? formatDate(cobranca.data_vencimento) : `dia ${cliente.dia_vencimento}`;

    return template
      .replace('{NOME}', cliente.nome.split(' ')[0])
      .replace('{DATA}', dataStr)
      .replace('{VALOR}', valorStr)
      .replace('{PIX}', config.chave_pix || 'Chave Pix');
  };

  const [mensagemTexto, setMensagemTexto] = useState(getMensagemInterpolada(tipoMsgInicial));

  const handleTipoChange = (novoTipo: string) => {
    setTipoMsg(novoTipo);
    setMensagemTexto(getMensagemInterpolada(novoTipo));
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(mensagemTexto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAbrirWhatsApp = () => {
    // 1. Registra no banco de dados como mensagem preparada/enviada manual
    registrarContato({
      cliente_id: cliente.id,
      cobranca_id: cobranca?.id,
      tipo_mensagem: tipoMsg,
      mensagem_texto: mensagemTexto,
      status_envio: 'enviada_manual',
    });

    // 2. Abre a URL do WhatsApp Web / Desktop
    const num = cleanWhatsAppNumber(cliente.whatsapp);
    const url = `https://wa.me/${num}?text=${encodeURIComponent(mensagemTexto)}`;
    window.open(url, '_blank');

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageCircle size={20} color="#25d366" />
            Enviar Mensagem via WhatsApp
          </h2>
          <button onClick={onClose} className="btn btn-secondary btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Info do cliente */}
        <div style={{ padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: '10px', marginBottom: '16px' }}>
          <div style={{ fontWeight: 700 }}>{cliente.nome}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
            WhatsApp: <strong>{cliente.whatsapp}</strong> • Vencimento: dia {cliente.dia_vencimento}
          </div>
        </div>

        {/* Seletor de Modelo */}
        <div className="form-group">
          <label className="form-label">Modelo de Mensagem Pré-definido</label>
          <select
            className="form-control"
            value={tipoMsg}
            onChange={e => handleTipoChange(e.target.value)}
          >
            <option value="lembrete_amanha">Lembrete de Vencimento Amanhã</option>
            <option value="lembrete_hoje">Lembrete de Vencimento Hoje</option>
            <option value="cobranca_pendente">Cobrança de Fatura Pendente/Atrasada</option>
            <option value="promessa_confirmar">Confirmação de Promessa de Pagamento</option>
            <option value="confirmacao_pagamento">Agradecimento / Pagamento Confirmado</option>
          </select>
        </div>

        {/* Área de Edição da Mensagem */}
        <div className="form-group">
          <label className="form-label">Conteúdo da Mensagem (Editável)</label>
          <textarea
            className="form-control"
            rows={5}
            value={mensagemTexto}
            onChange={e => setMensagemTexto(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <button onClick={handleCopiar} className="btn btn-secondary btn-sm">
            {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
            <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button onClick={handleAbrirWhatsApp} className="btn btn-whatsapp">
              <Send size={15} />
              <span>Abrir WhatsApp & Registrar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
