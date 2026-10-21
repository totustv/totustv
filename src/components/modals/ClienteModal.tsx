import React, { useState } from 'react';
import { X, UserPlus, Save, Shield, MapPin, Globe } from 'lucide-react';
import { Cliente } from '../../types';
import { useTotus } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

interface ClienteModalProps {
  cliente?: Cliente | null;
  onClose: () => void;
}

export const ClienteModal: React.FC<ClienteModalProps> = ({ cliente, onClose }) => {
  const { salvarCliente, clientes, config, usuarios } = useTotus();
  const { currentUser, isAdmin, isReseller } = useAuth();

  const [formData, setFormData] = useState({
    id: cliente?.id || '',
    nome: cliente?.nome || '',
    whatsapp: cliente?.whatsapp || '',
    valor_mensalidade: cliente?.valor_mensalidade ?? config.valor_mensalidade_padrao,
    dia_vencimento: cliente?.dia_vencimento ?? 10,
    data_inicio_servico: cliente?.data_inicio_servico || new Date().toISOString().split('T')[0],
    data_nascimento: cliente?.data_nascimento || '',
    pais: cliente?.pais || 'Brasil',
    estado: cliente?.estado || '',
    cidade: cliente?.cidade || '',
    status: cliente?.status || 'ativo',
    reseller_id: cliente?.reseller_id || (isReseller && currentUser ? currentUser.id : ''),
    indicado_por: cliente?.indicado_por || '',
    observacoes: cliente?.observacoes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return alert('Informe o nome do cliente');
    if (!formData.whatsapp.trim()) return alert('Informe o WhatsApp do cliente');

    salvarCliente({
      ...formData,
      valor_mensalidade: Number(formData.valor_mensalidade),
      dia_vencimento: Number(formData.dia_vencimento),
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} color="var(--accent-primary)" />
            {cliente ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
          </h2>
          <button onClick={onClose} className="btn btn-secondary btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Nome Completo *</label>
            <input
              type="text"
              className="form-control"
              value={formData.nome}
              onChange={e => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: João da Silva"
              required
            />
          </div>

          <div className="modal-grid modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">WhatsApp *</label>
              <input
                type="text"
                className="form-control"
                value={formData.whatsapp}
                onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="Ex: 11999998888"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Valor Mensalidade (R$) *</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.valor_mensalidade}
                onChange={e => setFormData({ ...formData, valor_mensalidade: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          {/* Localização (País, Estado e Cidade) */}
          <div className="modal-grid modal-grid-3" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.8fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Globe size={13} color="var(--accent-primary)" />
                País
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.pais}
                onChange={e => setFormData({ ...formData, pais: e.target.value })}
                placeholder="Ex: Brasil"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estado (UF)</label>
              <input
                type="text"
                className="form-control"
                value={formData.estado}
                onChange={e => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                placeholder="Ex: SP"
                maxLength={30}
                list="lista-ufs-brasil"
              />
              <datalist id="lista-ufs-brasil">
                <option value="AC" />
                <option value="AL" />
                <option value="AP" />
                <option value="AM" />
                <option value="BA" />
                <option value="CE" />
                <option value="DF" />
                <option value="ES" />
                <option value="GO" />
                <option value="MA" />
                <option value="MT" />
                <option value="MS" />
                <option value="MG" />
                <option value="PA" />
                <option value="PB" />
                <option value="PR" />
                <option value="PE" />
                <option value="PI" />
                <option value="RJ" />
                <option value="RN" />
                <option value="RS" />
                <option value="RO" />
                <option value="RR" />
                <option value="SC" />
                <option value="SP" />
                <option value="SE" />
                <option value="TO" />
              </datalist>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} color="var(--accent-rose)" />
                Cidade
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.cidade}
                onChange={e => setFormData({ ...formData, cidade: e.target.value })}
                placeholder="Ex: São Paulo"
              />
            </div>
          </div>

          <div className="modal-grid modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Dia Preferencial de Vencimento *</label>
              <select
                className="form-control"
                value={formData.dia_vencimento}
                onChange={e => setFormData({ ...formData, dia_vencimento: Number(e.target.value) })}
              >
                <option value={10}>Dia 10</option>
                <option value={20}>Dia 20</option>
                <option value={30}>Dia 30</option>
                <option value={5}>Dia 5 (Especial)</option>
                <option value={15}>Dia 15 (Especial)</option>
                <option value={25}>Dia 25 (Especial)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Data de Nascimento (Aniversário)</label>
              <input
                type="date"
                className="form-control"
                value={formData.data_nascimento}
                onChange={e => setFormData({ ...formData, data_nascimento: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-grid modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Data de Início do Serviço</label>
              <input
                type="date"
                className="form-control"
                value={formData.data_inicio_servico}
                onChange={e => setFormData({ ...formData, data_inicio_servico: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Indicado por (Padrinho)</label>
              <select
                className="form-control"
                value={formData.indicado_por}
                onChange={e => setFormData({ ...formData, indicado_por: e.target.value })}
              >
                <option value="">Nenhum (Cliente Direto)</option>
                {clientes
                  .filter(c => c.id !== cliente?.id)
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Vínculo de Revendedor (Visível e editável por Admin; bloqueado para Revendedor) */}
          {isAdmin ? (
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={14} color="var(--accent-primary)" />
                Revendedor Responsável pela Carteira
              </label>
              <select
                className="form-control"
                value={formData.reseller_id}
                onChange={e => setFormData({ ...formData, reseller_id: e.target.value })}
              >
                <option value="">Totus TV (Direto / Sem Revendedor)</option>
                {usuarios
                  .filter(u => u.role === 'reseller')
                  .map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nome} ({u.email}) {u.status === 'suspenso' ? '[SUSPENSO]' : ''}
                    </option>
                  ))}
              </select>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'block' }}>
                A transferência de carteira preserva integralmente o histórico de faturas e bônus.
              </span>
            </div>
          ) : (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-tertiary)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
              }}
            >
              💼 Este cliente será vinculado automaticamente à sua carteira (<strong>{currentUser?.nome}</strong>).
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Observações Internas (Dispositivos, etc.)</label>
            <textarea
              className="form-control"
              rows={2}
              value={formData.observacoes}
              onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Ex: Smart TV LG sala, 2 telas simultâneas..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              <span>Salvar Cliente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
