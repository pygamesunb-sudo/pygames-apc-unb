/**
 * Pagina de privacidade: e-mail, dados da conta e uso educacional da IA.
 */
import { Mail, Scale, Shield, Sparkles, Wallet } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: 820, margin: '0 auto', display: 'grid', gap: 16 }}>
      <header className="card" style={{ padding: 24 }}>
        <h2 style={{ margin: '0 0 8px' }}>Privacidade e uso de dados</h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          O Pygame-APC é um ambiente de estudo de Algoritmos e Programação de Computadores.
          É dedicado a pessoas maiores de 18 anos e a docentes, profissionais da educação.
          Deve ser usado como recurso pedagógico e instrumento de avaliação.
          Os dados coletados nas experiências não são armazenados nos servidores.
          Eles servem apenas para identificar a persona ideal de aprendizagem.
        </p>
      </header>

      <section className="card" style={{ padding: 24 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0 }}>
          <Scale size={18} />
          O que este projeto adota
        </h3>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.55, paddingLeft: 18, marginBottom: 0 }}>
          <li>Privacidade de dados: o que a experiência observa não fica guardado no servidor.</li>
          <li>Uso da IA na educação, no ensino de programação, para o aluno construir o próprio raciocínio.</li>
          <li>Meio ambiente: a prática de programação também pode tratar do cuidado com o ambiente, sem desperdício de recurso computacional.</li>
          <li>Uso ético: a IA não serve para cola, para enganar outra pessoa nem para pedido ilícito.</li>
          <li>IA gerada por LLM: os tutores usam um modelo de linguagem. A resposta é uma ajuda de estudo e precisa ser conferida.</li>
          <li>Tutores gamificados: o estudo usa jogo, pontos e personagens para manter a prática, sem substituir a aula.</li>
          <li>Não compactuamos com pirataria. O material de estudo e o código devem ser de uso legítimo.</li>
        </ul>
      </section>

      <section className="card" style={{ padding: 24 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0 }}>
          <Mail size={18} />
          Uso do e-mail
        </h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 0 }}>
          O e-mail do login com Google é usado só para fins educativos: reconhecer quem está
          na experiência e ajudar a identificar a persona de aprendizagem. Não é usado para
          propaganda, venda de lista nem para contato fora do estudo. Os dados coletados
          nessa experiência não ficam armazenados nos servidores.
        </p>
      </section>

      <section className="card" style={{ padding: 24 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0 }}>
          <Shield size={18} />
          Dados das experiências
        </h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          O que é observado na experiência de aprendizagem não é gravado em servidor.
          O uso desse dado é único: perceber qual persona de tutor combina melhor com o
          jeito de estudar da pessoa.
        </p>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 0 }}>
          Não informe senha, documento pessoal nem dado de outra pessoa. A experiência
          precisa da atividade de estudo, não da vida privada.
        </p>
      </section>

      <section className="card" style={{ padding: 24 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0 }}>
          <Sparkles size={18} />
          Uso consciente de LLM e IA
        </h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          Os tutores usam um modelo de linguagem só para fins educacionais: explicar um conceito,
          fazer uma pergunta e acompanhar o exercício. A IA não substitui o raciocínio do aluno
          e não entrega o programa pronto.
        </p>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.55, paddingLeft: 18, marginBottom: 0 }}>
          <li>Use o tutor para pensar o próximo passo, não para copiar uma resposta.</li>
          <li>Confira o que o modelo disser. Ele pode errar.</li>
          <li>O uso é de estudo em APC. Não serve para produzir conteúdo fora da disciplina nem para pedir ajuda em ato ilícito.</li>
          <li>O modo foco só reduz o tamanho da resposta. Não guarda diagnóstico.</li>
        </ul>
      </section>

      <section className="card" style={{ padding: 24 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0 }}>
          <Wallet size={18} />
          Chave de API e ferramentas Google
        </h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          Este projeto usa ferramentas Google para educação, com o Gemini.
          Com a chave de API da própria pessoa, a Google libera 20 requisições gratuitas.
          Não nos responsabilizamos por APIs pagas.
        </p>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          A chave não é armazenada no servidor. Cabe à própria pessoa consentir e
          estudar o que essa chave faz antes de usá-la.
        </p>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 0 }}>
          No futuro, o Pygame-APC pode ganhar o uso de IA local e de código aberto,
          para o estudo não depender só do serviço da Google.
        </p>
      </section>
    </div>
  );
}
