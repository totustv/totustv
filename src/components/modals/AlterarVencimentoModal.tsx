import React, { useState } from 'react';
import { X, Calendar, History, Save } from 'lucide-react';
import { Cliente, Cobranca } from '../../types';
import { useTotus } from '../../context/AppContext';
import { formatDate } from '../../lib/utils';

interface AlterarVencimentoModalProps {
  cliente: Cliente;
  cobranca?: Cobranca;
  onClose: () => void;
}

export const AlterarVencimentoModal: React.FC<AlterarVencimentoModalProps> = ({
  cliente,
  cobranca,
  onClose,
}) => {
  const { salvarCliente, alterarVencimentoCobranca } = useTotus();
  const [novoDiaPreferencial, setNovoDiaPreferencial] = useState(cliente.dia_vencimento);
  const [novaDataFatura, setNovaDataFatura] = useState(cobranca?.data_vencimento || '');
  const [motivo, setMotivo] = useState('');
  const [aplicarSomenteNestaFatura, setAplicarSomenteNestaFatura] = useState(Boolean(cobranca));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (aplicarSomenteNestaFatura && cobranca) {
      if (!novaDataFatura) return alert('Informe a nova data para esta fatura');
      alterarVencimentoCobranca(cobranca.id, novaDataFatura, motivo);
    } else {
      salvarCliente({
        id: cliente.id,
        nome: cliente.nome,
        whatsapp: cliente.whatsapp,
        valor_mensalidade: cliente.valor_mensalidade,
        dia_vencimento: Number(novoDiaPreferencial),
      });
    }

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} color="var(--accent-primary)" />
            Alterar Data de Vencimento
          </h2>
          <button onClick={onClose} className="btn btn-secondary btn-icon">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: '10px', marginBottom: '16px' }}>
          <div style={{ fontWeight: 700 }}>{cliente.nome}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
            Vencimento Atual: <strong>Dia {cliente.dia_vencimento}</strong>
            {cobranca && ` • Vencimento desta fatura: ${formatDate(cobranca.data_vencimento)}`}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {cobranca && (
            <div className="form-group">
              <label className="form-label">Escopo da Alteração</label>
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="escopo"
                    checked={aplicarSomenteNestaFatura}
                    onChange={() => setAplicarSomenteNestaFatura(true)}
                  />
                  Apenas para esta fatura específica
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="escopo"
                    checked={!aplicarSomenteNestaFatura}
                    onChange={() => setAplicarSomenteNestaFatura(false)}
                  />
                  Alterar dia preferencial do cadastro (Todas futuras)
                </label>
              </div>
            </div>
          )}

          {aplicarSomenteNestaFatura && cobranca ? (
            <div className="form-group">
              <label className="form-label">Nova Data de Vencimento desta Fatura *</label>
              <input
                type="date"
                className="form-control"
                value={novaDataFatura}
                onChange={e => setNovaDataFatura(e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Novo Dia Preferencial de Vencimento *</label>
              <select
                className="form-control"
                value={novoDiaPreferencial}
                onChange={e => setNovoDiaPreferencial(Number(e.target.value))}
              >
                <option value={10}>Dia 10 de cada mês</option>
                <option value={20}>Dia 20 de cada mês</option>
                <option value={30}>Dia 30 de cada mês</option>
                <option value={5}>Dia 5 de cada mês</option>
                <option value={15}>Dia 15 de cada mês</option>
                <option value={25}>Dia 25 de cada mês</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Motivo da Alteração (Auditável)</label>
            <input
              type="text"
              className="form-control"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ex: Mudança de data de pagamento do salário"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              <span>Salvar com Histórico</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
