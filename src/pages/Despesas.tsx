import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Repeat,
  Tag,
  DollarSign,
} from 'lucide-react';
import { useTotus } from '../context/AppContext';
import { Despesa, FormaPagamento } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';

interface DespesasPageProps {
  onOpenNovaDespesa: () => void;
  onEditDespesa: (despesa: Despesa) => void;
}

export const DespesasPage: React.FC<DespesasPageProps> = ({ onOpenNovaDespesa, onEditDespesa }) => {
  const { despesas, marcarDespesaComoPaga, cancelarDespesa } = useTotus();
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'paga' | 'pendente' | 'cancelada'>('todas');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');

  const categoriasUnicas = useMemo(() => {
    const set = new Set<string>();
    despesas.forEach(d => set.add(d.categoria_nome));
    return Array.from(set);
  }, [despesas]);

  const filtradas = useMemo(() => {
    return despesas.filter(d => {
      if (busca) {
        const matchDesc = d.descricao.toLowerCase().includes(busca.toLowerCase());
        const matchCat = d.categoria_nome.toLowerCase().includes(busca.toLowerCase());
        if (!matchDesc && !matchCat) return false;
      }
      if (filtroStatus !== 'todas' && d.status !== filtroStatus) return false;
      if (categoriaFiltro !== 'todas' && d.categoria_nome !== categoriaFiltro) return false;
      return true;
    }).sort((a, b) => new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime());
  }, [despesas, busca, filtroStatus, categoriaFiltro]);

  // Totais
  const totais = useMemo(() => {
    let pagas = 0;
    let pendentes = 0;
    filtradas.forEach(d => {
      if (d.status === 'paga') pagas += d.valor;
      if (d.status === 'pendente') pendentes += d.valor;
    });
    return { pagas, pendentes };
  }, [filtradas]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingDown size={24} color="var(--accent-rose)" />
            Despesas
          </h1>
        </div>

        <button onClick={onOpenNovaDespesa} className="btn btn-primary" id="btn-nova-despesa">
          <Plus size={16} />
          <span>Cadastrar Nova Despesa</span>
        </button>
      </div>

      {/* Mini Cards de Balanço de Despesas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-rose)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Total Pago (Efetivado)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-rose)', marginTop: '4px' }}>
            {formatCurrency(totais.pagas)}
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-amber)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Compromissos Pendentes</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '4px' }}>
            {formatCurrency(totais.pendentes)}
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Buscar despesa ou fornecedor..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ paddingLeft: '38px' }}
            />
          </div>

          <select
            className="form-control"
            style={{ width: '180px' }}
            value={categoriaFiltro}
            onChange={e => setCategoriaFiltro(e.target.value)}
          >
            <option value="todas">Todas as Categorias</option>
            {categoriasUnicas.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div className="chip-row" style={{ display: 'flex', gap: '6px' }}>
            {(['todas', 'pendente', 'paga', 'cancelada'] as const).map(st => (
              <button
                key={st}
                onClick={() => setFiltroStatus(st)}
                className={`btn btn-sm ${filtroStatus === st ? 'btn-primary' : 'btn-secondary'}`}
                style={{ textTransform: 'capitalize' }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {filtradas.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-subtle)' }}>
            Nenhuma despesa localizada com os filtros atuais.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Forma Pagamento</th>
                  <th>Recorrente</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{d.descricao}</div>
                      {d.observacoes && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                          {d.observacoes}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-main)' }}>
                        <Tag size={12} style={{ marginRight: '4px' }} />
                        {d.categoria_nome}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{formatDate(d.data_vencimento)}</span>
                      {d.data_pagamento && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)' }}>
                          Pago em: {formatDate(d.data_pagamento)}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: 'var(--accent-rose)' }}>
                        {formatCurrency(d.valor)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${d.status}`}>
                        {d.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                        {d.forma_pagamento || '-'}
                      </span>
                    </td>
                    <td>
                      {d.recorrente ? (
                        <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                          <Repeat size={12} />
                          {d.periodicidade || 'Mensal'}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Não</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {d.status === 'pendente' && (
                          <button
                            onClick={() => {
                              const dataPag = prompt('Data do pagamento (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
                              if (dataPag) {
                                marcarDespesaComoPaga(d.id, {
                                  data_pagamento: dataPag,
                                  forma_pagamento: 'pix',
                                });
                              }
                            }}
                            className="btn btn-success btn-sm"
                            title="Marcar como paga"
                          >
                            <CheckCircle size={14} />
                            <span>Pagar</span>
                          </button>
                        )}

                        {d.status === 'pendente' && (
                          <button
                            onClick={() => {
                              const mot = prompt('Motivo do cancelamento:');
                              if (mot) cancelarDespesa(d.id, mot);
                            }}
                            className="btn btn-secondary btn-sm"
                            title="Cancelar despesa"
                          >
                            <XCircle size={14} color="var(--accent-rose)" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
