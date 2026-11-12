/**
 * peca de tela dos tutores (TutorMessage.jsx).
 * Branch comment: leitura academica do codigo, sem mudar o comportamento.
 */
export default function TutorMessage({ message }) {
  const isUser = message.role === 'user';
  return (
    <article
      className={`tutor-message ${isUser ? 'tutor-message--user' : 'tutor-message--tutor'}`}
    >
      <span className="tutor-message__author">{isUser ? 'Você' : 'Tutor'}</span>
      <p className="tutor-message__text">{message.content}</p>
    </article>
  );
}
