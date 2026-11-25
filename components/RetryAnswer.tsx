
"use client";

import { useState } from "react";

type RetryAnswerProps = {
  question: string;
  correctAnswer: string;
  hint: string;
};

export default function RetryAnswer({
  question,
  correctAnswer,
  hint,
}: RetryAnswerProps) {
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [feedback, setFeedback] = useState("");

  function handleSubmit() {
    const submittedAnswer = answer.trim();

    if (!submittedAnswer || isCorrect) return;

    const correct =
      submittedAnswer.toLowerCase() ===
      correctAnswer.trim().toLowerCase();

    setAttempts((previous) => [...previous, submittedAnswer]);

    if (correct) {
      setIsCorrect(true);
      setFeedback("Great job! You got it right!");
    } else {
      setShowHint(true);
      setFeedback(
        "Not quite! Read the hint, change your answer, and try again."
      );
    }
  }

  function handleReset() {
    setAnswer("");
    setAttempts([]);
    setShowHint(false);
    setIsCorrect(false);
    setFeedback("");
  }

  return (
    <section className="mx-auto max-w-2xl rounded-card border border-border bg-surface p-6 shadow-card">
      <p className="text-sm font-semibold text-primary">
        THINKFIRST • PRACTICE
      </p>

      <h2 className="mt-3 text-2xl font-bold text-foreground">
        Try, learn, and try again
      </h2>

      <p className="mt-4 text-lg text-foreground">
        {question}
      </p>

      <label
        htmlFor="student-answer"
        className="mt-6 block text-sm font-semibold"
      >
        Your answer
      </label>

      <input
        id="student-answer"
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        disabled={isCorrect}
        placeholder="Type your answer here"
        className="mt-2 w-full rounded-control border border-border bg-surface px-4 py-3 text-foreground"
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!answer.trim() || isCorrect}
        className="mt-4 rounded-control bg-primary px-6 py-3 font-semibold text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {attempts.length === 0 ? "Submit Answer" : "Try Again"}
      </button>

      {feedback && (
        <div
          role="status"
          className={`mt-5 rounded-control p-4 ${
            isCorrect
              ? "bg-success-soft text-success"
              : "bg-primary-soft text-primary"
          }`}
        >
          {feedback}
        </div>
      )}

      {showHint && !isCorrect && (
        <div className="mt-4 rounded-control border border-border bg-surface-muted p-4">
          <h3 className="font-semibold">💡 Hint</h3>
          <p className="mt-2 text-sm">{hint}</p>
        </div>
      )}

      {attempts.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold">
            Your previous attempts
          </h3>

          <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-muted">
            {attempts.map((attempt, index) => (
              <li key={index}>{attempt}</li>
            ))}
          </ol>
        </div>
      )}

      <button
        type="button"
        onClick={handleReset}
        className="mt-6 text-sm font-medium text-primary underline"
      >
        Restart question
      </button>
    </section>
  );
}
