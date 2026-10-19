import React, { useState } from 'react';
import { X, DollarSign, CheckCircle2 } from 'lucide-react';
import { useTotus } from '../../context/AppContext';
import { FormaPagamento } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import confetti from 'canvas-confetti';

interface PagamentoModalProps {
  cobrancaId: string;
  onClose: () => void;
}

export const PagamentoModal: React.FC<PagamentoModalProps> = ({ cobrancaId, onClose }) => {
  const { cobrancas, clientes, registrarPagamento } = useTotus();
  const cobranca = cobrancas.find(c => c.id === cobrancaId);
  const cliente = cobranca ? clientes.find(c => c.id === cobranca.cliente_id) : undefined;

  const [valorPago, setValorPago] = useState(cobranca?.valor ?? 35);
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0]);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('pix');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');

  if (!cobranca || !cliente) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      registrarPagamento({
        cobranca_id: cobranca.id,
        valor_pago: Number(valorPago),
        data_pagamento: `${dataPagamento}T12:00:00Z`,
        forma_pagamento: formaPagamento,
        observacao: observacao.trim() || undefined,
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      onClose();
    } catch (err: any) {
      setErro(err.message || 'Erro ao registrar pagamento');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={20} color="var(--accent-emerald)" />
            Confirmar Pagamento Realizado
          </h2>
          <button onClick={onClose} className="btn btn-secondary btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Resumo da fatura */}
        <div style={{ padding: '14px', background: 'var(--bg-tertiary)', borderRadius: '10px', marginBottom: '16px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{cliente.nome}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
            Fatura referente a {String(cobranca.competencia_mes).padStart(2, '0')}/{cobranca.competencia_ano} • Vencimento: {formatDate(cobranca.data_vencimento)}
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '6px' }}>
            Valor Nominal: {formatCurrency(cobranca.valor)}
          </div>
        </div>

        {erro && (
          <div style={{ padding: '10px', background: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)', borderRadius: '6px', marginBottom: '12px', fontSize: '0.85rem' }}>
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Valor Efetivamente Recebido (R$) *</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={valorPago}
                onChange={e => setValorPago(Number(e.target.value))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Data do Recebimento *</label>
              <input
                type="date"
                className="form-control"
                value={dataPagamento}
                onChange={e => setDataPagamento(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Forma de Pagamento *</label>
            <select
              className="form-control"
              value={formaPagamento}
              onChange={e => setFormaPagamento(e.target.value as FormaPagamento)}
            >
              <option value="pix">Pix (Instantâneo)</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="transferencia">Transferência Bancária</option>
              <option value="cartao">Cartão de Crédito/Débito</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Observações / Comprovante (Opcional)</label>
            <input
              type="text"
              className="form-control"
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Ex: Comprovante enviado via WhatsApp"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-success">
              <CheckCircle2 size={16} />
              <span>Dar Baixa e Salvar Caixa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
