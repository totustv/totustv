import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { UserProfile, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { totusDB, INITIAL_USERS } from '../lib/db';

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isReseller: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  recuperarSenha: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  redefinirSenha: (novaSenha: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  trocarPerfilTeste: (userId: string) => void;
  usuariosDisponiveis: UserProfile[];
}

const AUTH_STORAGE_KEY = 'totustv_auth_session_v3';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Inicializa sessão
  useEffect(() => {
    async function initSession() {
      setIsLoading(true);

      // Limpa qualquer resíduo de sessão legada (ex: auto-login antigo salvo em navegadores mobile como Navegador Mi)
      try {
        localStorage.removeItem('totustv_current_user_session');
        localStorage.removeItem('totustv_auth_session_v2');
      } catch (e) {
        console.warn('Erro ao limpar sessões legadas:', e);
      }

      const carregarUsuarioLocal = () => {
        try {
          const savedUserId = localStorage.getItem(AUTH_STORAGE_KEY);
          if (savedUserId) {
            const allUsers = totusDB.getUsuarios();
            const found = allUsers.find(u => u.id === savedUserId);
            if (found) {
              if (found.status === 'suspenso') {
                try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch {}
                setCurrentUser(null);
                setError('Sua conta está suspensa pelo administrador.');
              } else if (found.status === 'inativo') {
                try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch {}
                setCurrentUser(null);
                setError('Sua conta está inativada.');
              } else {
                setCurrentUser(found);
              }
              return;
            }
          }
          // Sem usuário salvo explicitamente após login: SEMPRE exige autenticação na Tela de Login
          setCurrentUser(null);
        } catch (e) {
          console.warn('Erro ao carregar sessão local:', e);
          setCurrentUser(null);
        }
      };

      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Busca perfil no banco Supabase
            const { data: profile } = await supabase
              .from('perfis')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              if (profile.status === 'suspenso') {
                await supabase.auth.signOut();
                setCurrentUser(null);
                setError('Sua conta está suspensa pelo administrador.');
              } else {
                setCurrentUser(profile);
              }
            } else {
              // Se perfil não existe ainda, monta perfil básico
              const fallbackProfile: UserProfile = {
                id: session.user.id,
                email: session.user.email || '',
                nome: session.user.user_metadata?.nome || session.user.email?.split('@')[0] || 'Usuário',
                role: (session.user.user_metadata?.role as UserRole) || 'admin',
                status: 'ativo',
                created_at: session.user.created_at,
              };
              setCurrentUser(fallbackProfile);
            }
          } else {
            // Sem sessão ativa no Supabase Auth: checa se há sessão local ativa
            carregarUsuarioLocal();
          }
        } catch (err) {
          console.error('Erro na sessão Supabase:', err);
          carregarUsuarioLocal();
        }
      } else {
        // Fallback local autenticado
        carregarUsuarioLocal();
      }

      setIsLoading(false);
    }

    initSession();

    // Listener para mudanças de estado do Supabase Auth se ativo
    const client = supabase;
    if (isSupabaseConfigured && client) {
      const { data: authListener } = client.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          setCurrentUser(null);
        } else if (session?.user) {
          const { data: profile } = await client
            .from('perfis')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile && profile.status !== 'suspenso') {
            setCurrentUser(profile);
          }
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);

    const emailLimpo = email.trim().toLowerCase();
    const senhaDigitada = (password || '').trim();

    if (!emailLimpo || !senhaDigitada) {
      const msg = 'E-mail ou senha incorreto.';
      setError(msg);
      return { success: false, error: msg };
    }

    // 1. Verifica primeiro os usuários cadastrados no totusDB (Admin e revendedores locais)
    const allUsers = totusDB.getUsuarios();
    const foundUser = allUsers.find(u => u.email.toLowerCase() === emailLimpo);

    if (foundUser) {
      let senhaSalva = '123456';
      try {
        const customPasswords = JSON.parse(localStorage.getItem('totustv_user_passwords_v1') || '{}');
        if (customPasswords[emailLimpo]) {
          senhaSalva = customPasswords[emailLimpo];
        } else if ((foundUser as any).senhaHash) {
          senhaSalva = (foundUser as any).senhaHash;
        }
      } catch {
        senhaSalva = (foundUser as any).senhaHash || '123456';
      }

      // Se a senha local coincidir
      if (senhaDigitada === senhaSalva) {
        if (foundUser.status === 'suspenso') {
          const msg = 'Acesso negado: esta conta foi suspensa pela administração.';
          setError(msg);
          return { success: false, error: msg };
        }

        if (foundUser.status === 'inativo') {
          const msg = 'Acesso negado: conta inativada.';
          setError(msg);
          return { success: false, error: msg };
        }

        // Registra auditoria de login
        totusDB.registrarLogAuditoria({
          user_id: foundUser.id,
          user_nome: foundUser.nome,
          user_email: foundUser.email,
          acao: 'login',
          tabela: 'auth',
          detalhes: `Login realizado com perfil: ${foundUser.role.toUpperCase()}`,
        });

        // Atualiza último acesso
        foundUser.ultimo_acesso = new Date().toISOString();
        totusDB.salvarUsuario(foundUser);

        setCurrentUser(foundUser);
        try { localStorage.setItem(AUTH_STORAGE_KEY, foundUser.id); } catch {}
        return { success: true };
      }
    }

    // 2. Se não autenticou localmente, tenta autenticar no Supabase Auth (se configurado)
    if (isSupabaseConfigured && supabase) {
      try {
        const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 3500)
        );
        const { data, error: sbError } = await Promise.race([
          supabase.auth.signInWithPassword({
            email: emailLimpo,
            password: senhaDigitada,
          }),
          timeoutPromise,
        ]) as any;

        if (!sbError && data?.user) {
          const { data: profile } = await supabase
            .from('perfis')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profile?.status === 'suspenso') {
            await supabase.auth.signOut();
            const msg = 'Esta conta está suspensa. Entre em contato com o suporte Totus TV.';
            setError(msg);
            return { success: false, error: msg };
          }

          const userProfile: UserProfile = profile || {
            id: data.user.id,
            email: data.user.email || emailLimpo,
            nome: data.user.user_metadata?.nome || emailLimpo.split('@')[0],
            role: (data.user.user_metadata?.role as UserRole) || 'admin',
            status: 'ativo',
            created_at: data.user.created_at,
          };

          setCurrentUser(userProfile);
          try { localStorage.setItem(AUTH_STORAGE_KEY, userProfile.id); } catch {}
          return { success: true };
        }
      } catch (err: any) {
        console.warn('Erro ou timeout ao autenticar no Supabase:', err);
      }
    }

    // Se chegou até aqui, o e-mail ou a senha estão incorretos
    const msg = 'E-mail ou senha incorreto.';
    setError(msg);
    return { success: false, error: msg };
  };

  const logout = async () => {
    if (currentUser) {
      totusDB.registrarLogAuditoria({
        user_id: currentUser.id,
        user_nome: currentUser.nome,
        user_email: currentUser.email,
        acao: 'logout',
        tabela: 'auth',
        detalhes: 'Sessão encerrada com sucesso',
      });
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error(e);
      }
    }

    try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch {}
    setCurrentUser(null);
  };

  const recuperarSenha = async (email: string) => {
    const emailLimpo = email.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(emailLimpo, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, message: 'Link de redefinição enviado para seu e-mail!' };
    }

    // Modo local: valida se o usuário existe
    const allUsers = totusDB.getUsuarios();
    const found = allUsers.find(u => u.email.toLowerCase() === emailLimpo);

    if (found) {
      totusDB.registrarLogAuditoria({
        user_id: found.id,
        user_nome: found.nome,
        user_email: found.email,
        acao: 'solicitar_recuperacao_senha',
        tabela: 'auth',
        detalhes: `Solicitação de link de redefinição de senha para ${found.email}`,
      });
    }

    // Por segurança e boas práticas OWASP, sempre responde de forma neutra
    return {
      success: true,
      message: 'Se este e-mail estiver cadastrado no Totus TV, você receberá as instruções em instantes.',
    };
  };

  const redefinirSenha = async (novaSenha: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) return { success: false, error: error.message };
      return { success: true, message: 'Senha atualizada com sucesso!' };
    }

    if (currentUser) {
      try {
        const customPasswords = JSON.parse(localStorage.getItem('totustv_user_passwords_v1') || '{}');
        customPasswords[currentUser.email.toLowerCase()] = novaSenha;
        localStorage.setItem('totustv_user_passwords_v1', JSON.stringify(customPasswords));
      } catch (e) {
        console.warn('Erro ao salvar senha redefinida:', e);
      }

      totusDB.registrarLogAuditoria({
        user_id: currentUser.id,
        user_nome: currentUser.nome,
        user_email: currentUser.email,
        acao: 'redefinir_senha',
        tabela: 'auth',
        detalhes: 'Senha de acesso redefinida pelo usuário',
      });
    }

    return { success: true, message: 'Senha redefinida com sucesso!' };
  };

  // Troca de perfil rápida para testes de isolamento de dados
  const trocarPerfilTeste = (userId: string) => {
    const allUsers = totusDB.getUsuarios();
    const target = allUsers.find(u => u.id === userId);
    if (target) {
      if (target.status === 'suspenso') {
        alert(`Atenção: O usuário ${target.nome} está com status SUSPENSO. O sistema simulará o bloqueio de acesso.`);
      }
      setCurrentUser(target);
      localStorage.setItem(AUTH_STORAGE_KEY, target.id);
    }
  };

  const usuariosDisponiveis = useMemo(() => {
    return totusDB.getUsuarios();
  }, [currentUser]);

  const role: UserRole = currentUser?.role || 'reseller';
  const isAdmin = currentUser?.role === 'admin';
  const isReseller = currentUser?.role === 'reseller';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAdmin,
        isReseller,
        isLoading,
        error,
        login,
        logout,
        recuperarSenha,
        redefinirSenha,
        trocarPerfilTeste,
        usuariosDisponiveis,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      currentUser: null,
      role: 'reseller' as UserRole,
      isAdmin: false,
      isReseller: false,
      isLoading: false,
      error: null,
      login: async () => ({ success: false, error: 'E-mail ou senha incorreto.' }),
      logout: async () => {},
      recuperarSenha: async () => ({ success: false, message: '', error: 'E-mail não encontrado' }),
      redefinirSenha: async () => ({ success: false, message: '', error: 'Erro ao redefinir senha' }),
      trocarPerfilTeste: () => {},
      usuariosDisponiveis: [],
    };
  }
  return ctx;
};
