/**
 * peca de tela dos tutores (TutorConversationItem.jsx).
 * Branch comment: leitura academica do codigo, sem mudar o comportamento.
 */
import TutorConversationMenu from './TutorConversationMenu';

export default function TutorConversationItem({ item, active, archiveLabel, onOpen, onRename, onArchive }) {
  return (
    <div className={`tutor-history__item ${active ? 'tutor-history__item--active' : ''}`}>
      <button type="button" className="tutor-history__open" onClick={() => onOpen(item)}>
        <span>{item.title || item.preview || 'Conversa'}</span>
      </button>
      <TutorConversationMenu
        title={item.title || ''}
        archiveLabel={archiveLabel}
        onRename={(title) => onRename(item, title)}
        onArchive={() => onArchive(item)}
      />
    </div>
  );
}
