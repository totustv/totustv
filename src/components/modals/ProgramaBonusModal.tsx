import React, { useState } from 'react';
import {
  X,
  Gift,
  Cake,
  Share2,
  Sparkles,
  Star,
  Trophy,
  Award,
  Crown,
  Smile,
  Tag,
  Zap,
  Check,
  Trash2,
} from 'lucide-react';
import { ProgramaBonus } from '../../types';
import { useTotus } from '../../context/AppContext';
import { BONUS_ICON_MAP } from '../../lib/bonusIcons';

interface ProgramaBonusModalProps {
  programaParaEditar?: ProgramaBonus | null;
  onClose: () => void;
}

const PALETA_CORES = [
  { cor: '#6366f1', nome: 'Índigo' },
  { cor: '#ec4899', nome: 'Rosa' },
  { cor: '#10b981', nome: 'Esmeralda' },
  { cor: '#f59e0b', nome: 'Âmbar' },
  { cor: '#06b6d4', nome: 'Ciano' },
  { cor: '#8b5cf6', nome: 'Violeta' },
  { cor: '#f43f5e', nome: 'Rubi' },
  { cor: '#3b82f6', nome: 'Azul' },
];

export const ProgramaBonusModal: React.FC<ProgramaBonusModalProps> = ({
  programaParaEditar,
  onClose,
}) => {
  const { salvarProgramaBonus, deletarProgramaBonus, programasBonus } = useTotus();

  // Sugere um título padrão baseado na quantidade de programas existentes
  const proximoNumero = (programasBonus?.length || 2) + 1;
  const [titulo, setTitulo] = useState(
    programaParaEditar?.titulo || `Bônus ${proximoNumero}: `
  );
  const [descricao, setDescricao] = useState(programaParaEditar?.descricao || '');
  const [cor, setCor] = useState(programaParaEditar?.cor || '#6366f1');
  const [icone, setIcone] = useState(programaParaEditar?.icone || 'Gift');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return alert('Por favor, informe o título do bônus.');
    if (!descricao.trim()) return alert('Por favor, informe a descrição ou regra do bônus.');

    salvarProgramaBonus({
      id: programaParaEditar?.id,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      cor,
      icone,
      ativo: true,
    });

    onClose();
  };

  const handleDelete = () => {
    if (!programaParaEditar) return;
    if (confirm(`Tem certeza que deseja excluir o card "${programaParaEditar.titulo}"?`)) {
      deletarProgramaBonus(programaParaEditar.id);
      onClose();
    }
  };

  const IconePreview = BONUS_ICON_MAP[icone] || Gift;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '560px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color={cor} />
            {programaParaEditar ? 'Editar Card de Bônus' : 'Criar Novo Bônus'}
          </h2>
          <button onClick={onClose} className="btn btn-secondary btn-icon" title="Fechar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Título */}
          <div className="form-group">
            <label className="form-label">Título do Bônus *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: Bônus 3: Fidelidade Semestral"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Descrição */}
          <div className="form-group">
            <label className="form-label">Descrição / Regra do Benefício *</label>
            <textarea
              className="form-control"
              placeholder="Descreva a regra de concessão ou benefício que o cliente recebe..."
              rows={3}
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              required
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Seletor de Cores */}
          <div className="form-group">
            <label className="form-label">Cor de Destaque do Card</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {PALETA_CORES.map(p => (
                <button
                  type="button"
                  key={p.cor}
                  onClick={() => setCor(p.cor)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: p.cor,
                    border: cor === p.cor ? '3px solid #fff' : '2px solid transparent',
                    boxShadow: cor === p.cor ? `0 0 0 2px ${p.cor}` : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    transition: 'all 0.15s ease',
                  }}
                  title={p.nome}
                >
                  {cor === p.cor && <Check size={16} strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {/* Seletor de Ícones */}
          <div className="form-group">
            <label className="form-label">Ícone do Bônus</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {Object.keys(BONUS_ICON_MAP).map(iconKey => {
                const IconComp = BONUS_ICON_MAP[iconKey];
                const active = icone === iconKey;
                return (
                  <button
                    type="button"
                    key={iconKey}
                    onClick={() => setIcone(iconKey)}
                    className="btn btn-secondary btn-icon"
                    style={{
                      border: active ? `2px solid ${cor}` : '1px solid var(--border-subtle)',
                      backgroundColor: active ? `${cor}20` : 'var(--bg-tertiary)',
                      color: active ? cor : 'var(--text-muted)',
                    }}
                    title={iconKey}
                  >
                    <IconComp size={18} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pré-visualização do Card em tempo real */}
          <div>
            <label className="form-label" style={{ marginBottom: '6px' }}>Pré-visualização do Card:</label>
            <div
              className="card"
              style={{
                borderLeft: `4px solid ${cor}`,
                padding: '16px',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <IconePreview size={20} color={cor} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {titulo.trim() || 'Título do Bônus'}
                </span>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                {descricao.trim() || 'Aqui aparecerá a descrição da regra do seu novo bônus...'}
              </p>
            </div>
          </div>

          {/* Botões do Rodapé */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            {programaParaEditar ? (
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-secondary"
                style={{ color: 'var(--accent-rose)', borderColor: 'rgba(244, 63, 94, 0.3)' }}
              >
                <Trash2 size={16} />
                <span>Excluir Card</span>
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ backgroundColor: cor, borderColor: cor }}
              >
                <Check size={16} />
                <span>{programaParaEditar ? 'Salvar Alterações' : 'Criar Bônus'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
