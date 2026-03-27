import { useRef, useState } from 'react';
import type { FC, DragEvent } from 'react';
import { Upload, X } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  file: File | null;
  onClear: () => void;
  disabled?: boolean;
}

const ACCEPTED = '.pdf,.docx,.doc,.txt,.pptx,.mp3,.mp4,.wav,.ogg,.m4a';
const MAX_MB = 20;

const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['mp3', 'mp4', 'wav', 'ogg', 'm4a'].includes(ext)) return '🎵';
  if (ext === 'pdf') return '📄';
  if (['docx', 'doc'].includes(ext)) return '📝';
  if (ext === 'pptx') return '📊';
  return '📎';
};

const FileUploader: FC<FileUploaderProps> = ({ onFileSelect, file, onClear, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (f: File): string | null => {
    if (f.size > MAX_MB * 1024 * 1024) return `Файл слишком большой (максимум ${MAX_MB} МБ)`;
    return null;
  };

  const handleFile = (f: File) => {
    const err = validate(f);
    if (err) { setError(err); return; }
    setError(null);
    onFileSelect(f);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = '';
  };

  if (file) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
        borderRadius: '12px', border: '1px solid var(--primary)',
        background: 'var(--primary-light)',
      }}>
        <span style={{ fontSize: '28px', flexShrink: 0 }}>{getFileIcon(file.name)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
            {(file.size / 1024 / 1024).toFixed(1)} МБ
          </p>
        </div>
        {!disabled && (
          <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: 'var(--text-secondary)' }}>
            <X size={18} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept={ACCEPTED} onChange={handleChange} style={{ display: 'none' }} />
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: '12px',
          background: dragOver ? 'var(--primary-light)' : 'var(--tg-theme-secondary-bg-color, var(--bg))',
          padding: '36px 16px',
          textAlign: 'center',
          cursor: disabled ? 'default' : 'pointer',
          transition: 'all 0.2s',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
        }}
      >
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Upload size={22} color="var(--primary)" />
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '15px' }}>
            {dragOver ? 'Отпустите файл' : 'Выберите или перетащите файл'}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
            PDF, DOCX, PPTX, TXT, MP3, MP4, WAV · до {MAX_MB} МБ
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
          {['PDF', 'DOCX', 'MP3', 'MP4', 'WAV'].map((fmt) => (
            <span key={fmt} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'var(--border)', color: 'var(--text-secondary)' }}>
              {fmt}
            </span>
          ))}
        </div>
      </div>
      {error && (
        <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--error)' }}>⚠️ {error}</p>
      )}
    </div>
  );
};

export default FileUploader;
