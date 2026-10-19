-- ==============================================================================
-- TOTUS TV - SCHEMA COMPLETO DE BANCO DE DADOS (PostgreSQL / Supabase)
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & TIPOS
DO $$ BEGIN
    CREATE TYPE cliente_status AS ENUM ('ativo', 'inativo');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE cobranca_status AS ENUM ('pendente', 'avisado', 'prometeu_pagar', 'pago', 'atrasado', 'cancelado', 'dispensado_bonus', 'dispensado_aniversario');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE forma_pagamento AS ENUM ('pix', 'dinheiro', 'transferencia', 'cartao', 'outro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE promessa_situacao AS ENUM ('aguardando', 'cumprida', 'nao_cumprida');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bonus_tipo AS ENUM ('indicacao', 'aniversario', 'manual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bonus_status AS ENUM ('pendente', 'disponivel', 'utilizado', 'cancelado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE despesa_status AS ENUM ('pendente', 'paga', 'cancelada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE fluxo_tipo AS ENUM ('entrada', 'saida');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABELA DE CONFIGURAÇÕES GERAIS
CREATE TABLE IF NOT EXISTS configuracoes (
    id TEXT PRIMARY KEY DEFAULT 'config_geral',
    nome_negocio TEXT NOT NULL DEFAULT 'Totus TV',
    moeda TEXT NOT NULL DEFAULT 'BRL',
    fuso_horario TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    dias_vencimento_padrao INTEGER[] DEFAULT '{10, 20, 30}',
    valor_mensalidade_padrao NUMERIC(10,2) DEFAULT 35.00,
    telefone_suporte TEXT DEFAULT '',
    msg_lembrete_amanha TEXT DEFAULT 'Olá, {NOME}! Tudo bem? Passando para lembrar que o vencimento da sua mensalidade Totus TV é amanhã, dia {DATA}. Caso precise de alguma informação, estou à disposição!',
    msg_lembrete_hoje TEXT DEFAULT 'Olá, {NOME}! Tudo bem? Passando para avisar que sua mensalidade Totus TV vence hoje, dia {DATA}. Chave Pix para pagamento: {PIX}',
    msg_cobranca_pendente TEXT DEFAULT 'Olá, {NOME}! Tudo bem? Identifiquei que sua mensalidade Totus TV está pendente. Você poderia me informar quando pretende realizar o pagamento?',
    msg_promessa_confirmar TEXT DEFAULT 'Olá, {NOME}! Tudo bem? Estou passando para confirmar o pagamento que combinamos para hoje, referente à sua mensalidade Totus TV.',
    msg_pagamento_confirmado TEXT DEFAULT 'Olá, {NOME}! Pagamento de {VALOR} recebido com sucesso. Obrigado pela preferência e por continuar com a Totus TV! 🎉',
    chave_pix TEXT DEFAULT '',
    permite_duplo_bonus BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    valor_mensalidade NUMERIC(10,2) NOT NULL DEFAULT 35.00,
    dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
    data_cadastro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_inicio_servico DATE NOT NULL DEFAULT CURRENT_DATE,
    data_nascimento DATE,
    pais TEXT DEFAULT 'Brasil',
    estado TEXT,
    cidade TEXT,
    status cliente_status NOT NULL DEFAULT 'ativo',
    reseller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Vinculado ao revendedor
    indicado_por UUID REFERENCES clientes(id) ON DELETE SET NULL,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration de compatibilidade para bancos já criados:
DO $$ BEGIN
    ALTER TABLE clientes ADD COLUMN IF NOT EXISTS reseller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    ALTER TABLE clientes ADD COLUMN IF NOT EXISTS pais TEXT DEFAULT 'Brasil';
    ALTER TABLE clientes ADD COLUMN IF NOT EXISTS estado TEXT;
    ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cidade TEXT;
EXCEPTION
    WHEN others THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_clientes_dia_vencimento ON clientes(dia_vencimento);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes(status);
CREATE INDEX IF NOT EXISTS idx_clientes_indicado ON clientes(indicado_por);
CREATE INDEX IF NOT EXISTS idx_clientes_reseller ON clientes(reseller_id);

-- 5. TABELA DE CICLOS / COBRANÇAS
CREATE TABLE IF NOT EXISTS cobrancas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    competencia_mes INTEGER NOT NULL CHECK (competencia_mes BETWEEN 1 AND 12),
    competencia_ano INTEGER NOT NULL CHECK (competencia_ano >= 2020),
    valor NUMERIC(10,2) NOT NULL CHECK (valor >= 0),
    data_vencimento DATE NOT NULL,
    status cobranca_status NOT NULL DEFAULT 'pendente',
    motivo_cancelamento TEXT,
    bonus_aplicado_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_cliente_competencia UNIQUE (cliente_id, competencia_mes, competencia_ano)
);

CREATE INDEX IF NOT EXISTS idx_cobrancas_cliente ON cobrancas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_vencimento ON cobrancas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_cobrancas_status ON cobrancas(status);

-- 6. TABELA DE HISTÓRICO DE ALTERAÇÃO DE VENCIMENTO
CREATE TABLE IF NOT EXISTS historico_vencimentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    cobranca_id UUID REFERENCES cobrancas(id) ON DELETE CASCADE,
    dia_anterior INTEGER,
    dia_novo INTEGER,
    data_vencimento_anterior DATE,
    data_vencimento_nova DATE,
    motivo TEXT,
    alterado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABELA DE PAGAMENTOS RECEBIDOS (ENTRADAS REAIS)
CREATE TABLE IF NOT EXISTS pagamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cobranca_id UUID NOT NULL REFERENCES cobrancas(id) ON DELETE RESTRICT,
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    valor_pago NUMERIC(10,2) NOT NULL CHECK (valor_pago > 0),
    data_pagamento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    forma_pagamento forma_pagamento NOT NULL DEFAULT 'pix',
    observacao TEXT,
    comprovante_ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pagamento_cobranca UNIQUE (cobranca_id)
);

CREATE INDEX IF NOT EXISTS idx_pagamentos_data ON pagamentos(data_pagamento);
CREATE INDEX IF NOT EXISTS idx_pagamentos_cliente ON pagamentos(cliente_id);

-- 8. TABELA DE PROMESSAS DE PAGAMENTO
CREATE TABLE IF NOT EXISTS promessas_pagamento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    cobranca_id UUID REFERENCES cobrancas(id) ON DELETE CASCADE,
    data_promessa DATE NOT NULL DEFAULT CURRENT_DATE,
    data_combinada DATE NOT NULL,
    valor_prometido NUMERIC(10,2) NOT NULL CHECK (valor_prometido >= 0),
    situacao promessa_situacao NOT NULL DEFAULT 'aguardando',
    observacao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promessas_data_combinada ON promessas_pagamento(data_combinada);
CREATE INDEX IF NOT EXISTS idx_promessas_situacao ON promessas_pagamento(situacao);

-- 9. TABELA DE HISTÓRICO DE CONTATOS / WHATSAPP
CREATE TABLE IF NOT EXISTS contatos_historico (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    cobranca_id UUID REFERENCES cobrancas(id) ON DELETE SET NULL,
    tipo_mensagem TEXT NOT NULL, -- 'lembrete_amanha', 'lembrete_hoje', 'cobranca_pendente', 'promessa_confirmar', 'confirmacao_pagamento', 'manual'
    mensagem_texto TEXT NOT NULL,
    status_envio TEXT NOT NULL DEFAULT 'preparada', -- 'preparada', 'enviada_manual', 'enviada_auto'
    enviado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABELA DE BÔNUS E BENEFÍCIOS
CREATE TABLE IF NOT EXISTS bonus_beneficios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    tipo bonus_tipo NOT NULL,
    status bonus_status NOT NULL DEFAULT 'disponivel',
    indicado_id UUID REFERENCES clientes(id) ON DELETE SET NULL, -- Para bônus de indicação
    competencia_uso_mes INTEGER,
    competencia_uso_ano INTEGER,
    cobranca_dispensada_id UUID REFERENCES cobrancas(id) ON DELETE SET NULL,
    motivo_justificativa TEXT,
    data_concessao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_utilizacao TIMESTAMPTZ,
    CONSTRAINT uq_indicado_bonus UNIQUE (indicado_id) -- Impede que o mesmo indicado gere mais de 1 bônus
);

CREATE INDEX IF NOT EXISTS idx_bonus_cliente ON bonus_beneficios(cliente_id);
CREATE INDEX IF NOT EXISTS idx_bonus_status ON bonus_beneficios(status);

-- 11. TABELA DE CATEGORIAS DE DESPESAS
CREATE TABLE IF NOT EXISTS categorias_despesas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL UNIQUE,
    cor TEXT DEFAULT '#64748b',
    icone TEXT DEFAULT 'Tag',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. TABELA DE DESPESAS
CREATE TABLE IF NOT EXISTS despesas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    descricao TEXT NOT NULL,
    categoria_id UUID REFERENCES categorias_despesas(id) ON DELETE SET NULL,
    categoria_nome TEXT NOT NULL,
    valor NUMERIC(10,2) NOT NULL CHECK (valor > 0),
    data_competencia DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status despesa_status NOT NULL DEFAULT 'pendente',
    forma_pagamento forma_pagamento,
    recorrente BOOLEAN NOT NULL DEFAULT false,
    periodicidade TEXT DEFAULT 'mensal', -- 'mensal', 'anual', 'semanal'
    observacoes TEXT,
    motivo_cancelamento TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_despesas_vencimento ON despesas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_despesas_status ON despesas(status);

-- 13. TABELA CONSOLIDADA DE FLUXO DE CAIXA (LIVRO CAIXA AUDITÁVEL)
CREATE TABLE IF NOT EXISTS fluxo_caixa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_movimento DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo fluxo_tipo NOT NULL,
    valor NUMERIC(10,2) NOT NULL CHECK (valor > 0),
    descricao TEXT NOT NULL,
    origem TEXT NOT NULL, -- 'pagamento_cliente', 'despesa_paga', 'ajuste_manual'
    origem_id UUID, -- id da cobranca/pagamento ou id da despesa
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    forma_pagamento forma_pagamento NOT NULL DEFAULT 'pix',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fluxo_data ON fluxo_caixa(data_movimento);
CREATE INDEX IF NOT EXISTS idx_fluxo_tipo ON fluxo_caixa(tipo);

-- 14. SEED INICIAL DE CATEGORIAS E CONFIGURAÇÃO
INSERT INTO configuracoes (id, nome_negocio, dias_vencimento_padrao, valor_mensalidade_padrao)
VALUES ('config_geral', 'Totus TV', '{10, 20, 30}', 35.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categorias_despesas (nome, cor, icone) VALUES
('Servidores e Hospedagem', '#3b82f6', 'Server'),
('Sistemas e Ferramentas', '#8b5cf6', 'Cpu'),
('Licenças e Assinaturas', '#06b6d4', 'Key'),
('Internet e Telefonia', '#10b981', 'Wifi'),
('Marketing e Tráfego', '#f59e0b', 'Megaphone'),
('Taxas e Tarifas', '#ef4444', 'Percent'),
('Equipamentos', '#6366f1', 'Tv'),
('Outros', '#64748b', 'HelpCircle')
ON CONFLICT (nome) DO NOTHING;

-- ==============================================================================
-- 15. TABELA DE PERFIS DE USUÁRIOS (ADMIN & REVENDEDOR)
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'reseller');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('ativo', 'suspenso', 'inativo');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'reseller',
    status user_status NOT NULL DEFAULT 'ativo',
    telefone TEXT,
    ultimo_acesso TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perfis_role ON perfis(role);
CREATE INDEX IF NOT EXISTS idx_perfis_status ON perfis(status);

-- ==============================================================================
-- 16. TABELA DE LOGS DE AUDITORIA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_nome TEXT,
    user_email TEXT,
    acao TEXT NOT NULL,
    tabela TEXT NOT NULL,
    registro_id TEXT,
    detalhes TEXT,
    dados_anteriores JSONB,
    dados_novos JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs_auditoria(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs_auditoria(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_acao ON logs_auditoria(acao);

-- ==============================================================================
-- 17. FUNÇÕES DE SEGURANÇA HELPER (SECURITY DEFINER com search_path seguro)
-- ==============================================================================

-- Verifica se o usuário atual é admin ativo
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.perfis
        WHERE id = auth.uid()
          AND role = 'admin'
          AND status = 'ativo'
    );
$$;

-- Verifica se o usuário atual é revendedor ativo
CREATE OR REPLACE FUNCTION public.is_active_reseller()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.perfis
        WHERE id = auth.uid()
          AND role = 'reseller'
          AND status = 'ativo'
    );
$$;

-- ==============================================================================
-- 18. HABILITAÇÃO DO ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- ==============================================================================
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE promessas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_vencimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contatos_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_beneficios ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fluxo_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 19. POLÍTICAS RLS ESPECÍFICAS
-- ==============================================================================

-- A) CONFIGURAÇÕES
DROP POLICY IF EXISTS "Permitir leitura de configs para autenticados ativos" ON configuracoes;
CREATE POLICY "Permitir leitura de configs para autenticados ativos"
ON configuracoes FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Permitir alteração de configs apenas para admin" ON configuracoes;
CREATE POLICY "Permitir alteração de configs apenas para admin"
ON configuracoes FOR ALL
USING (public.is_admin());

