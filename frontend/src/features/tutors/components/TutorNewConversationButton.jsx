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
