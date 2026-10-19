import React, { useState } from 'react';
import { X, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { Cliente } from '../../types';
import { useTotus } from '../../context/AppContext';
import { formatCurrency } from '../../lib/utils';

interface PromessaModalProps {
  cliente: Cliente;
  cobrancaId?: string;
  onClose: () => void;
}

export const PromessaModal: React.FC<PromessaModalProps> = ({ cliente, cobrancaId, onClose }) => {
  const { registrarPromessa } = useTotus();
  const [dataCombinada, setDataCombinada] = useState('');
  const [valorPrometido, setValorPrometido] = useState(cliente.valor_mensalidade);
  const [observacao, setObservacao] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataCombinada) return alert('Informe a data combinada para o pagamento');

    registrarPromessa({
      cliente_id: cliente.id,
      cobranca_id: cobrancaId,
      data_combinada: dataCombinada,
      valor_prometido: Number(valorPrometido),
      observacao: observacao.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} color="var(--accent-purple)" />
            Registrar Promessa de Pagamento
          </h2>
          <button onClick={onClose} className="btn btn-secondary btn-icon">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: '10px', marginBottom: '16px' }}>
          <div style={{ fontWeight: 700 }}>{cliente.nome}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
            WhatsApp: {cliente.whatsapp} • Mensalidade: {formatCurrency(cliente.valor_mensalidade)}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Data Combinada com o Cliente *</label>
              <input
                type="date"
                className="form-control"
                value={dataCombinada}
                onChange={e => setDataCombinada(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Valor que será Pago (R$) *</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={valorPrometido}
                onChange={e => setValorPrometido(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Observações / Detalhes da Negociação</label>
            <textarea
              className="form-control"
              rows={3}
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Ex: Pediu para pagar após o quinto dia útil junto com o adiantamento..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--accent-purple)' }}>
              <CheckCircle2 size={16} />
              <span>Salvar Promessa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