-- B) PERFIS DE USUÁRIOS
DROP POLICY IF EXISTS "Ver próprio perfil ou admin ver todos" ON perfis;
CREATE POLICY "Ver próprio perfil ou admin ver todos"
ON perfis FOR SELECT
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Apenas admin insere, edita ou exclui perfis" ON perfis;
CREATE POLICY "Apenas admin insere, edita ou exclui perfis"
ON perfis FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin gerencia perfis ou usuario altera seu proprio nome" ON perfis;
CREATE POLICY "Admin gerencia perfis ou usuario altera seu proprio nome"
ON perfis FOR UPDATE
USING (public.is_admin() OR (auth.uid() = id AND role = (SELECT role FROM perfis WHERE id = auth.uid())));

-- C) CLIENTES
-- Leitura: Admin vê todos; Revendedor vê somente da sua carteira (reseller_id = auth.uid())
DROP POLICY IF EXISTS "Leitura de clientes" ON clientes;
CREATE POLICY "Leitura de clientes"
ON clientes FOR SELECT
USING (
    public.is_admin() OR 
    (public.is_active_reseller() AND reseller_id = auth.uid())
);

-- Criação: Admin cadastra livre; Revendedor cadastra somente com seu próprio reseller_id
DROP POLICY IF EXISTS "Insercao de clientes" ON clientes;
CREATE POLICY "Insercao de clientes"
ON clientes FOR INSERT
WITH CHECK (
    public.is_admin() OR 
    (public.is_active_reseller() AND reseller_id = auth.uid())
);

