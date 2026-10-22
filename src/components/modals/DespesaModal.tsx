import React, { useState } from 'react';
import { X, TrendingDown, Save } from 'lucide-react';
import { useTotus } from '../../context/AppContext';
import { FormaPagamento, Despesa } from '../../types';

interface DespesaModalProps {
  despesa?: Despesa | null;
  onClose: () => void;
}

export const DespesaModal: React.FC<DespesaModalProps> = ({ despesa, onClose }) => {
  const { salvarDespesa, categoriasDespesas, salvarCategoriaDespesa } = useTotus();

  const [formData, setFormData] = useState({
    id: despesa?.id || '',
    descricao: despesa?.descricao || '',
    categoria_nome: despesa?.categoria_nome || 'Servidores e Hospedagem',
    valor: despesa?.valor || '',
    data_competencia: despesa?.data_competencia || new Date().toISOString().split('T')[0],
    data_vencimento: despesa?.data_vencimento || new Date().toISOString().split('T')[0],
    data_pagamento: despesa?.data_pagamento || '',
    status: despesa?.status || 'pendente',
    forma_pagamento: despesa?.forma_pagamento || 'pix',
    recorrente: despesa?.recorrente || false,
    periodicidade: despesa?.periodicidade || 'mensal',
    observacoes: despesa?.observacoes || '',
  });

  const [novaCategoria, setNovaCategoria] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.descricao.trim()) return alert('Informe a descrição da despesa');
    if (!formData.valor || Number(formData.valor) <= 0) return alert('Informe um valor válido');

    let catNome = formData.categoria_nome;
    if (novaCategoria.trim()) {
      salvarCategoriaDespesa(novaCategoria.trim());
      catNome = novaCategoria.trim();
    }

    salvarDespesa({
      ...formData,
      categoria_nome: catNome,
      valor: Number(formData.valor),
    });

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingDown size={20} color="var(--accent-rose)" />
            {despesa ? 'Editar Despesa' : 'Cadastrar Nova Despesa'}
          </h2>
          <button onClick={onClose} className="btn btn-secondary btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Descrição da Despesa / Fornecedor *</label>
            <input
              type="text"
              className="form-control"
              value={formData.descricao}
              onChange={e => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Ex: Servidor VPS Cloud, Tráfego Pago, etc."
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Categoria *</label>
              <select
                className="form-control"
                value={formData.categoria_nome}
                onChange={e => setFormData({ ...formData, categoria_nome: e.target.value })}
              >
                {categoriasDespesas.map(cat => (
                  <option key={cat.id} value={cat.nome}>{cat.nome}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.valor}
                onChange={e => setFormData({ ...formData, valor: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Data de Vencimento *</label>
              <input
                type="date"
                className="form-control"
                value={formData.data_vencimento}
                onChange={e => setFormData({ ...formData, data_vencimento: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status Inicial</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="pendente">Pendente</option>
                <option value="paga">Paga</option>
              </select>
            </div>
          </div>

          {formData.status === 'paga' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Data do Pagamento Efetivo</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.data_pagamento || new Date().toISOString().split('T')[0]}
                  onChange={e => setFormData({ ...formData, data_pagamento: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Forma de Pagamento</label>
                <select
                  className="form-control"
                  value={formData.forma_pagamento}
                  onChange={e => setFormData({ ...formData, forma_pagamento: e.target.value as any })}
                >
                  <option value="pix">Pix</option>
                  <option value="cartao">Cartão de Crédito</option>
                  <option value="transferencia">Transferência</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              </div>
            </div>
          )}

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="chk-recorrente"
              checked={formData.recorrente}
              onChange={e => setFormData({ ...formData, recorrente: e.target.checked })}
            />
            <label htmlFor="chk-recorrente" style={{ fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
              Despesa Recorrente Mensal
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Observações / Detalhes</label>
            <textarea
              className="form-control"
              rows={2}
              value={formData.observacoes}
              onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              <span>Salvar Despesa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
