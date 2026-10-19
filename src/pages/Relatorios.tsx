import React, { useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  AlertTriangle,
  Gift,
  Download,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useTotus } from '../context/AppContext';
import { formatCurrency, formatDate } from '../lib/utils';

export const RelatoriosPage: React.FC = () => {
  const { clientes, cobrancas, despesas, bonus, fluxoCaixa, kpis } = useTotus();

  // Métricas de Retenção e Indicadores Chave
  const totalClientesCadastrados = clientes.length;
  const clientesAtivos = clientes.filter(c => c.status === 'ativo').length;
  const clientesInativos = clientes.filter(c => c.status === 'inativo').length;
  const taxaCancelamento = totalClientesCadastrados > 0
    ? ((clientesInativos / totalClientesCadastrados) * 100).toFixed(1)
    : '0';

  // Análise de Indicações
  const totalIndicacoes = bonus.filter(b => b.tipo === 'indicacao').length;
  const indicacoesConvertidas = bonus.filter(b => b.tipo === 'indicacao' && b.status !== 'pendente').length;
  const taxaConversaoIndicacoes = totalIndicacoes > 0
    ? ((indicacoesConvertidas / totalIndicacoes) * 100).toFixed(1)
    : '0';

  // Clientes com histórico de atraso
  const cobrancasAtrasadas = cobrancas.filter(c => c.status === 'atrasado');

  // Exportar Relatório Geral Consolidado em CSV
  const exportarRelatorioConsolidado = () => {
    const lines = [
      ['RELATÓRIO CONSOLIDADO DE PERFORMANCE - TOTUS TV'],
      ['Gerado em', new Date().toLocaleString('pt-BR')],
      [],
      ['INDICADORES GERAIS', 'VALOR'],
      ['Total de Clientes Cadastrados', totalClientesCadastrados],
      ['Clientes Ativos', clientesAtivos],
      ['Clientes Inativos', clientesInativos],
      ['Taxa de Cancelamento (Churn)', `${taxaCancelamento}%`],
      ['Total de Indicações Registradas', totalIndicacoes],
      ['Indicações Convertidas em Pagantes', indicacoesConvertidas],
      ['Taxa de Conversão de Indicações', `${taxaConversaoIndicacoes}%`],
      ['Total de Bônus Dispensados (Custo Comercial)', kpis.receitaDispensadaBonusMes.toFixed(2)],
      ['MRR Estimado (Receita Recorrente)', kpis.mrrEstimado.toFixed(2)],
      ['Receita Efetiva no Mês', kpis.recebidosMes.toFixed(2)],
      ['Despesas Efetivas no Mês', kpis.despesasPagasMes.toFixed(2)],
      ['Lucro Líquido Realizado', kpis.lucroLiquidoMes.toFixed(2)],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + lines.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `totustv_relatorio_geral_${Date.now()}.csv`);
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
            <BarChart3 size={24} color="var(--accent-primary)" />
            Relatórios Estratégicos & Auditoria
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Indicadores de conversão de indicações, retenção de base, inadimplência e custos comerciais.
          </p>
        </div>

        <button onClick={exportarRelatorioConsolidado} className="btn btn-primary">
          <Download size={16} />
          <span>Exportar Relatório Geral (CSV)</span>
        </button>
      </div>

      {/* Grid de Métricas de Inteligência Comercial */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {/* Retenção */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Users size={18} color="var(--accent-primary)" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Taxa de Cancelamento</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {taxaCancelamento}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
            {clientesInativos} de {totalClientesCadastrados} clientes cancelaram
          </div>
        </div>

        {/* Conversão de Indicações */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-emerald)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Gift size={18} color="var(--accent-emerald)" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Conversão de Indicações</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            {taxaConversaoIndicacoes}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
            {indicacoesConvertidas} pagaram o 1º mês de {totalIndicacoes} indicados
          </div>
        </div>

        {/* Custo Comercial de Bônus */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <TrendingUp size={18} color="#ec4899" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Custo em Isenções (Bônus)</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ec4899' }}>
            {formatCurrency(kpis.receitaDispensadaBonusMes)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
            Mensalidades gratuitas concedidas neste mês
          </div>
        </div>

        {/* Inadimplência Atual */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-rose)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertTriangle size={18} color="var(--accent-rose)" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Faturas Atrasadas</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
            {cobrancasAtrasadas.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
            Faturas cujo vencimento já ultrapassou a data limite
          </div>
        </div>
      </div>

      {/* Tabela de Inadimplência e Atenção */}
      <div className="card" style={{ padding: '24px' }}>
        <div className="card-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
              Detalhamento de Inadimplência e Atrasos
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
              Clientes que necessitam de intervenção ou renegociação
            </div>
          </div>
        </div>

        {cobrancasAtrasadas.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-subtle)' }}>
            <CheckCircle2 size={32} color="var(--accent-emerald)" style={{ margin: '0 auto 8px' }} />
            Zero inadimplência crítica registrada neste momento.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>WhatsApp</th>
                  <th>Vencimento Original</th>
                  <th>Valor em Aberto</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {cobrancasAtrasadas.map(cob => {
                  const cli = clientes.find(c => c.id === cob.cliente_id);
                  return (
                    <tr key={cob.id} className="row-vencido">
                      <td style={{ borderLeft: '4px solid #ef4444' }}>
                        <span style={{ fontWeight: 700 }}>{cli?.nome || 'Cliente'}</span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{cli?.whatsapp}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--accent-rose)' }}>
                          {formatDate(cob.data_vencimento)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800 }}>{formatCurrency(cob.valor)}</span>
                      </td>
                      <td>
                        <span className="badge badge-atrasado">Atrasado</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