-- Edição: Admin edita tudo; Revendedor edita somente os seus e não pode alterar reseller_id para outro
DROP POLICY IF EXISTS "Atualizacao de clientes" ON clientes;
CREATE POLICY "Atualizacao de clientes"
ON clientes FOR UPDATE
USING (
    public.is_admin() OR 
    (public.is_active_reseller() AND reseller_id = auth.uid())
)
WITH CHECK (
    public.is_admin() OR 
    (public.is_active_reseller() AND reseller_id = auth.uid())
);

-- Exclusão: Apenas Admin
DROP POLICY IF EXISTS "Exclusao de clientes apenas admin" ON clientes;
CREATE POLICY "Exclusao de clientes apenas admin"
ON clientes FOR DELETE
USING (public.is_admin());

-- D) COBRANÇAS
-- Leitura: Admin vê todas; Revendedor vê apenas se o cliente pertencer à sua carteira
DROP POLICY IF EXISTS "Leitura de cobrancas" ON cobrancas;
CREATE POLICY "Leitura de cobrancas"
ON cobrancas FOR SELECT
USING (
    public.is_admin() OR 
    EXISTS (
        SELECT 1 FROM clientes
        WHERE clientes.id = cobrancas.cliente_id
          AND clientes.reseller_id = auth.uid()
    )
);

