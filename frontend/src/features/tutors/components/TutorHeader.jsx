import { ArrowLeft, Plus, X } from 'lucide-react';

export default function TutorHeader({
  title,
  titleId,
  description,
  onBack,
  onClose,
  onNewConversation,
  newConversationDisabled = false,
}) {
  return (
    <header className="tutor-header">
      <div className="tutor-header__row">
        {onBack && (
          <button type="button" className="btn-secondary tutor-header__icon-btn" onClick={onBack}>
            <ArrowLeft size={16} aria-hidden="true" />
            Tutores
          </button>
        )}
        <div className="tutor-header__titles">
          <h2 id={titleId}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <div className="tutor-header__actions">
          <button
            type="button"
            className="btn-secondary tutor-header__icon-btn"
            onClick={onNewConversation}
            disabled={newConversationDisabled}
          >
            <Plus size={16} aria-hidden="true" />
            Nova conversa
          </button>
          {onClose && (
            <button
              type="button"
              className="btn-secondary tutor-header__icon-btn"
              onClick={onClose}
              aria-label="Fechar assistente"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
