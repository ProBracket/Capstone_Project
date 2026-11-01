
"use client";

import { useState } from "react";

import {
  calculateScore,
  determineResult
} from "@/lib/calibration";

import mathQuestions from "@/lib/calibration/math.json";

import type { Question } from "@/lib/calibration";

import { supabase } from "@/lib/supabase";

export default function CalibrationPage() {
  const questions = mathQuestions.grade4.primary as Question[];
  console.log(questions.length);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [answers, setAnswers] = useState<
  Record<number, string>
>({});

const [score, setScore] = useState<{
  correct: number;
  total: number;
  percentage: number;
} | null>(null);

  const question = questions[currentQuestion];

function nextQuestion() {
  const updatedAnswers = {
    ...answers,
    [question.number]: studentAnswer
  };

  setAnswers(updatedAnswers);

  if (currentQuestion < questions.length - 1) {
    setCurrentQuestion(currentQuestion + 1);
    setStudentAnswer("");
  } else {
    const result = calculateScore(
      questions,
      updatedAnswers
    );

    setScore(result);
  }
}

return (
  <div>
    <h1>Math Calibration</h1>

    <p>
      Question {currentQuestion + 1} of {questions.length}
    </p>

    <h2
     style={{
      marginBottom: "20px"
     }}
    >
    {question.question}
    </h2>

    {question.type === "multiple_choice" ? (
      <div>
        {Object.entries(question.choices ?? {}).map(
          ([key, value]) => (
            <label
             key={key}
             style={{
               display: "block",
               marginBottom: "10px"
              }}
            >
              <input
                type="radio"
                style={{
                 marginRight: "8px"
                }}
                name={`question-${question.number}`}
                value={key}
                checked={studentAnswer === key}
                onChange={() =>
                  setStudentAnswer(key)
                }
              />
              {key.toUpperCase()}) {value}
            </label>
          )
        )}
      </div>
    ) : (
      <input
        type="text"
        style={{
         width: "500px",
         height: "40px",
         fontSize: "18px",
         padding: "8px"
        }}
        value={studentAnswer}
        onChange={(e) =>
          setStudentAnswer(e.target.value)
        }
        placeholder="Enter your answer"
      />
    )}

    <button
     onClick={nextQuestion}
     style={{
        marginTop: "20px",
        padding: "10px 20px",
        fontSize: "16px"
      }}
      disabled={!studentAnswer.trim()}
    >
      Next Question
    </button>

    <pre>
      {JSON.stringify(answers, null, 2)}
    </pre>

    {score && (
      <div>
        <h2>Results</h2>

        <p>
          Correct: {score.correct}
        </p>

        <p>
          Total: {score.total}
        </p>

        <p>
          Percentage: {score.percentage.toFixed(1)}%
        </p>

        <p>
          Outcome: {determineResult(score.percentage)}
        </p>
      </div>
    )}
  </div>
);
}