-- Inserção / Edição de cobranças
DROP POLICY IF EXISTS "Gerenciamento de cobrancas" ON cobrancas;
CREATE POLICY "Gerenciamento de cobrancas"
ON cobrancas FOR ALL
USING (
    public.is_admin() OR 
    EXISTS (
        SELECT 1 FROM clientes
        WHERE clientes.id = cobrancas.cliente_id
          AND clientes.reseller_id = auth.uid()
    )
);

-- E) PAGAMENTOS
DROP POLICY IF EXISTS "Leitura e registro de pagamentos" ON pagamentos;
CREATE POLICY "Leitura e registro de pagamentos"
ON pagamentos FOR ALL
USING (
    public.is_admin() OR 
    EXISTS (
        SELECT 1 FROM clientes
        WHERE clientes.id = pagamentos.cliente_id
          AND clientes.reseller_id = auth.uid()
    )
);

-- F) PROMESSAS DE PAGAMENTO
DROP POLICY IF EXISTS "Acesso a promessas de pagamento" ON promessas_pagamento;
CREATE POLICY "Acesso a promessas de pagamento"
ON promessas_pagamento FOR ALL
USING (
    public.is_admin() OR 
    EXISTS (
        SELECT 1 FROM clientes
        WHERE clientes.id = promessas_pagamento.cliente_id
          AND clientes.reseller_id = auth.uid()
    )
);

