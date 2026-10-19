import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Download,
  PieChart as PieChartIcon,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { useTotus } from '../context/AppContext';
import { formatCurrency, formatDate } from '../lib/utils';

export const FinanceiroPage: React.FC = () => {
  const { kpis, fluxoCaixa, despesas, cobrancas, clientes } = useTotus();
  const [filtroTipoFluxo, setFiltroTipoFluxo] = useState<'todos' | 'entrada' | 'saida'>('todos');
  const [mesSelecionado, setMesSelecionado] = useState<number>(10);
  const [anoSelecionado, setAnoSelecionado] = useState<number>(2026);

  // Filtragem do Livro Caixa
  const fluxoFiltrado = useMemo(() => {
    return fluxoCaixa.filter(item => {
      const d = new Date(item.data_movimento);
      if (d.getFullYear() !== anoSelecionado || d.getMonth() + 1 !== mesSelecionado) {
        return false;
      }
      if (filtroTipoFluxo === 'todos') return true;
      return item.tipo === filtroTipoFluxo;
    }).sort((a, b) => new Date(b.data_movimento).getTime() - new Date(a.data_movimento).getTime());
  }, [fluxoCaixa, mesSelecionado, anoSelecionado, filtroTipoFluxo]);

  // Gráfico: Formas de Pagamento mais utilizadas
  const formasPagamentoData = useMemo(() => {
    const mapa: Record<string, number> = {};
    fluxoCaixa.filter(f => f.tipo === 'entrada').forEach(item => {
      const forma = item.forma_pagamento ? item.forma_pagamento.toUpperCase() : 'PIX';
      mapa[forma] = (mapa[forma] || 0) + item.valor;
    });

    const colors = ['#10b981', '#6366f1', '#06b6d4', '#f59e0b', '#ec4899'];
    return Object.entries(mapa).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
  }, [fluxoCaixa]);

  // Exportar Relatório em CSV
  const exportarCSV = () => {
    const headers = ['Data', 'Tipo', 'Descricao', 'Forma_Pagamento', 'Valor'];
    const rows = fluxoFiltrado.map(item => [
      item.data_movimento,
      item.tipo,
      `"${item.descricao.replace(/"/g, '""')}"`,
      item.forma_pagamento,
      item.valor.toFixed(2),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `totustv_livro_caixa_${mesSelecionado}_${anoSelecionado}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={24} color="var(--accent-emerald)" />
            Financeiro
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            className="form-control"
            style={{ width: '130px', padding: '6px 10px', height: '36px' }}
            value={mesSelecionado}
            onChange={e => setMesSelecionado(Number(e.target.value))}
          >
            <option value={9}>Setembro / 2026</option>
            <option value={10}>Outubro / 2026</option>
            <option value={11}>Novembro / 2026</option>
            <option value={12}>Dezembro / 2026</option>
          </select>

          <button onClick={exportarCSV} className="btn btn-secondary">
            <Download size={16} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Grid de Cards Financeiros Precisos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        {/* Receita Realizada */}
        <div className="card" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
          <div className="card-header">
            <span className="card-title">
              <ArrowUpRight size={16} color="var(--accent-emerald)" />
              Receita Recebida
            </span>
            <span className="badge badge-pago">Realizado</span>
          </div>
          <div className="card-value" style={{ color: 'var(--accent-emerald)' }}>
            {formatCurrency(kpis.recebidosMes)}
          </div>
          <div className="card-subtext">
            <span>Mês anterior: {formatCurrency(kpis.recebidosMesAnterior)}</span>
          </div>
        </div>

        {/* Despesas Pagas */}
        <div className="card" style={{ borderLeft: '4px solid var(--accent-rose)' }}>
          <div className="card-header">
            <span className="card-title">
              <ArrowDownRight size={16} color="var(--accent-rose)" />
              Despesas Pagas
            </span>
            <span className="badge badge-atrasado">Realizado</span>
          </div>
          <div className="card-value" style={{ color: 'var(--accent-rose)' }}>
            {formatCurrency(kpis.despesasPagasMes)}
          </div>
          <div className="card-subtext">
            <span>Pendentes: {formatCurrency(kpis.despesasPendentesMes)}</span>
          </div>
        </div>

        {/* Lucro Líquido Realizado */}
        <div className="card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
          <div className="card-header">
            <span className="card-title">
              <TrendingUp size={16} color="var(--accent-primary)" />
              Resultado Líquido
            </span>
            <span className="badge badge-ativo">Efetivo</span>
          </div>
          <div className="card-value" style={{ color: 'var(--accent-primary)' }}>
            {formatCurrency(kpis.lucroLiquidoMes)}
          </div>
          <div className="card-subtext">
            <span>Recebido − Pago no mês</span>
          </div>
        </div>

        {/* MRR Estimado */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Layers size={16} color="var(--accent-cyan)" />
              MRR Estimado
            </span>
            <span className="badge" style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4' }}>Potencial</span>
          </div>
          <div className="card-value">{formatCurrency(kpis.mrrEstimado)}</div>
          <div className="card-subtext">
            <span>Ticket Médio: {formatCurrency(kpis.ticketMedio)}</span>
          </div>
        </div>
      </div>

      {/* Gráficos Financeiros */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        {/* Gráfico Formas de Pagamento */}
        <div className="card" style={{ padding: '24px' }}>
          <div className="card-header">
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>Receitas por Forma de Pagamento</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Pix, Dinheiro, Cartão etc.</div>
            </div>
          </div>

          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={formasPagamentoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {formasPagamentoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: any) => [formatCurrency(Number(v)), 'Total Recebido']}
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '10px' }}>
            {formasPagamentoData.map(f => (
              <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: f.color }} />
                <span>{f.name}: <strong>{formatCurrency(f.value)}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo de Projeções e Isenções */}
        <div className="card" style={{ padding: '24px' }}>
          <div className="card-header">
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>Impacto Comercial & Previsões</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Benefícios concedidos sem inflar o lucro</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-tertiary)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Isenções em Bônus & Aniversário</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ec4899', marginTop: '2px' }}>
                {formatCurrency(kpis.receitaDispensadaBonusMes)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Registrado para controle de custo comercial sem distorcer o livro caixa.
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-tertiary)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Resultado Previsto se todos pagarem</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '2px' }}>
                {formatCurrency(kpis.lucroPrevistoMes)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Considerando faturas em aberto e despesas programadas do mês.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Livro Caixa (Fluxo de Caixa Consolidado) */}
      <div className="card" style={{ padding: '24px' }}>
        <div className="card-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
              Livro Caixa Auditável (Entradas & Saídas Realizadas)
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
              Cada registro é único e vinculado à fatura ou despesa de origem correspondente
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {(['todos', 'entrada', 'saida'] as const).map(tipo => (
              <button
                key={tipo}
                onClick={() => setFiltroTipoFluxo(tipo)}
                className={`btn btn-sm ${filtroTipoFluxo === tipo ? 'btn-primary' : 'btn-secondary'}`}
              >
                {tipo === 'todos' ? 'Todos' : tipo === 'entrada' ? 'Apenas Entradas' : 'Apenas Saídas'}
              </button>
            ))}
          </div>
        </div>

        {fluxoFiltrado.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-subtle)' }}>
            Nenhuma movimentação realizada neste período.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th>Forma Pagamento</th>
                  <th>Origem</th>
                  <th style={{ textAlign: 'right' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {fluxoFiltrado.map(item => (
                  <tr key={item.id}>
                    <td>
                      <span style={{ fontWeight: 600 }}>{formatDate(item.data_movimento)}</span>
                    </td>
                    <td>
                      <span className={`badge ${item.tipo === 'entrada' ? 'badge-pago' : 'badge-atrasado'}`}>
                        {item.tipo === 'entrada' ? '+ Entrada' : '- Saída'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.descricao}</div>
                    </td>
                    <td>
                      <span style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                        {item.forma_pagamento}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                        {item.origem === 'pagamento_cliente' ? 'Cobrança Cliente' : 'Despesa Paga'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          color: item.tipo === 'entrada' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                        }}
                      >
                        {item.tipo === 'entrada' ? '+' : '-'} {formatCurrency(item.valor)}
                      </span>
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
