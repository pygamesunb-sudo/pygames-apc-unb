/**
 * peca de tela dos tutores (TutorConversationMenu.jsx).
 * Branch comment: leitura academica do codigo, sem mudar o comportamento.
 */
import { useEffect, useRef, useState } from 'react';

export default function TutorConversationMenu({ title, archiveLabel = 'Arquivar', onRename, onArchive }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(title || '');
  const [renaming, setRenaming] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!boxRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const save = async () => {
    const next = draft.trim();
    if (!next || next === title) {
      setRenaming(false);
      setOpen(false);
      return;
    }
    await onRename(next);
    setRenaming(false);
    setOpen(false);
  };

  return (
    <div className="tutor-history__menu" ref={boxRef}>
      <button
        type="button"
        className="tutor-history__menu-button"
        aria-label="Opções da conversa"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setDraft(title || '');
          setRenaming(false);
          setOpen((current) => !current);
        }}
      >
        ⋮
      </button>
      {open && (
        <div className="tutor-history__menu-panel" role="menu">
          {renaming ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                save();
              }}
            >
              <input
                className="tutor-history__rename"
                value={draft}
                maxLength={80}
                aria-label="Novo título"
                onChange={(event) => setDraft(event.target.value)}
                onClick={(event) => event.stopPropagation()}
              />
            </form>
          ) : (
            <>
              <button type="button" role="menuitem" onClick={() => setRenaming(true)}>Renomear</button>
              <button
                type="button"
                role="menuitem"
                onClick={async () => {
                  setOpen(false);
                  await onArchive();
                }}
              >
                {archiveLabel}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
