/**
 * Pagina do metodo socratico dos tutores e do tempo minimo de cada sessao.
 */
import { CalendarClock, Clock, MessageCircleQuestion } from 'lucide-react';

export default function SocraticPage() {
  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: 820, margin: '0 auto', display: 'grid', gap: 16 }}>
      <header className="card" style={{ padding: 24 }}>
        <h2 style={{ margin: '0 0 8px' }}>Tutores socráticos</h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Os tutores do Pygame-APC não entregam o programa pronto. Eles perguntam,
          esperam a sua resposta e só então avançam um passo. Esse é o método socrático.
        </p>
      </header>

      <section className="card" style={{ padding: 24, borderColor: 'rgba(245, 158, 11, 0.45)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0 }}>
          <Clock size={18} />
          Observação sobre o tempo da sessão
        </h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          Cada sessão de estudos deve ter pelo menos 1 a 2 horas. Abaixo disso o método
          não rende: a conversa fica curta demais para o raciocínio aparecer, e a tendência
          é pedir a resposta pronta.
        </p>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 0 }}>
          Planeje a sessão com antecedência. Escolha o exercício, o tutor e o horário antes
          de começar. Com esse tempo reservado, o método fica eficiente e deixa de ser
          cópia e cola de resposta.
        </p>
      </section>

      <section className="card" style={{ padding: 24 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0 }}>
          <MessageCircleQuestion size={18} />
          O que é o método socrático
        </h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          Sócrates não dava a conclusão no lugar do aluno. Ele fazia uma pergunta que
          obrigava a pessoa a examinar o que já sabia. No Pygame-APC o tutor faz o mesmo
          com o código: uma pergunta por turno, uma pista, uma explicação curta e, no
          máximo, a estrutura do raciocínio. O programa continua sendo seu.
        </p>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.55, paddingLeft: 18, marginBottom: 0 }}>
          <li>LOGAN ilumina a lógica do problema antes da codificação.</li>
          <li>CAIO pergunta sobre a regra da linguagem e mostra um exemplo genérico, nunca o exercício resolvido.</li>
          <li>DEBI lê o erro com você e não entrega a linha corrigida.</li>
          <li>TITO divide o desafio em entrada, processamento e saída, uma etapa de cada vez.</li>
          <li>MIRA cria o desafio no seu tema e conduz esse mesmo exercício, sem revelar a solução.</li>
        </ul>
      </section>

      <section className="card" style={{ padding: 24 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0 }}>
          <CalendarClock size={18} />
          Como planejar a sessão
        </h3>
        <ol style={{ color: 'var(--text-secondary)', lineHeight: 1.55, paddingLeft: 18, marginBottom: 0 }}>
          <li>Reserve de 1 a 2 horas, sem outra tarefa no meio.</li>
          <li>Decida antes qual exercício e qual tutor vão ocupar esse tempo.</li>
          <li>Leia o enunciado inteiro e anote a entrada e a saída esperadas.</li>
          <li>Escreva um primeiro passo seu. Só então chame o tutor.</li>
          <li>Responda a pergunta do tutor antes de pedir a próxima. O avanço é a sua resposta, não um texto colado.</li>
        </ol>
      </section>
    </div>
  );
}
