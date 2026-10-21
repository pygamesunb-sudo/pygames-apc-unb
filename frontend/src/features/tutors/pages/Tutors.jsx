import { useState } from 'react';
import { Bug, Code2, GraduationCap, ListChecks } from 'lucide-react';
import TutorCard from '../components/TutorCard';
import TutorChat from '../components/TutorChat';
import '../tutors.css';

const TUTORS = [
  {
    mode: 'apc',
    title: 'Tutor APC',
    description: 'Ajuda com lógica, condicionais, laços, funções e conceitos de APC.',
    icon: GraduationCap,
    color: '#a78bfa',
  },
  {
    mode: 'python',
    title: 'Tutor Python',
    description: 'Ajuda com sintaxe, estruturas de dados e conceitos da linguagem.',
    icon: Code2,
    color: '#22d3ee',
  },
  {
    mode: 'debug',
    title: 'Debugador',
    description: 'Analisa o código do aluno e ajuda a descobrir o erro sem entregar imediatamente a solução.',
    icon: Bug,
    color: '#f59e0b',
  },
  {
    mode: 'practice',
    title: 'Treinador de Exercícios',
    description: 'Ajuda o aluno a raciocinar sobre exercícios passo a passo.',
    icon: ListChecks,
    color: '#10b981',
  },
];

export default function Tutors() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="tutors-page animate-fade-in">
      {selected ? (
        <TutorChat
          key={selected.mode}
          mode={selected.mode}
          surface="page"
          title={selected.title}
          description={selected.description}
          onBack={() => setSelected(null)}
        />
      ) : (
        <>
          <header className="tutors-page__intro">
            <h2>Tutores IA</h2>
            <p>Escolha um perfil. O tutor conduz o raciocínio antes de mostrar uma solução.</p>
          </header>
          <div className="tutors-grid">
            {TUTORS.map((tutor) => (
              <TutorCard key={tutor.mode} tutor={tutor} onSelect={setSelected} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
