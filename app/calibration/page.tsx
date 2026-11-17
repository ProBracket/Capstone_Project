
"use client";

import { useState } from "react";

import {
  calculateScore,
  determineResult,
  determineNextGrade,
} from "@/lib/calibration";

import mathQuestions from "@/lib/calibration/math.json";
import scienceQuestions from "@/lib/calibration/science.json";
import literatureQuestions from "@/lib/calibration/literature.json";

import type { Question } from "@/lib/calibration";

import { supabase } from "@/lib/supabase";

export default function CalibrationPage() {
  const [subject, setSubject] = useState("math");
  const [currentGrade, setCurrentGrade] =
    useState(4);
  const [highestPassedGrade, setHighestPassedGrade] =
  useState(4);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [studentAnswer, setStudentAnswer] =
    useState("");

  const [answers, setAnswers] = useState<
    Record<number, string>
  >({});

  const [score, setScore] = useState<{
    correct: number;
    total: number;
    percentage: number;
  } | null>(null);

  const [results, setResults] = useState({
  math: null as number | null,
  science: null as number | null,
  literature: null as number | null,
});

const [completedSubjects, setCompletedSubjects] =
  useState<string[]>([]);

  const questionData =
    subject === "math"
      ? mathQuestions
      : subject === "science"
      ? scienceQuestions
      : literatureQuestions;

  const questions =
    questionData[
      `grade${currentGrade}` as keyof typeof questionData
    ].primary as Question[];

  const question = questions[currentQuestion];

  function changeSubject(
    newSubject: string
  ) {
    setSubject(newSubject);

    setCurrentGrade(4);
    setHighestPassedGrade(4);

    setCurrentQuestion(0);
    setAnswers({});
    setStudentAnswer("");
    setScore(null);
  }

  function nextQuestion() {
    const updatedAnswers = {
      ...answers,
      [question.number]:
        studentAnswer,
    };

    setAnswers(updatedAnswers);

    if (
      currentQuestion <
      questions.length - 1
    ) {
      setCurrentQuestion(
        currentQuestion + 1
      );

      setStudentAnswer("");
      return;
    }

    const result = calculateScore(
      questions,
      updatedAnswers
    );

    const nextGrade =
      determineNextGrade(
        currentGrade,
        result.percentage
      );

      if (result.percentage >= 70) {
         setHighestPassedGrade(currentGrade);
      }

    if (
      nextGrade !== currentGrade
    ) {
      setCurrentGrade(nextGrade);

      setCurrentQuestion(0);
      setAnswers({});
      setStudentAnswer("");

      return;
    }

    setScore(result);

const finalGrade =
  result.percentage >= 70
    ? currentGrade
    : highestPassedGrade;

setResults((prev) => ({
  ...prev,
  [subject]: finalGrade,
}));

setCompletedSubjects((prev) =>
  prev.includes(subject)
    ? prev
    : [...prev, subject]
);
  }

  return (
    <div>
      <h1>Calibration</h1>

      <div
        style={{
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() =>
            changeSubject("math")
          }
        >
          Math
        </button>

        <button
          onClick={() =>
            changeSubject(
              "science"
            )
          }
          style={{
            marginLeft: "10px",
          }}
        >
          Science
        </button>

        <button
          onClick={() =>
            changeSubject(
              "literature"
            )
          }
          style={{
            marginLeft: "10px",
          }}
        >
          Literature
        </button>
      </div>

      <h2
        style={{
          textTransform:
            "capitalize",
        }}
      >
        {subject} Calibration
      </h2>

      <p>
        Current Grade: Grade{" "}
        {currentGrade}
      </p>
      <p>
       Highest Passed Grade: {highestPassedGrade}
      </p>

      <p>
        Question{" "}
        {currentQuestion + 1} of{" "}
        {questions.length}
      </p>

      <h2
        style={{
          marginBottom: "20px",
        }}
      >
        {question.question}
      </h2>

      {question.type ===
      "multiple_choice" ? (
        <div>
          {Object.entries(
            question.choices ?? {}
          ).map(
            ([key, value]) => (
              <label
                key={key}
                style={{
                  display: "block",
                  marginBottom:
                    "10px",
                }}
              >
                <input
                  type="radio"
                  name={`question-${question.number}`}
                  value={key}
                  checked={
                    studentAnswer ===
                    key
                  }
                  onChange={() =>
                    setStudentAnswer(
                      key
                    )
                  }
                  style={{
                    marginRight:
                      "8px",
                  }}
                />
                {key.toUpperCase()}){" "}
                {value}
              </label>
            )
          )}
        </div>
      ) : (
        <input
          type="text"
          value={studentAnswer}
          onChange={(e) =>
            setStudentAnswer(
              e.target.value
            )
          }
          placeholder="Enter your answer"
          style={{
            width: "500px",
            height: "40px",
            fontSize: "18px",
            padding: "8px",
          }}
        />
      )}

      <br />

      <button
        onClick={nextQuestion}
        style={{
          marginTop: "20px",
          padding:
            "10px 20px",
          fontSize: "16px",
        }}
        disabled={
          !studentAnswer.trim()
        }
      >
        Next Question
      </button>

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
            Percentage:{" "}
            {score.percentage.toFixed(
              1
            )}
            %
          </p>

          <p>
            Outcome:{" "}
            {determineResult(
              score.percentage
            )}
          </p>

          <p>
            Final Grade:
            {" "}
            Grade{" "}
            {highestPassedGrade}
          </p>
        </div>
      )}
      {completedSubjects.length > 0 && (
  <>
    <h2>Completed Subject Levels</h2>

    <p>
      Math: Grade {results.math ?? "-"}
    </p>

    <p>
      Science: Grade {results.science ?? "-"}
    </p>

    <p>
      Literature: Grade {results.literature ?? "-"}
    </p>
  </>
)}
    </div>
  );
}