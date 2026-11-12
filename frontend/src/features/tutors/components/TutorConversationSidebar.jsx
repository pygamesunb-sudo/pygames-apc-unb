/**
 * peca de tela dos tutores (TutorConversationSidebar.jsx).
 * Branch comment: leitura academica do codigo, sem mudar o comportamento.
 */
import { useState } from 'react';
import TutorConversationGroup from './TutorConversationGroup';
import TutorNewConversationButton from './TutorNewConversationButton';
import { groupConversations } from '../tutorHistory';

export default function TutorConversationSidebar({
  conversations,
  archived,
  loading,
  error,
  activeId,
  showArchived,
  onToggleArchived,
  onOpen,
  onNew,
  onRename,
  onArchive,
  onRestore,
}) {
  const [open, setOpen] = useState(false);
  const groups = groupConversations(showArchived ? archived : conversations);
  const list = showArchived ? archived : conversations;

  const panel = (
    <aside className={`tutor-history ${open ? 'tutor-history--open' : ''}`}>
      <TutorNewConversationButton onClick={() => { setOpen(false); onNew(); }} disabled={loading} />
      {loading && (
        <div className="tutor-history__skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
      {error && <p className="tutor-history__error" role="alert">{error}</p>}
      {!loading && !error && list.length === 0 && (
        <p className="tutor-history__empty">
          {showArchived
            ? 'Nenhuma conversa arquivada.'
            : 'Suas conversas com os tutores aparecerão aqui.'}
        </p>
      )}
      {!loading && groups.map((group) => (
        <TutorConversationGroup
          key={group.id}
          group={group}
          activeId={activeId}
          archiveLabel={showArchived ? 'Restaurar' : 'Arquivar'}
          onOpen={(item) => { setOpen(false); onOpen(item); }}
          onRename={onRename}
          onArchive={showArchived ? onRestore : onArchive}
        />
      ))}
      <button type="button" className="tutor-history__archived" onClick={onToggleArchived}>
        {showArchived ? 'Conversas recentes' : 'Conversas arquivadas'}
      </button>
    </aside>
  );

  return (
    <>
      <button
        type="button"
        className="tutor-history__toggle"
        onClick={() => setOpen(true)}
      >
        Conversas
      </button>
      {open && <button type="button" className="tutor-history__backdrop" aria-label="Fechar conversas" onClick={() => setOpen(false)} />}
      {panel}
    </>
  );
}
