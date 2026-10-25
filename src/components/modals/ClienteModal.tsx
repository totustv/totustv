import React, { useState } from 'react';
import { X, UserPlus, Save, Shield, MapPin, Globe, Trash2 } from 'lucide-react';
import { Cliente } from '../../types';
import { useTotus } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrencyInput, parseCurrencyInput, formatPhone } from '../../lib/utils';

interface PaisDDI {
  codigo: string;
  nome: string;
  bandeira: string;
  placeholder: string;
}

const LISTA_PAISES_DDI: PaisDDI[] = [
  { codigo: '+55', nome: 'Brasil', bandeira: '🇧🇷', placeholder: '(21) 99999-9999' },
  { codigo: '+1', nome: 'Estados Unidos', bandeira: '🇺🇸', placeholder: '(555) 123-4567' },
  { codigo: '+351', nome: 'Portugal', bandeira: '🇵🇹', placeholder: '912 345 678' },
  { codigo: '+34', nome: 'Espanha', bandeira: '🇪🇸', placeholder: '612 34 56 78' },
  { codigo: '+44', nome: 'Reino Unido', bandeira: '🇬🇧', placeholder: '7911 123456' },
  { codigo: '+39', nome: 'Itália', bandeira: '🇮🇹', placeholder: '312 345 6789' },
  { codigo: '+49', nome: 'Alemanha', bandeira: '🇩🇪', placeholder: '151 23456789' },
  { codigo: '+33', nome: 'França', bandeira: '🇫🇷', placeholder: '6 12 34 56 78' },
  { codigo: '+81', nome: 'Japão', bandeira: '🇯🇵', placeholder: '90 1234 5678' },
  { codigo: '+54', nome: 'Argentina', bandeira: '🇦🇷', placeholder: '9 11 1234-5678' },
  { codigo: '+595', nome: 'Paraguai', bandeira: '🇵🇾', placeholder: '981 123456' },
  { codigo: '+598', nome: 'Uruguai', bandeira: '🇺🇾', placeholder: '99 123 456' },
  { codigo: '+56', nome: 'Chile', bandeira: '🇨🇱', placeholder: '9 1234 5678' },
  { codigo: '+57', nome: 'Colômbia', bandeira: '🇨🇴', placeholder: '300 123 4567' },
  { codigo: '+591', nome: 'Bolívia', bandeira: '🇧🇴', placeholder: '712 34567' },
  { codigo: '+51', nome: 'Peru', bandeira: '🇵🇪', placeholder: '912 345 678' },
  { codigo: '+52', nome: 'México', bandeira: '🇲🇽', placeholder: '55 1234 5678' },
  { codigo: '+1-CA', nome: 'Canadá', bandeira: '🇨🇦', placeholder: '(555) 123-4567' },
  { codigo: '+244', nome: 'Angola', bandeira: '🇦🇴', placeholder: '923 123 456' },
  { codigo: '+258', nome: 'Moçambique', bandeira: '🇲🇿', placeholder: '84 123 4567' },
  { codigo: '+41', nome: 'Suíça', bandeira: '🇨🇭', placeholder: '78 123 45 67' },
  { codigo: '+353', nome: 'Irlanda', bandeira: '🇮🇪', placeholder: '83 123 4567' },
  { codigo: '+61', nome: 'Austrália', bandeira: '🇦🇺', placeholder: '412 345 678' },
  { codigo: 'outro', nome: 'Outro país', bandeira: '🌐', placeholder: 'Número WhatsApp' },
];

