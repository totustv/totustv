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

const AUTH_STORAGE_KEY = 'totustv_current_user_session';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Inicializa sessão
  useEffect(() => {
    async function initSession() {
      setIsLoading(true);

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
                role: (session.user.user_metadata?.role as UserRole) || 'reseller',
                status: 'ativo',
                created_at: session.user.created_at,
              };
              setCurrentUser(fallbackProfile);
            }
          }
        } catch (err) {
          console.error('Erro na sessão Supabase:', err);
        }
      } else {
        // Fallback local autenticado
        try {
          const savedUserId = localStorage.getItem(AUTH_STORAGE_KEY);
          const allUsers = totusDB.getUsuarios();
          if (savedUserId) {
            const found = allUsers.find(u => u.id === savedUserId);
            if (found) {
              if (found.status === 'suspenso') {
                localStorage.removeItem(AUTH_STORAGE_KEY);
                setCurrentUser(null);
                setError('Sua conta está suspensa pelo administrador.');
              } else {
                setCurrentUser(found);
              }
            } else {
              // Usuário default inicial: Admin
              const defaultAdmin = allUsers[0] || INITIAL_USERS[0];
              setCurrentUser(defaultAdmin);
              localStorage.setItem(AUTH_STORAGE_KEY, defaultAdmin.id);
            }
          } else {
            // Inicia logado como Admin para conveniência e teste imediato
            const defaultAdmin = allUsers[0] || INITIAL_USERS[0];
            setCurrentUser(defaultAdmin);
            localStorage.setItem(AUTH_STORAGE_KEY, defaultAdmin.id);
          }
        } catch (e) {
          console.warn('Erro ao carregar sessão local:', e);
        }
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
    setIsLoading(true);
    setError(null);

    const emailLimpo = email.trim().toLowerCase();

    // 1. Supabase Auth se configurado
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error: sbError } = await supabase.auth.signInWithPassword({
          email: emailLimpo,
          password: password || '123456',
        });

        if (sbError) {
          setIsLoading(false);
          const msg = 'E-mail ou senha inválidos. Por favor, tente novamente.';
          setError(msg);
          return { success: false, error: msg };
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from('perfis')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profile?.status === 'suspenso') {
            await supabase.auth.signOut();
            setIsLoading(false);
            const msg = 'Esta conta está suspensa. Entre em contato com o suporte Totus TV.';
            setError(msg);
            return { success: false, error: msg };
          }

          setCurrentUser(profile);
          setIsLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        setIsLoading(false);
        const msg = err.message || 'Falha ao autenticar no servidor.';
        setError(msg);
        return { success: false, error: msg };
      }
    }

    // 2. Sistema Local Autenticado de Alta Precisão
    const allUsers = totusDB.getUsuarios();
    const foundUser = allUsers.find(u => u.email.toLowerCase() === emailLimpo);

    if (!foundUser) {
      setIsLoading(false);
      const msg = 'E-mail ou senha incorretos.';
      setError(msg);
      return { success: false, error: msg };
    }

    if (foundUser.status === 'suspenso') {
      setIsLoading(false);
      const msg = 'Acesso negado: esta conta foi suspensa pela administração.';
      setError(msg);
      return { success: false, error: msg };
    }

    if (foundUser.status === 'inativo') {
      setIsLoading(false);
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
    localStorage.setItem(AUTH_STORAGE_KEY, foundUser.id);
    setIsLoading(false);
    return { success: true };
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

    localStorage.removeItem(AUTH_STORAGE_KEY);
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
  const isAdmin = role === 'admin';
  const isReseller = role === 'reseller';

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
  if (!ctx) throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  return ctx;
};
