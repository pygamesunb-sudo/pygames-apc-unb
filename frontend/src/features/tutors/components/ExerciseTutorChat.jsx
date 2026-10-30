import { forwardRef, useImperativeHandle, useRef } from 'react';
import TutorExerciseChat from './TutorExerciseChat';

const ExerciseTutorChat = forwardRef(function ExerciseTutorChat(props, ref) {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    readDraft() {
      return inputRef.current?.value || '';
    },
    replaceDraft(value) {
      if (inputRef.current) inputRef.current.value = value;
    },
  }));

  return <TutorExerciseChat {...props} inputRef={inputRef} />;
});

export default ExerciseTutorChat;