-- G) HISTÓRICO DE VENCIMENTOS
DROP POLICY IF EXISTS "Acesso ao historico de vencimentos" ON historico_vencimentos;
CREATE POLICY "Acesso ao historico de vencimentos"
ON historico_vencimentos FOR ALL
USING (
    public.is_admin() OR 
    EXISTS (
        SELECT 1 FROM clientes
        WHERE clientes.id = historico_vencimentos.cliente_id
          AND clientes.reseller_id = auth.uid()
    )
);

-- H) CONTATOS HISTÓRICO
DROP POLICY IF EXISTS "Acesso ao historico de contatos" ON contatos_historico;
CREATE POLICY "Acesso ao historico de contatos"
ON contatos_historico FOR ALL
USING (
    public.is_admin() OR 
    EXISTS (
        SELECT 1 FROM clientes
        WHERE clientes.id = contatos_historico.cliente_id
          AND clientes.reseller_id = auth.uid()
    )
);

-- I) BÔNUS E BENEFÍCIOS
DROP POLICY IF EXISTS "Acesso a bonus e beneficios" ON bonus_beneficios;
CREATE POLICY "Acesso a bonus e beneficios"
ON bonus_beneficios FOR ALL
USING (
    public.is_admin() OR 
    EXISTS (
        SELECT 1 FROM clientes
        WHERE clientes.id = bonus_beneficios.cliente_id
          AND clientes.reseller_id = auth.uid()
    )
);

-- J) CATEGORIAS DE DESPESAS (Visível apenas para Admin)
DROP POLICY IF EXISTS "Categorias de despesas apenas admin" ON categorias_despesas;
CREATE POLICY "Categorias de despesas apenas admin"
ON categorias_despesas FOR ALL
USING (public.is_admin());

-- K) DESPESAS GLOBAIS (Visível e gerenciável apenas por Admin)
DROP POLICY IF EXISTS "Despesas restritas exclusivamente ao admin" ON despesas;
CREATE POLICY "Despesas restritas exclusivamente ao admin"
ON despesas FOR ALL
USING (public.is_admin());

-- L) FLUXO DE CAIXA / LIVRO CAIXA GERAL (Exclusivo Admin)
DROP POLICY IF EXISTS "Fluxo de caixa geral exclusivo do admin" ON fluxo_caixa;
CREATE POLICY "Fluxo de caixa geral exclusivo do admin"
ON fluxo_caixa FOR ALL
USING (public.is_admin());

-- M) LOGS DE AUDITORIA (Admin lê tudo, autenticados podem inserir eventos de suas ações)
DROP POLICY IF EXISTS "Leitura de logs restrita a administradores" ON logs_auditoria;
CREATE POLICY "Leitura de logs restrita a administradores"
ON logs_auditoria FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Insercao de logs por usuarios autenticados" ON logs_auditoria;
CREATE POLICY "Insercao de logs por usuarios autenticados"
ON logs_auditoria FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