function formatarNumeroPorDdi(raw: string, ddi: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';

  if (ddi === '+55') {
    // Brasil: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    const d = digits.slice(0, 11);
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
  }

  if (ddi === '+1' || ddi === '+1-CA') {
    // EUA / Canadá: (XXX) XXX-XXXX
    const d = digits.slice(0, 10);
    if (d.length <= 3) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
  }

  if (ddi === '+351') {
    // Portugal: XXX XXX XXX
    const d = digits.slice(0, 9);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)}`;
  }

  if (ddi === '+34') {
    // Espanha: XXX XX XX XX
    const d = digits.slice(0, 9);
    if (d.length <= 3) return d;
    if (d.length <= 5) return `${d.slice(0, 3)} ${d.slice(3)}`;
    if (d.length <= 7) return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
  }

  if (ddi === '+44') {
    // Reino Unido: XXXX XXXXXX
    const d = digits.slice(0, 11);
    if (d.length <= 4) return d;
    if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
    return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  }

  // Genérico internacional: agrupado em blocos
  const d = digits.slice(0, 15);
  if (d.length <= 4) return d;
  if (d.length <= 7) return `${d.slice(0, 3)} ${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)} ${d.slice(10)}`;
}

function extrairDdiENumero(whatsappSalvo?: string, paisSalvo?: string): { ddi: string; numero: string; ddiCustom?: string } {
  if (!whatsappSalvo) {
    if (paisSalvo) {
      const matchPais = LISTA_PAISES_DDI.find(p => p.nome.toLowerCase() === paisSalvo.toLowerCase());
      if (matchPais) return { ddi: matchPais.codigo, numero: '' };
    }
    return { ddi: '+55', numero: '' };
  }

  const trimmed = whatsappSalvo.trim();

  // Caso 1: Inicia com '+'
  if (trimmed.startsWith('+')) {
    const ddisOrdenados = [...LISTA_PAISES_DDI]
      .filter(p => p.codigo !== 'outro' && p.codigo !== '+1-CA')
      .sort((a, b) => b.codigo.length - a.codigo.length);

    for (const item of ddisOrdenados) {
      if (trimmed.startsWith(item.codigo)) {
        const resto = trimmed.slice(item.codigo.length).trim();
        return {
          ddi: item.codigo,
          numero: formatarNumeroPorDdi(resto, item.codigo),
        };
      }
    }

    const matchCustom = trimmed.match(/^(\+\d+)\s*(.*)$/);
    if (matchCustom) {
      return {
        ddi: 'outro',
        ddiCustom: matchCustom[1],
        numero: matchCustom[2],
      };
    }
  }

  // Caso 2: País associado
  if (paisSalvo && paisSalvo.toLowerCase() !== 'brasil') {
    const matchPais = LISTA_PAISES_DDI.find(p => p.nome.toLowerCase() === paisSalvo.toLowerCase());
    if (matchPais) {
      return {
        ddi: matchPais.codigo,
        numero: formatarNumeroPorDdi(trimmed, matchPais.codigo),
      };
    }
  }

  // Caso 3: Padrão Brasil com 12 ou 13 dígitos começando com 55
  const digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return {
      ddi: '+55',
      numero: formatarNumeroPorDdi(digits.slice(2), '+55'),
    };
  }

  // Caso padrão Brasil (ex: 21995651510)
  return {
    ddi: '+55',
    numero: formatarNumeroPorDdi(trimmed, '+55'),
  };
}

interface ClienteModalProps {
  cliente?: Cliente | null;
  onClose: () => void;
}

export const ClienteModal: React.FC<ClienteModalProps> = ({ cliente, onClose }) => {
  const { salvarCliente, clientes, config, usuarios, excluirCliente } = useTotus();
  const { currentUser, isAdmin, isReseller } = useAuth();

  const [formData, setFormData] = useState({
    id: cliente?.id || '',
    nome: cliente?.nome || '',
    whatsapp: cliente?.whatsapp || '',
    valor_mensalidade: cliente?.valor_mensalidade ?? config.valor_mensalidade_padrao,
    dia_vencimento: cliente?.dia_vencimento ?? 10,
    data_inicio_servico: cliente?.data_inicio_servico || new Date().toISOString().split('T')[0],
    data_nascimento: cliente?.data_nascimento || '',
    pais: cliente?.pais || 'Brasil',
    estado: cliente?.estado || '',
    cidade: cliente?.cidade || '',
    status: cliente?.status || 'ativo',
    reseller_id: cliente?.reseller_id || (isReseller && currentUser ? currentUser.id : ''),
    indicado_por: cliente?.indicado_por || '',
    observacoes: cliente?.observacoes || '',
  });

  // Estado do Código do País (DDI) e Telefone com Máscara
  const infoDdiInicial = extrairDdiENumero(cliente?.whatsapp, cliente?.pais);
  const [ddiCodigo, setDdiCodigo] = useState<string>(infoDdiInicial.ddi);
  const [customDdi, setCustomDdi] = useState<string>(infoDdiInicial.ddiCustom || '+');
  const [numeroTelefone, setNumeroTelefone] = useState<string>(infoDdiInicial.numero);

  // Estado do Valor em Formato de Real (R$)
  const [valorExibicao, setValorExibicao] = useState<string>(() => {
    const initialNum = cliente?.valor_mensalidade ?? config.valor_mensalidade_padrao;
    return formatCurrencyInput(initialNum);
  });

  // Handler para troca de país/DDI
  const handleDdiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const novoDdi = e.target.value;
    setDdiCodigo(novoDdi);

    const ddiParaMascara = novoDdi === '+1-CA' ? '+1' : novoDdi;
    if (numeroTelefone) {
      const rawDigits = numeroTelefone.replace(/\D/g, '');
      setNumeroTelefone(formatarNumeroPorDdi(rawDigits, ddiParaMascara));
    }

    // Auto-ajusta o campo País se o usuário estiver usando um dos países da lista
    const itemPais = LISTA_PAISES_DDI.find(p => p.codigo === novoDdi && p.codigo !== 'outro');
    if (itemPais) {
      setFormData(prev => ({ ...prev, pais: itemPais.nome }));
    }
  };

  // Handler para digitação do número do WhatsApp com máscara dinâmica
  const handleNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const ddiParaMascara = ddiCodigo === '+1-CA' ? '+1' : ddiCodigo;
    const formatado = formatarNumeroPorDdi(rawValue, ddiParaMascara);
    setNumeroTelefone(formatado);
  };

  // Handler para digitação do valor monetário
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const limpo = val.replace(/[^\d.,]/g, '');
    setValorExibicao(limpo);
    const num = parseCurrencyInput(limpo);
    setFormData(prev => ({ ...prev, valor_mensalidade: num }));
  };

  // Ao sair do campo de valor, formata bonitinho com 2 casas decimais (ex: 28,00)
  const handleValorBlur = () => {
    const num = parseCurrencyInput(valorExibicao);
    setValorExibicao(formatCurrencyInput(num));
    setFormData(prev => ({ ...prev, valor_mensalidade: num }));
  };

  // Extrai dia e mês do aniversário (se houver)
  const parseAnivDiaMes = (val?: string) => {
    if (!val) return { dia: '', mes: '' };
    const parts = val.split('T')[0].split('-');
    if (parts.length === 3) {
      return { dia: parts[2].padStart(2, '0'), mes: parts[1].padStart(2, '0') };
    }
    return { dia: '', mes: '' };
  };

  const initialAniv = parseAnivDiaMes(cliente?.data_nascimento);
  const [anivDia, setAnivDia] = useState<string>(initialAniv.dia);
  const [anivMes, setAnivMes] = useState<string>(initialAniv.mes);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return alert('Informe o nome do cliente');

    const rawDigitosTelefone = numeroTelefone.replace(/\D/g, '');
    if (!rawDigitosTelefone) return alert('Informe o WhatsApp do cliente');

    if (rawDigitosTelefone.length < 8) {
      return alert('O número de WhatsApp informado parece incompleto. Verifique os dígitos informados.');
    }

    const valorNum = parseCurrencyInput(valorExibicao);
    if (isNaN(valorNum) || valorNum <= 0) {
      return alert('Informe um valor de mensalidade válido.');
    }

    if ((anivDia && !anivMes) || (!anivDia && anivMes)) {
      return alert('Para registrar o aniversário, selecione tanto o dia quanto o mês (ou deixe ambos em branco se o cliente não quiser informar).');
    }

    let dataNascFinal = '';
    if (anivDia && anivMes) {
      const anoOrig = cliente?.data_nascimento ? cliente.data_nascimento.split('-')[0] : '2000';
      dataNascFinal = `${anoOrig || '2000'}-${anivMes.padStart(2, '0')}-${anivDia.padStart(2, '0')}`;
    }

    // Monta o telefone final com o DDI selecionado
    const ddiPrefixo = ddiCodigo === '+1-CA' ? '+1' : (ddiCodigo === 'outro' ? (customDdi.trim() || '+') : ddiCodigo);
    const whatsappCompleto = `${ddiPrefixo} ${numeroTelefone}`.trim();

    salvarCliente({
      ...formData,
      whatsapp: whatsappCompleto,
      data_nascimento: dataNascFinal,
      valor_mensalidade: valorNum,
      dia_vencimento: Number(formData.dia_vencimento),
    });
    onClose();
  };

  const paisAtual = LISTA_PAISES_DDI.find(p => p.codigo === ddiCodigo) || LISTA_PAISES_DDI[0];

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} color="var(--accent-primary)" />
            {cliente ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
          </h2>
          <button onClick={onClose} className="btn btn-secondary btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Nome Completo *</label>
            <input
              type="text"
              className="form-control"
              value={formData.nome}
              onChange={e => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: João da Silva"
              required
            />
          </div>

          <div className="modal-grid modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '12px' }}>
            {/* WhatsApp com Código do País (DDI) e Máscara */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>WhatsApp *</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 500 }}>
                  {paisAtual.bandeira} {paisAtual.nome} ({ddiCodigo === '+1-CA' ? '+1' : ddiCodigo})
                </span>
              </label>

              <div style={{ display: 'flex', gap: '6px' }}>
                {/* Seletor de Código do País */}
                <select
                  className="form-control"
                  style={{
                    width: '115px',
                    flexShrink: 0,
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    padding: '8px 4px 8px 8px',
                    cursor: 'pointer',
                    background: 'var(--bg-tertiary)',
                  }}
                  value={ddiCodigo}
                  onChange={handleDdiChange}
                  title="Selecione o código do país do cliente"
                >
                  {LISTA_PAISES_DDI.map(item => (
                    <option key={item.codigo} value={item.codigo}>
                      {item.bandeira} {item.codigo === '+1-CA' ? '+1 (CA)' : `${item.codigo} (${item.nome.slice(0, 10)})`}
                    </option>
                  ))}
                </select>

                {/* Se for DDI customizado "Outro" */}
                {ddiCodigo === 'outro' && (
                  <input
                    type="text"
                    className="form-control"
                    style={{
                      width: '65px',
                      flexShrink: 0,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      padding: '8px 4px',
                      textAlign: 'center',
                    }}
                    value={customDdi}
                    onChange={e => setCustomDdi(e.target.value.startsWith('+') ? e.target.value : `+${e.target.value}`)}
                    placeholder="+DDI"
                    title="Código internacional do país com +"
                  />
                )}

                {/* Input do Número com Máscara Dinâmica */}
                <input
                  type="text"
                  inputMode="tel"
                  className="form-control"
                  style={{
                    flex: 1,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    letterSpacing: '0.3px',
                  }}
                  value={numeroTelefone}
                  onChange={handleNumeroChange}
                  placeholder={paisAtual.placeholder}
                  required
                />
              </div>
            </div>

            {/* Valor da Mensalidade com Formato de Real (R$) */}
            <div className="form-group">
              <label className="form-label">Valor Mensalidade (R$) *</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: 'var(--accent-emerald)',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    zIndex: 1,
                  }}
                >
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="form-control"
                  style={{
                    paddingLeft: '38px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.95rem',
                    color: 'var(--text-main)',
                  }}
                  value={valorExibicao}
                  onChange={handleValorChange}
                  onBlur={handleValorBlur}
                  placeholder="0,00"
                  required
                />
              </div>
            </div>
          </div>

          {/* Localização (País, Estado e Cidade) */}
          <div className="modal-grid modal-grid-3" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.8fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Globe size={13} color="var(--accent-primary)" />
                País
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.pais}
                onChange={e => setFormData({ ...formData, pais: e.target.value })}
                placeholder="Ex: Brasil"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estado (UF)</label>
              <input
                type="text"
                className="form-control"
                value={formData.estado}
                onChange={e => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                placeholder="Ex: SP"
                maxLength={30}
                list="lista-ufs-brasil"
              />
              <datalist id="lista-ufs-brasil">
                <option value="AC" />
                <option value="AL" />
                <option value="AP" />
                <option value="AM" />
                <option value="BA" />
                <option value="CE" />
                <option value="DF" />
                <option value="ES" />
                <option value="GO" />
                <option value="MA" />
                <option value="MT" />
                <option value="MS" />
                <option value="MG" />
                <option value="PA" />
                <option value="PB" />
                <option value="PR" />
                <option value="PE" />
                <option value="PI" />
                <option value="RJ" />
                <option value="RN" />
                <option value="RS" />
                <option value="RO" />
                <option value="RR" />
                <option value="SC" />
                <option value="SP" />
                <option value="SE" />
                <option value="TO" />
              </datalist>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} color="var(--accent-rose)" />
                Cidade
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.cidade}
                onChange={e => setFormData({ ...formData, cidade: e.target.value })}
                placeholder="Ex: São Paulo"
              />
            </div>
          </div>

          <div className="modal-grid modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Dia Preferencial de Vencimento *</label>
              <select
                className="form-control"
                value={formData.dia_vencimento}
                onChange={e => setFormData({ ...formData, dia_vencimento: Number(e.target.value) })}
              >
                <option value={10}>Dia 10</option>
                <option value={20}>Dia 20</option>
                <option value={30}>Dia 30</option>
                <option value={5}>Dia 5 (Especial)</option>
                <option value={15}>Dia 15 (Especial)</option>
                <option value={25}>Dia 25 (Especial)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Aniversário</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-subtle)' }}>Dia e Mês</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '8px' }}>
                <select
                  className="form-control"
                  value={anivDia}
                  onChange={e => setAnivDia(e.target.value)}
                  title="Dia do aniversário"
                >
                  <option value="">Dia</option>
                  {Array.from({ length: 31 }, (_, i) => {
                    const d = String(i + 1).padStart(2, '0');
                    return <option key={d} value={d}>Dia {d}</option>;
                  })}
                </select>

                <select
                  className="form-control"
                  value={anivMes}
                  onChange={e => setAnivMes(e.target.value)}
                  title="Mês do aniversário"
                >
                  <option value="">Mês</option>
                  <option value="01">01 - Janeiro</option>
                  <option value="02">02 - Fevereiro</option>
                  <option value="03">03 - Março</option>
                  <option value="04">04 - Abril</option>
                  <option value="05">05 - Maio</option>
                  <option value="06">06 - Junho</option>
                  <option value="07">07 - Julho</option>
                  <option value="08">08 - Agosto</option>
                  <option value="09">09 - Setembro</option>
                  <option value="10">10 - Outubro</option>
                  <option value="11">11 - Novembro</option>
                  <option value="12">12 - Dezembro</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-grid modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Data de Início do Serviço</label>
              <input
                type="date"
                className="form-control"
                value={formData.data_inicio_servico}
                onChange={e => setFormData({ ...formData, data_inicio_servico: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Indicado por (Padrinho)</label>
              <select
                className="form-control"
                value={formData.indicado_por}
                onChange={e => setFormData({ ...formData, indicado_por: e.target.value })}
              >
                <option value="">Nenhum (Cliente Direto)</option>
                {clientes
                  .filter(c => c.id !== cliente?.id)
                  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Vínculo de Revendedor (Visível e editável por Admin; bloqueado para Revendedor) */}
          {isAdmin ? (
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={14} color="var(--accent-primary)" />
                Revendedor Responsável pela Carteira
              </label>
              <select
                className="form-control"
                value={formData.reseller_id}
                onChange={e => setFormData({ ...formData, reseller_id: e.target.value })}
              >
                <option value="">Totus TV (Direto / Sem Revendedor)</option>
                {usuarios
                  .filter(u => u.role === 'reseller')
                  .map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nome} ({u.email}) {u.status === 'suspenso' ? '[SUSPENSO]' : ''}
                    </option>
                  ))}
              </select>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'block' }}>
                A transferência de carteira preserva integralmente o histórico de faturas e bônus.
              </span>
            </div>
          ) : (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-tertiary)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
              }}
            >
              💼 Este cliente será vinculado automaticamente à sua carteira (<strong>{currentUser?.nome}</strong>).
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Observações Internas (Dispositivos, etc.)</label>
            <textarea
              className="form-control"
              rows={2}
              value={formData.observacoes}
              onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Ex: Smart TV LG sala, 2 telas simultâneas..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            {cliente ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (window.confirm(`Tem certeza que deseja excluir o cliente "${cliente.nome}"? Todas as faturas e registros vinculados serão removidos permanentemente.`)) {
                    try {
                      excluirCliente(cliente.id);
                      onClose();
                    } catch (err: any) {
                      console.error('Erro ao excluir cliente:', err);
                      alert(err?.message || 'Erro ao excluir cliente');
                    }
                  }
                }}
                className="btn btn-secondary"
                style={{ color: 'var(--accent-rose)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              >
                <Trash2 size={16} />
                <span>Excluir Cliente</span>
              </button>
            ) : (
              <div />
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} />
                <span>Salvar Cliente</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
