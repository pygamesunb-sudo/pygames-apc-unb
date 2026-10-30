import { useCallback, useEffect, useRef, useState } from 'react';
import { getTutorConversation, sendTutorMessage, tutorErrorMessage } from '../services/tutorApi';
import { readTutorFocusMode } from '../tutorFocus';
import {
  buildExerciseChatPayload,
  buildGeneratePayload,
  extractPythonCode,
  isGeneratedExercise,
} from '../tutorExerciseModel';

export function useExerciseTutor({ initialConversationId = null, onConversationChange } = {}) {
  const [currentExercise, setCurrentExercise] = useState(null);
  const [messages, setMessages] = useState([]);
  const [theme, setTheme] = useState('espaço');
  const [topic, setTopic] = useState('condicionais');
  const [difficulty, setDifficulty] = useState('facil');
  const [inputType, setInputType] = useState('inteiro');
  const [outputType, setOutputType] = useState('texto');
  const [conversationId, setConversationId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const sendingRef = useRef(false);
  const conversationRef = useRef(null);
  conversationRef.current = conversationId;

  useEffect(() => {
    onConversationChange?.(conversationId);
  }, [conversationId, onConversationChange]);

  useEffect(() => {
    if (!initialConversationId) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const detail = await getTutorConversation(initialConversationId);
        if (cancelled || !detail) return;
        setConversationId(detail.conversation_id);
        conversationRef.current = detail.conversation_id;
        setMessages(detail.messages || []);
        if (detail.exercise) setCurrentExercise(detail.exercise);
        if (detail.theme) setTheme(detail.theme);
        if (detail.topic) setTopic(detail.topic);
        if (detail.difficulty) setDifficulty(detail.difficulty);
        if (detail.input_type) setInputType(detail.input_type);
        if (detail.output_type) setOutputType(detail.output_type);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(tutorErrorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialConversationId]);

  const generateExercise = useCallback(async () => {
    const cleanTheme = theme.trim();
    if (!cleanTheme || sendingRef.current || isGenerating) return false;
    if (messages.length > 0) {
      const confirmed = window.confirm(
        'Gerar outro exercício começa uma conversa nova. O tema e o conteúdo do formulário continuam. Continuar?',
      );
      if (!confirmed) return false;
    }
    sendingRef.current = true;
    setIsGenerating(true);
    setError(null);
    try {
      const data = await sendTutorMessage(buildGeneratePayload({
        theme: cleanTheme,
        topic,
        difficulty,
        inputType,
        outputType,
        focusMode: readTutorFocusMode(),
      }));
      if (!isGeneratedExercise(data.exercise)) {
        setError('Não consegui montar um exercício válido. Tente gerar de novo.');
        return false;
      }
      setCurrentExercise(data.exercise);
      setConversationId(data.conversation_id);
      conversationRef.current = data.conversation_id;
      setMessages([{
        message_id: data.message_id,
        role: 'assistant',
        content: data.reply || '',
      }]);
      return true;
    } catch (err) {
      setError(tutorErrorMessage(err));
      return false;
    } finally {
      sendingRef.current = false;
      setIsGenerating(false);
    }
  }, [difficulty, inputType, isGenerating, messages.length, outputType, theme, topic]);

  const sendMessage = useCallback(async (text) => {
    const message = (text || '').trim();
    if (!message || !conversationRef.current || sendingRef.current) return false;
    sendingRef.current = true;
    setIsSending(true);
    setError(null);
    const localId = `local-${Date.now()}`;
    setMessages((current) => [
      ...current,
      { message_id: localId, role: 'user', content: message, code: extractPythonCode(message) || null },
    ]);
    try {
      const data = await sendTutorMessage(buildExerciseChatPayload({
        conversationId: conversationRef.current,
        message,
        focusMode: readTutorFocusMode(),
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
    theme,
    topic,
    difficulty,
    inputType,
    outputType,
    isGenerating,
    isSending,
    error,
    setTheme,
    setTopic,
    setDifficulty,
    setInputType,
    setOutputType,
    generateExercise,
    sendMessage,
    dismissError: () => setError(null),
  };
}
