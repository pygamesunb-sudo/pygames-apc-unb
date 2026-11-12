/**
 * peca de tela dos tutores (TutorNewConversationButton.jsx).
 * Branch comment: leitura academica do codigo, sem mudar o comportamento.
 */
export default function TutorNewConversationButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      className="tutor-history__new"
      onClick={onClick}
      disabled={disabled}
    >
      + Nova conversa
    </button>
  );
}
