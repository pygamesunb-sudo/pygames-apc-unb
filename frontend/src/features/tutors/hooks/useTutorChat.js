/**
 * estado de conversa dos tutores no navegador (useTutorChat.js).
 * Branch comment: leitura academica do codigo, sem mudar o comportamento.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getTutorConversation,
  listTutorConversations,
  sendTutorMessage,
  tutorErrorMessage,
} from '../services/tutorApi';
import { readTutorFocusMode } from '../tutorFocus';

function buildPayload({ mode, surface, conversationId, message, problemId, code }) {
  const payload = { mode, surface, message, focus_mode: readTutorFocusMode() };
  if (conversationId) payload.conversation_id = conversationId;
  if (problemId) payload.problem_id = problemId;
  const trimmedCode = (code || '').trim();
  if (trimmedCode) payload.code = trimmedCode;
  return payload;
}

export function useTutorChat({ mode, surface, problemId = null, code = null, initialConversationId }) {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState(null);
  const sendingRef = useRef(false);
  const loadSeq = useRef(0);
  const contextRef = useRef({ problemId, code });
  contextRef.current = { problemId, code };

  const loadOne = useCallback(async (conversationId) => {
    const seq = ++loadSeq.current;
    setIsLoadingHistory(true);
    setError(null);
    try {
      const detail = await getTutorConversation(conversationId);
      if (seq !== loadSeq.current) return;
      setConversationId(detail.conversation_id);
      setMessages(detail.messages || []);
    } catch (err) {
      if (seq !== loadSeq.current) return;
      setError(tutorErrorMessage(err));
    } finally {
      if (seq === loadSeq.current) setIsLoadingHistory(false);
    }
  }, []);

  const loadLatest = useCallback(async () => {
    const seq = ++loadSeq.current;
    setIsLoadingHistory(true);
    setError(null);
    try {
      const conversations = await listTutorConversations({ limit: 50 });
      if (seq !== loadSeq.current) return;
      const latest = (conversations || []).find(
        (item) => item.mode === mode && item.surface === surface
      );
      if (!latest) {
        setConversationId(null);
        setMessages([]);
        return;
      }
      const detail = await getTutorConversation(latest.conversation_id);
      if (seq !== loadSeq.current) return;
      setConversationId(detail.conversation_id);
      setMessages(detail.messages || []);
    } catch (err) {
      if (seq !== loadSeq.current) return;
      setError(tutorErrorMessage(err));
    } finally {
      if (seq === loadSeq.current) setIsLoadingHistory(false);
    }
  }, [mode, surface]);

  useEffect(() => {
    if (initialConversationId === null) {
      loadSeq.current += 1;
      setConversationId(null);
      setMessages([]);
      setError(null);
      setIsLoadingHistory(false);
      return;
    }
    if (initialConversationId) {
      loadOne(initialConversationId);
      return;
    }
    loadLatest();
  }, [initialConversationId, loadLatest, loadOne]);

  const sendMessage = useCallback(async (text) => {
    const message = (text || '').trim();
    if (!message || sendingRef.current) return false;
    sendingRef.current = true;
    setIsSending(true);
    setError(null);
    const localId = `local-${Date.now()}`;
    setMessages((current) => [
      ...current,
      { message_id: localId, role: 'user', content: message },
    ]);
    try {
      const payload = buildPayload({
        mode,
        surface,
        conversationId,
        message,
        problemId: contextRef.current.problemId,
        code: contextRef.current.code,
      });
      let data;
      try {
        data = await sendTutorMessage(payload);
      } catch (err) {
        if (err?.response?.status !== 404 || !conversationId) throw err;
        setConversationId(null);
        data = await sendTutorMessage({ ...payload, conversation_id: undefined });
      }
      setConversationId(data.conversation_id);
      setMessages((current) => [
        ...current,
        {
          message_id: data.message_id,
          role: 'assistant',
          content: data.reply || '',
          stage: data.stage,
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
  }, [conversationId, mode, surface]);

  const startNewConversation = useCallback(() => {
    loadSeq.current += 1;
    sendingRef.current = false;
    setConversationId(null);
    setMessages([]);
    setError(null);
    setIsSending(false);
    setIsLoadingHistory(false);
  }, []);

  return {
    messages,
    conversationId,
    isSending,
    isLoadingHistory,
    error,
    sendMessage,
    startNewConversation,
    dismissError: () => setError(null),
  };
}
