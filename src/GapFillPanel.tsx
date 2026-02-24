import { useState } from "react";
import { auth } from "./firebase";
import { type GapFillExercise, type GapFillResponse } from "./types";

interface Props {
  conversationId: string;
  onClose: () => void;
  onAdvance: () => void;
}

interface ExerciseState {
  exercise: GapFillExercise;
  answer: string;
  submitted: boolean;
  correct: boolean | null;
}

export default function GapFillPanel({ conversationId, onClose, onAdvance }: Props) {
  const [exercises, setExercises] = useState<ExerciseState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);

  const generateExercises = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(
        `http://127.0.0.1:8000/api/gap-fill/${conversationId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? `Request failed (${res.status})`);
      }

      const data: GapFillResponse = await res.json();
      setExercises(
        data.exercises.map((ex) => ({
          exercise: ex,
          answer: "",
          submitted: false,
          correct: null,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const updateAnswer = (index: number, value: string) => {
    setExercises((prev) =>
      prev.map((e, i) => (i === index ? { ...e, answer: value } : e))
    );
  };

  const checkAnswer = (index: number) => {
    setExercises((prev) => {
      const next = prev.map((e, i) => {
        if (i !== index) return e;
        const correct =
          e.answer.trim().toLowerCase() ===
          e.exercise.phrasal_verb.toLowerCase();
        return { ...e, submitted: true, correct };
      });

      // After updating, check if all are submitted and correct
      const allDone = next.every((e) => e.submitted);
      const allCorrect = next.every((e) => e.correct === true);
      if (allDone && allCorrect) {
        advanceProgress();
      }

      return next;
    });
  };

  const advanceProgress = async () => {
    setAdvancing(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch("http://127.0.0.1:8000/api/progress/advance", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      onAdvance();
    } catch (err) {
      console.error("Failed to advance progress", err);
      setAdvancing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Gap-Fill Practice</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {exercises.length === 0 && !loading && (
          <div className="text-center space-y-3 py-6">
            <p className="text-slate-400">
              Generate exercises based on your conversation.
            </p>
            <button
              onClick={generateExercises}
              className="bg-emerald-600 px-5 py-2 rounded hover:bg-emerald-700 transition-colors"
            >
              Generate Exercises
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        )}

        {advancing && (
          <div className="flex items-center justify-center gap-3 py-4 text-emerald-400">
            <div className="animate-spin h-5 w-5 border-2 border-emerald-400 border-t-transparent rounded-full" />
            <span>Moving to next verb...</span>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        {exercises.map((e, i) => (
          <div key={i} className="bg-slate-700 rounded-lg p-4 space-y-2">
            <p className="text-slate-300">{e.exercise.blank_sentence}</p>
            <div className="flex gap-2">
              <input
                value={e.answer}
                onChange={(ev) => updateAnswer(i, ev.target.value)}
                onKeyDown={(ev) => ev.key === "Enter" && checkAnswer(i)}
                disabled={e.submitted}
                className="flex-1 rounded bg-slate-800 p-2 outline-none disabled:opacity-60"
                placeholder="Fill in the blank..."
              />
              {!e.submitted && (
                <button
                  onClick={() => checkAnswer(i)}
                  className="bg-blue-600 px-4 rounded hover:bg-blue-700"
                >
                  Check
                </button>
              )}
            </div>
            {e.submitted && (
              <p
                className={
                  e.correct ? "text-emerald-400" : "text-red-400"
                }
              >
                {e.correct
                  ? "Correct!"
                  : `Incorrect — the answer is "${e.exercise.phrasal_verb}"`}
              </p>
            )}
          </div>
        ))}

        {exercises.length > 0 && !loading && !advancing && (
          <button
            onClick={generateExercises}
            className="w-full bg-slate-700 py-2 rounded hover:bg-slate-600 transition-colors text-sm text-slate-300"
          >
            Generate New Exercises
          </button>
        )}
      </div>
    </div>
  );
}
