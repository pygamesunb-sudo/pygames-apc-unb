import { useCallback, useEffect, useState } from 'react';
import { Brain, Bug, Code2, GraduationCap, ListChecks } from 'lucide-react';
import TutorCard from '../components/TutorCard';
import TutorChat from '../components/TutorChat';
import TutorExerciseGenerator from '../components/TutorExerciseGenerator';
import TutorConversationSidebar from '../components/TutorConversationSidebar';
import {
  getTutorConversation,
  listTutorConversations,
  updateTutorConversation,
} from '../services/tutorApi';
import { readConversationFromUrl, writeConversationInUrl } from '../tutorHistory';
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
  {
    mode: 'exercise_generator',
    title: 'Tutor de Exercícios',
    description: 'Pratique programação com exercícios gerados especialmente para você.',
    icon: Brain,
    color: '#c4b5fd',
  },
];

const HISTORY_ERROR = 'Não foi possível carregar suas conversas agora.';

function tutorByMode(mode) {
  return TUTORS.find((item) => item.mode === mode) || null;
}

export default function Tutors() {
  const [selected, setSelected] = useState(null);
  const [session, setSession] = useState({ id: undefined, nonce: 0 });
  const [conversations, setConversations] = useState([]);
  const [archived, setArchived] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');

  const refreshHistory = useCallback(async (archivedView = showArchived) => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const rows = await listTutorConversations({
        includeArchived: archivedView,
        limit: 20,
      });
      if (archivedView) setArchived((rows || []).filter((item) => item.archived));
      else setConversations(rows || []);
    } catch {
      setHistoryError(HISTORY_ERROR);
    } finally {
      setHistoryLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    refreshHistory(false);
    const saved = readConversationFromUrl();
    if (!saved) return undefined;
    let cancelled = false;
    getTutorConversation(saved)
      .then((detail) => {
        if (cancelled || !detail) return;
        const tutor = tutorByMode(detail.mode);
        if (!tutor) return;
        setSelected(tutor);
        setSession({ id: detail.conversation_id, nonce: 1 });
      })
      .catch(() => {
        writeConversationInUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [refreshHistory]);

  const openTutor = (tutor) => {
    setSelected(tutor);
    setSession((current) => ({ id: undefined, nonce: current.nonce + 1 }));
    writeConversationInUrl('');
  };

  const openConversation = (item) => {
    const tutor = tutorByMode(item.mode);
    if (!tutor) return;
    setSelected(tutor);
    setSession((current) => ({ id: item.conversation_id, nonce: current.nonce + 1 }));
    writeConversationInUrl(item.conversation_id);
  };

  const startBlank = () => {
    setSession((current) => ({ id: null, nonce: current.nonce + 1 }));
    writeConversationInUrl('');
    if (!selected) setSelected(TUTORS[0]);
  };

  const rememberConversation = useCallback((conversationId) => {
    if (!conversationId) {
      writeConversationInUrl('');
      return;
    }
    writeConversationInUrl(conversationId);
    refreshHistory(showArchived);
  }, [refreshHistory, showArchived]);

  const rename = async (item, title) => {
    await updateTutorConversation(item.conversation_id, { title });
    refreshHistory(showArchived);
  };

  const archive = async (item) => {
    await updateTutorConversation(item.conversation_id, { archived: true });
    if (session.id === item.conversation_id) startBlank();
    refreshHistory(showArchived);
  };

  const restore = async (item) => {
    await updateTutorConversation(item.conversation_id, { archived: false });
    refreshHistory(true);
  };

  const chat = selected?.mode === 'exercise_generator' ? (
    <TutorExerciseGenerator
      key={`exercise-${session.nonce}`}
      title={selected.title}
      description={selected.description}
      initialConversationId={session.id || null}
      onConversationChange={rememberConversation}
      onBack={() => {
        setSelected(null);
        writeConversationInUrl('');
      }}
    />
  ) : selected ? (
    <TutorChat
      key={`${selected.mode}-${session.nonce}`}
      mode={selected.mode}
      surface="page"
      title={selected.title}
      description={selected.description}
      initialConversationId={session.id}
      onConversationChange={rememberConversation}
      onBack={() => {
        setSelected(null);
        writeConversationInUrl('');
      }}
    />
  ) : (
    <>
      <header className="tutors-page__intro">
        <h2>Tutores IA</h2>
        <p>Escolha um perfil. O tutor conduz o raciocínio antes de mostrar uma solução.</p>
      </header>
      <div className="tutors-grid">
        {TUTORS.map((tutor) => (
          <TutorCard key={tutor.mode} tutor={tutor} onSelect={openTutor} />
        ))}
      </div>
    </>
  );

  return (
    <div className="tutors-shell animate-fade-in">
      <TutorConversationSidebar
        conversations={conversations}
        archived={archived}
        loading={historyLoading}
        error={historyError}
        activeId={session.id || ''}
        showArchived={showArchived}
        onToggleArchived={() => {
          const next = !showArchived;
          setShowArchived(next);
          refreshHistory(next);
        }}
        onOpen={openConversation}
        onNew={startBlank}
        onRename={rename}
        onArchive={archive}
        onRestore={restore}
      />
      <div className="tutors-page">
        {chat}
      </div>
    </div>
  );
}
