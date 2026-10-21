import { useCallback, useRef, useState } from 'react';
import { generateTutorExercise, sendTutorMessage, tutorErrorMessage } from '../services/tutorApi';
import {
  buildExerciseChatPayload,
  introMessage,
  isTutorExercise,
} from '../tutorExerciseModel';

export function useExerciseTutor() {
  const [currentExercise, setCurrentExercise] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('entrada_saida');
  const [difficulty, setDifficulty] = useState('facil');
  const [conversationId, setConversationId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const sendingRef = useRef(false);
  const exerciseRef = useRef(null);
  const conversationRef = useRef(null);
  exerciseRef.current = currentExercise;
  conversationRef.current = conversationId;

  const generateExercise = useCallback(async () => {
    if (!selectedTopic || sendingRef.current || isGenerating) return false;
    setIsGenerating(true);
    setError(null);
    try {
      const generated = await generateTutorExercise({
        topic: selectedTopic,
        difficulty,
      });
      if (!isTutorExercise(generated)) {
        setError('O exercício veio incompleto. Tente gerar de novo.');
        return false;
      }
      const intro = introMessage(generated);
      intro.message_id = `intro-${Date.now()}`;
      setCurrentExercise(generated);
      setConversationId(null);
      conversationRef.current = null;
      setMessages([intro]);
      return true;
    } catch (err) {
      setError(tutorErrorMessage(err));
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [difficulty, isGenerating, selectedTopic]);

  const sendMessage = useCallback(async (text) => {
    const message = (text || '').trim();
    const exercise = exerciseRef.current;
    if (!message || !exercise || sendingRef.current) return false;
    sendingRef.current = true;
    setIsSending(true);
    setError(null);
    const localId = `local-${Date.now()}`;
    setMessages((current) => [
      ...current,
      { message_id: localId, role: 'user', content: message },
    ]);
    try {
      const data = await sendTutorMessage(buildExerciseChatPayload({
        conversationId: conversationRef.current,
        exercise,
        message,
      }));
      setConversationId(data.conversation_id);
      conversationRef.current = data.conversation_id;
      setMessages((current) => [
        ...current,
        {
          message_id: data.message_id,
          role: 'assistant',
          content: data.reply || '',
        },
      ]);
      return true;
    } catch (err) {
      setError(tutorErrorMessage(err));
      return false;
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
  }, []);

  return {
    currentExercise,
    messages,
    selectedTopic,
    difficulty,
    isGenerating,
    isSending,
    error,
    setSelectedTopic,
    setDifficulty,
    generateExercise,
    sendMessage,
    dismissError: () => setError(null),
  };
}
