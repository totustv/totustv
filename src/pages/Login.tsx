import React, { useState } from 'react';
import {
  Tv,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, recuperarSenha } = useAuth();
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  const [esqueciSenhaModal, setEsqueciSenhaModal] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState('');
  const [recuperacaoLoading, setRecuperacaoLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSucessoMsg(null);

    if (!email.trim()) {
      setErrorMsg('Por favor, informe seu endereço de e-mail.');
      return;
    }

    if (!senha) {
      setErrorMsg('Por favor, informe sua senha de acesso.');
      return;
    }

    setLoading(true);
    const res = await login(email, senha);
    setLoading(false);

    if (!res.success) {
      const msg = (!res.error || res.error === 'Não autenticado') ? 'E-mail ou senha incorreto.' : res.error;
      setErrorMsg(msg);
    } else {
      if (onSuccess) onSuccess();
    }
  };

  const handleRecuperarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRecuperacao.trim()) return;

    setRecuperacaoLoading(true);
    const res = await recuperarSenha(emailRecuperacao);
    setRecuperacaoLoading(false);

    if (res.success) {
      setSucessoMsg(res.message || 'Instruções de redefinição enviadas!');
      setEsqueciSenhaModal(false);
      setEmailRecuperacao('');
    } else {
      setErrorMsg(res.error || 'Erro ao processar recuperação de senha.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #090d16 100%)',
        position: 'relative',
        padding: '20px',
        overflow: 'hidden',
      }}
    >
      {/* Elementos visuais de fundo futurista / glassmorphism */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '20%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '15%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          zIndex: 10,
        }}
      >
        {/* Card Principal de Login */}
        <div
          className="card login-card"
          style={{
            padding: '36px 32px',
            borderRadius: '24px',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.2)',
          }}
        >
          {/* Brand & Título */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.5)',
                marginBottom: '14px',
              }}
            >
              <Tv size={30} />
            </div>

            <h1
              style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                marginBottom: '4px',
              }}
            >
              TOTUS <span style={{ color: '#818cf8' }}>TV</span>
            </h1>
            <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
              Painel de Controle & Gestão Financeira
            </p>
          </div>

          {/* Feedback de Erro ou Sucesso */}
          {errorMsg && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#fca5a5',
                fontSize: '0.825rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '18px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {sucessoMsg && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#6ee7b7',
                fontSize: '0.825rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '18px',
              }}
            >
              <CheckCircle size={16} style={{ flexShrink: 0 }} />
              <span>{sucessoMsg}</span>
            </div>
          )}

          {/* Formulário de Login */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  marginBottom: '6px',
                  display: 'block',
                }}
              >
                E-mail de Acesso
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                  }}
                />
                <input
                  type="email"
                  id="input-login-email"
                  className="form-control"
                  style={{
                    paddingLeft: '38px',
                    height: '42px',
                    backgroundColor: 'rgba(30, 41, 59, 0.8)',
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                  }}
                  placeholder="seu.email@totustv.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#cbd5e1',
                  }}
                >
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => setEsqueciSenhaModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#818cf8',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Esqueci minha senha
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                  }}
                />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  id="input-login-senha"
                  className="form-control"
                  style={{
                    paddingLeft: '38px',
                    paddingRight: '38px',
                    height: '42px',
                    backgroundColor: 'rgba(30, 41, 59, 0.8)',
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                  }}
                  placeholder="••••••••"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="btn-submit-login"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                height: '44px',
                marginTop: '6px',
                fontSize: '0.95rem',
                fontWeight: 700,
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              }}
            >
              {loading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Modal de Esqueci Minha Senha */}
      {esqueciSenhaModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={18} color="var(--accent-primary)" />
                Recuperação de Senha
              </h2>
              <button onClick={() => setEsqueciSenhaModal(false)} className="btn btn-secondary btn-icon">
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Digite o e-mail cadastrado na sua conta. Se o e-mail existir no sistema, você receberá um link seguro para redefinir sua senha.
            </p>

            <form onSubmit={handleRecuperarSenha} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">E-mail Cadastrado *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="seu.email@totustv.com"
                  value={emailRecuperacao}
                  onChange={e => setEmailRecuperacao(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setEsqueciSenhaModal(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={recuperacaoLoading}
                >
                  {recuperacaoLoading ? 'Enviando...' : 'Enviar Link de Redefinição'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
