import React, { useState } from 'react';
import { X, Gift, CheckCircle2, Trash2 } from 'lucide-react';
import { Cliente, BonusBeneficio, BonusTipo, BonusStatus } from '../../types';
import { useTotus } from '../../context/AppContext';

interface ConcederBonusModalProps {
  bonusParaEditar?: BonusBeneficio | null;
  cliente?: Cliente | null;
  onClose: () => void;
}

export const ConcederBonusModal: React.FC<ConcederBonusModalProps> = ({
  bonusParaEditar,
  cliente,
  onClose,
}) => {
  const { clientes, salvarBonus, deletarBonus, programasBonus } = useTotus();
  const [clienteId, setClienteId] = useState(
    bonusParaEditar?.cliente_id || cliente?.id || (clientes[0]?.id || '')
  );
  const [tipo, setTipo] = useState<BonusTipo>(bonusParaEditar?.tipo || 'manual');
  const [status, setStatus] = useState<BonusStatus>(bonusParaEditar?.status || 'disponivel');
  const [indicadoId, setIndicadoId] = useState(bonusParaEditar?.indicado_id || '');
  const [motivo, setMotivo] = useState(bonusParaEditar?.motivo_justificativa || '');
  const [dataConcessao, setDataConcessao] = useState(
    bonusParaEditar?.data_concessao ? bonusParaEditar.data_concessao.split('T')[0] : new Date().toISOString().split('T')[0]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) return alert('Selecione o cliente');
    if (!motivo.trim()) return alert('Informe o motivo ou justificativa do benefício');

    salvarBonus({
      id: bonusParaEditar?.id,
      cliente_id: clienteId,
      tipo,
      status,
      indicado_id: tipo === 'indicacao' && indicadoId ? indicadoId : undefined,
      motivo_justificativa: motivo.trim(),
      data_concessao: dataConcessao ? new Date(dataConcessao).toISOString() : new Date().toISOString(),
    });

    onClose();
  };

  const handleDelete = () => {
    if (!bonusParaEditar) return;
    if (confirm('Tem certeza que deseja excluir permanentemente este benefício de bônus?')) {
      deletarBonus(bonusParaEditar.id);
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gift size={20} color="#ec4899" />
            {bonusParaEditar ? 'Editar Bônus / Benefício' : 'Novo Bônus / Benefício'}
          </h2>
          <button onClick={onClose} className="btn btn-secondary btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Cliente Beneficiado *</label>
            <select
              className="form-control"
              value={clienteId}
              onChange={e => setClienteId(e.target.value)}
              required
            >
              {[...clientes]
                .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
                .map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome} (Venc. dia {c.dia_vencimento})
                  </option>
                ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Tipo de Benefício *</label>
              <select
                className="form-control"
                value={tipo}
                onChange={e => {
                  const val = e.target.value as BonusTipo;
                  setTipo(val);
                  const prog = programasBonus?.find(p => p.id === val);
                  if (prog && !motivo) {
                    setMotivo(prog.titulo);
                  }
                }}
              >
                <option value="manual">Manual / Cortesia</option>
                <option value="indicacao">Indicação de Cliente</option>
                <option value="aniversario">Mês de Aniversário</option>
                {programasBonus
                  ?.filter(p => p.id !== 'prog-1' && p.id !== 'prog-2')
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      {p.titulo}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status do Benefício *</label>
              <select
                className="form-control"
                value={status}
                onChange={e => setStatus(e.target.value as BonusStatus)}
              >
                <option value="disponivel">Disponível para Uso</option>
                <option value="pendente">Pendente (Aguardando)</option>
                <option value="utilizado">Utilizado (Dispensado)</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          {tipo === 'indicacao' && (
            <div className="form-group">
              <label className="form-label">Cliente Indicado (Origem do Bônus)</label>
              <select
                className="form-control"
                value={indicadoId}
                onChange={e => setIndicadoId(e.target.value)}
              >
                <option value="">Selecione o indicado (ou deixe em branco)</option>
                {clientes
                  .filter(c => c.id !== clienteId)
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Data de Concessão</label>
            <input
              type="date"
              className="form-control"
              value={dataConcessao}
              onChange={e => setDataConcessao(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Justificativa / Motivo Registrado *</label>
            <textarea
              className="form-control"
              rows={3}
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ex: Concedido 1 mês grátis por fidelidade, indicação ou cortesia..."
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            {bonusParaEditar ? (
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-secondary"
                style={{ color: 'var(--accent-rose)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              >
                <Trash2 size={16} />
                <span>Excluir Bônus</span>
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#ec4899' }}>
                <CheckCircle2 size={16} />
                <span>{bonusParaEditar ? 'Salvar Alterações' : 'Conceder Benefício'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
