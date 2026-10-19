import React, { useState } from 'react';
import {
  Settings,
  Database,
  MessageSquare,
  Save,
  RotateCcw,
  Download,
  Upload,
  CheckCircle,
  Shield,
  Key,
  Cloud,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useTotus } from '../context/AppContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { totusDB } from '../lib/db';

export const ConfiguracoesPage: React.FC = () => {
  const { config, salvarConfig, resetarBanco, exportarBackup, importarBackup } = useTotus();
  const [formData, setFormData] = useState({ ...config });
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [backupJson, setBackupJson] = useState('');
  const [sincronizando, setSincronizando] = useState(false);

  const handleSyncSupabase = async () => {
    setSincronizando(true);
    const ok = await totusDB.syncFromSupabase();
    setSincronizando(false);
    if (ok) {
      setMensagemSucesso('Banco de dados sincronizado com a nuvem Supabase!');
      setTimeout(() => setMensagemSucesso(''), 3000);
    } else {
      alert('Não foi possível sincronizar com o Supabase no momento.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    salvarConfig(formData);
    setMensagemSucesso('Configurações salvas com sucesso!');
    setTimeout(() => setMensagemSucesso(''), 3000);
  };

  const handleExportBackup = () => {
    const json = exportarBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `totustv_backup_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = () => {
    if (!backupJson.trim()) return alert('Cole o JSON do backup para importar.');
    if (confirm('Atenção: importar um backup substituirá todos os dados atuais. Deseja continuar?')) {
      const ok = importarBackup(backupJson);
      if (ok) {
        alert('Backup importado com sucesso!');
        setBackupJson('');
      } else {
        alert('Erro ao importar backup: formato de dados inválido.');
      }
    }
  };

  const handleResetBanco = () => {
    if (confirm('Tem certeza que deseja redefinir o banco para os dados originais de fábrica?')) {
      resetarBanco();
      setFormData(config);
      alert('Banco de dados redefinido com sucesso!');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={24} color="var(--accent-primary)" />
          Configurações do Sistema
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          Personalização do negócio, modelos de mensagens do WhatsApp, regras de bônus e backup de dados.
        </p>
      </div>

      {mensagemSucesso && (
        <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: '8px', fontWeight: 600 }}>
          ✓ {mensagemSucesso}
        </div>
      )}

      {/* Formulário de Configurações */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Dados Básicos da Operação */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
            Parâmetros Gerais do Negócio
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Nome do Serviço / Negócio</label>
              <input
                type="text"
                className="form-control"
                value={formData.nome_negocio}
                onChange={e => setFormData({ ...formData, nome_negocio: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Valor Padrão da Mensalidade (R$)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.valor_mensalidade_padrao}
                onChange={e => setFormData({ ...formData, valor_mensalidade_padrao: Number(e.target.value) })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Chave Pix Padrão</label>
              <input
                type="text"
                className="form-control"
                value={formData.chave_pix}
                onChange={e => setFormData({ ...formData, chave_pix: e.target.value })}
                placeholder="Ex: pix@totustv.com.br ou CNPJ"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Telefone de Suporte / Admin</label>
              <input
                type="text"
                className="form-control"
                value={formData.telefone_suporte}
                onChange={e => setFormData({ ...formData, telefone_suporte: e.target.value })}
                placeholder="Ex: 11987654321"
              />
            </div>
          </div>
        </div>

        {/* Modelos de Mensagem do WhatsApp */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <MessageSquare size={20} color="#25d366" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
              Modelos de Mensagens (WhatsApp)
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: '16px' }}>
            Variáveis suportadas: <code>{'{NOME}'}</code>, <code>{'{DATA}'}</code>, <code>{'{VALOR}'}</code>, <code>{'{PIX}'}</code>
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">1. Lembrete: Vencimento Amanhã</label>
              <textarea
                className="form-control"
                rows={2}
                value={formData.msg_lembrete_amanha}
                onChange={e => setFormData({ ...formData, msg_lembrete_amanha: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">2. Lembrete: Vencimento Hoje</label>
              <textarea
                className="form-control"
                rows={2}
                value={formData.msg_lembrete_hoje}
                onChange={e => setFormData({ ...formData, msg_lembrete_hoje: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">3. Cobrança de Fatura Pendente / Atrasada</label>
              <textarea
                className="form-control"
                rows={2}
                value={formData.msg_cobranca_pendente}
                onChange={e => setFormData({ ...formData, msg_cobranca_pendente: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">4. Confirmação de Promessa de Pagamento</label>
              <textarea
                className="form-control"
                rows={2}
                value={formData.msg_promessa_confirmar}
                onChange={e => setFormData({ ...formData, msg_promessa_confirmar: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">5. Recibo / Confirmação de Pagamento Recebido</label>
              <textarea
                className="form-control"
                rows={2}
                value={formData.msg_pagamento_confirmado}
                onChange={e => setFormData({ ...formData, msg_pagamento_confirmado: e.target.value })}
              />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
          <Save size={16} />
          <span>Salvar Todas as Configurações</span>
        </button>
      </form>

      {/* Conexão com Banco de Dados Supabase Cloud */}
      <div className="card" style={{ padding: '24px', borderLeft: '4px solid var(--accent-emerald)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cloud size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Nuvem Supabase (PostgreSQL)
                {isSupabaseConfigured ? (
                  <span className="badge badge-em-dia" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} />
                    Conectado e Operacional
                  </span>
                ) : (
                  <span className="badge badge-atrasado">Desconectado</span>
                )}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', margin: '4px 0 0 0' }}>
                Sincronização em tempo real ativada com persistência em nuvem de alta segurança.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSyncSupabase}
            disabled={sincronizando}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={14} className={sincronizando ? 'spin' : ''} />
            <span>{sincronizando ? 'Sincronizando...' : 'Sincronizar com a Nuvem'}</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: 'var(--bg-tertiary)', padding: '14px', borderRadius: '8px' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 600 }}>PROJETO SUPABASE</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>dukootslvsxfxrgnhnlb</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 600 }}>HOST DO BANCO</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>aws-0-us-east-1.pooler.supabase.com</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 600 }}>STATUS DA BASE</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>Ativo • 14 tabelas criadas</div>
          </div>
        </div>
      </div>

      {/* Banco de Dados, Backup & Restauração */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Database size={20} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
            Gerenciamento de Dados & Backup
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <button onClick={handleExportBackup} className="btn btn-secondary">
            <Download size={16} />
            <span>Exportar Backup Completo (JSON)</span>
          </button>

          <button onClick={handleResetBanco} className="btn btn-secondary" style={{ color: 'var(--accent-rose)' }}>
            <RotateCcw size={16} />
            <span>Redefinir Banco de Dados</span>
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">Restaurar Backup a partir de JSON</label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="Cole o código JSON do backup aqui..."
            value={backupJson}
            onChange={e => setBackupJson(e.target.value)}
          />
          <button onClick={handleImportBackup} className="btn btn-secondary btn-sm" style={{ marginTop: '8px' }}>
            <Upload size={14} />
            <span>Restaurar Backup</span>
          </button>
        </div>
      </div>
    </div>
  );
};
