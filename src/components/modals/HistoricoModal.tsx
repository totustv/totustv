import React from 'react';
import { X, History, Calendar, DollarSign, Clock, MessageCircle } from 'lucide-react';
import { Cliente } from '../../types';
import { useTotus } from '../../context/AppContext';
import { formatCurrency, formatDate, formatDateTime, formatStatusBadge } from '../../lib/utils';

interface HistoricoModalProps {
  cliente: Cliente;
  onClose: () => void;
}

export const HistoricoModal: React.FC<HistoricoModalProps> = ({ cliente, onClose }) => {
  const { cobrancas, promessas, bonus } = useTotus();

  // Histórico de Faturas
  const faturasCliente = cobrancas.filter(c => c.cliente_id === cliente.id);
  // Histórico de Promessas
  const promessasCliente = promessas.filter(p => p.cliente_id === cliente.id);
  // Bônus
  const bonusCliente = bonus.filter(b => b.cliente_id === cliente.id);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '650px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} color="var(--accent-primary)" />
            Histórico Completo do Cliente
          </h2>
          <button onClick={onClose} className="btn btn-secondary btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Cabeçalho do Cliente */}
        <div style={{ padding: '14px', background: 'var(--bg-tertiary)', borderRadius: '10px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{cliente.nome}</div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '4px', flexWrap: 'wrap' }}>
            <span>WhatsApp: {cliente.whatsapp}</span>
            <span>Dia Preferencial: Dia {cliente.dia_vencimento}</span>
            <span>Mensalidade: {formatCurrency(cliente.valor_mensalidade)}</span>
            {(cliente.cidade || cliente.estado || cliente.pais) && (
              <span>
                Localização: {[cliente.cidade, cliente.estado].filter(Boolean).join(' - ')}
                {cliente.pais && cliente.pais.toLowerCase() !== 'brasil' ? ` (${cliente.pais})` : (cliente.pais ? ` - ${cliente.pais}` : '')}
              </span>
            )}
          </div>
        </div>

        {/* 1. Histórico de Mensalidades */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DollarSign size={16} color="var(--accent-emerald)" />
            Histórico de Cobranças & Pagamentos
          </h3>

          {faturasCliente.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Nenhuma cobrança registrada.</p>
          ) : (
            <div className="table-container">
              <table className="table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>Competência</th>
                    <th>Vencimento</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {faturasCliente.map(c => (
                    <tr key={c.id}>
                      <td>{String(c.competencia_mes).padStart(2, '0')}/{c.competencia_ano}</td>
                      <td>{formatDate(c.data_vencimento)}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(c.valor)}</td>
                      <td>
                        <span className={`badge badge-${c.status}`}>{formatStatusBadge(c.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 2. Histórico de Promessas */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} color="var(--accent-purple)" />
            Histórico de Promessas de Pagamento
          </h3>

          {promessasCliente.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Nenhuma promessa registrada.</p>
          ) : (
            <div className="table-container">
              <table className="table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>Data Combinada</th>
                    <th>Valor Prometido</th>
                    <th>Situação</th>
                    <th>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {promessasCliente.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{formatDate(p.data_combinada)}</td>
                      <td>{formatCurrency(p.valor_prometido)}</td>
                      <td>
                        <span className={`badge badge-${p.situacao}`}>{p.situacao.replace('_', ' ')}</span>
                      </td>
                      <td style={{ fontSize: '0.75rem' }}>{p.observacao || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 3. Bônus e Benefícios */}
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} color="#ec4899" />
            Bônus & Benefícios Concedidos
          </h3>

          {bonusCliente.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Nenhum bônus concedido.</p>
          ) : (
            <div className="table-container">
              <table className="table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Status</th>
                    <th>Data</th>
                    <th>Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {bonusCliente.map(b => (
                    <tr key={b.id}>
                      <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{b.tipo}</td>
                      <td>
                        <span className={`badge badge-${b.status}`}>{b.status}</span>
                      </td>
                      <td>{formatDate(b.data_concessao)}</td>
                      <td style={{ fontSize: '0.75rem' }}>{b.motivo_justificativa || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
