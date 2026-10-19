import { createClient } from '@supabase/supabase-js';

// As chaves podem vir de variáveis de ambiente do Vite (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY)
// Se não configuradas ainda, o app utilizará fallback para armazenamento reativo local persistente
// com sincronização instantânea e suporte de importação/exportação de banco de dados.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('sua-url') &&
  !supabaseAnonKey.includes('sua-chave')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
