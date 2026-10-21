import { useEffect, useState } from 'react';
import { TOPIC_FILTERS, buildReadyExerciseQuery, matchesFilters } from '../readyExercisesModel';
import {
  getReadyExerciseRecommendations,
  getReadyExerciseTopics,
  getReadyExercisesStatus,
  listReadyExercises,
  readyExercisesErrorMessage,
} from '../services/readyExercisesApi';

const PAGE_SIZE = 20;

export function useReadyExercises() {
  const [topic, setTopic] = useState('todos');
  const [difficulty, setDifficulty] = useState('');
  const [completed, setCompleted] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(null);
  const [topics, setTopics] = useState(TOPIC_FILTERS);
  const [exercises, setExercises] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const [requestId, setRequestId] = useState(0);

  const selectTopic = (value) => {
    setTopic(value);
    setPage(1);
  };
  const selectDifficulty = (value) => {
    setDifficulty(value);
    setPage(1);
  };
  const selectCompleted = (value) => {
    setCompleted(value);
    setPage(1);
  };

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const nextStatus = await getReadyExercisesStatus();
        if (!active) return;
        setStatus(nextStatus);
        if (!nextStatus?.available) {
          setUnavailable(true);
          setExercises([]);
          setRecommendations([]);
          setTotal(0);
          return;
        }

        const params = buildReadyExerciseQuery({
          topic,
          difficulty,
          completed,
          page,
          limit: PAGE_SIZE,
        });
        const recommendationParams = buildReadyExerciseQuery({
          topic,
          difficulty,
          page: 1,
          limit: 3,
        });
        delete recommendationParams.page;
        const [list, suggested, topicList] = await Promise.all([
          listReadyExercises(params),
          getReadyExerciseRecommendations(recommendationParams),
          getReadyExerciseTopics(),
        ]);
        if (!active) return;
        const items = Array.isArray(list?.items) ? list.items : [];
        setUnavailable(false);
        setExercises(items.filter((item) => matchesFilters(item, { topic, difficulty, completed })));
        setTotal(Number(list?.total) || 0);
        setRecommendations(Array.isArray(suggested) ? suggested : []);
        setTopics(Array.isArray(topicList) && topicList.length ? topicList : TOPIC_FILTERS);
      } catch (loadError) {
        if (!active) return;
        const unavailableNow = loadError?.response?.status === 503;
        setUnavailable(unavailableNow);
        setError(unavailableNow ? '' : readyExercisesErrorMessage(loadError));
        setExercises([]);
        setRecommendations([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [topic, difficulty, completed, page, requestId]);

  return {
    topic,
    difficulty,
    completed,
    page,
    limit: PAGE_SIZE,
    status,
    topics,
    exercises,
    recommendations,
    total,
    loading,
    error,
    unavailable,
    selectTopic,
    selectDifficulty,
    selectCompleted,
    setPage,
    reload: () => setRequestId((value) => value + 1),
  };
}
