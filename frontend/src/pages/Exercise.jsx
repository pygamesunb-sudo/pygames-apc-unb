import ProblemSolver from '../components/ProblemSolver';
import { ArrowLeft } from 'lucide-react';
import './Exercise.css';


/**
 * Tela de resolucao do problema gerado.
 */
export default function Exercise({ problem, onSubmit, isSubmitting, result, onBack, validationStatus, isGenerating }) {
  return (
    <div className="exercise-container animate-fade-in">
      <div className="exercise-header">
        <button className="btn-secondary" onClick={onBack} id="back-btn">
          <ArrowLeft size={16} />
          Novo Problema
        </button>
        <div className="flex items-center gap-3">
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>
            ID: <code className="font-mono text-secondary">{problem.problem_id || 'Gerando...'}</code>
          </span>
        </div>
      </div>
      <ProblemSolver
        problem={problem}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        result={result}
        validationStatus={validationStatus}
        isGenerating={isGenerating}
      />
    </div>
  );
}
