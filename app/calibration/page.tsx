
"use client";

import { useState } from "react";

import {
  calculateScore,
  climbLadder,
  determineFinalLevel,
  determineResult,
  gradeLevelLabel,
  LOWEST_GRADE,
  type GradeQuestions,
  type LadderMemory,
} from "@/lib/calibration";

import mathQuestions from "@/lib/calibration/math.json";
import scienceQuestions from "@/lib/calibration/science.json";
import literatureQuestions from "@/lib/calibration/literature.json";

import type { Question } from "@/lib/calibration";

import { supabase } from "@/lib/supabase";

export default function CalibrationPage() {
  const [subject, setSubject] = useState("math");
  const [currentGrade, setCurrentGrade] =
    useState(LOWEST_GRADE);

  // What the grade ladder remembers for this subject (see climbLadder in
  // lib/calibration.ts): the highest grade passed and the lowest grade failed.
  const [ladder, setLadder] = useState<LadderMemory>({
    highestPassed: null,
    lowestFailed: null,
  });

  // Which set of questions the child is answering for this grade:
  // "primary" = the main questions, "secondChance" = the short retry
  // given when the main score is between 60% and 69%.
  const [phase, setPhase] = useState<"primary" | "secondChance">("primary");

  // The main-question score for this grade, kept so the second-chance
  // result can be combined with it (determineFinalLevel).
  const [primaryPercentage, setPrimaryPercentage] = useState(0);

  // true once this subject's level has been found. Hides the questions.
  const [finished, setFinished] = useState(false);

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

  // Both question lists for the current grade.
  const gradeQuestions = questionData[
    `grade${currentGrade}` as keyof typeof questionData
  ] as GradeQuestions;

  // The list being answered right now (main or second chance).
  // ?? [] = an empty list if this grade has no second-chance questions.
  const questions = (gradeQuestions[phase] ?? []) as Question[];

  const question = questions[currentQuestion];

  /** Gets the page ready for a new list of questions. */
  function startQuestions(
    grade: number,
    newPhase: "primary" | "secondChance"
  ) {
    setCurrentGrade(grade);
    setPhase(newPhase);
    setCurrentQuestion(0);
    setAnswers({});
    setStudentAnswer("");
  }

  function changeSubject(
    newSubject: string
  ) {
    setSubject(newSubject);

    // A new subject starts from the bottom of the ladder with no memory.
    startQuestions(LOWEST_GRADE, "primary");
    setLadder({ highestPassed: null, lowestFailed: null });
    setFinished(false);
    setScore(null);
  }

  /** Runs once the child has passed or failed the current grade.
   * climbLadder decides whether to move to another grade or stop.
   */
  function finishGrade(passed: boolean) {
    const step = climbLadder(currentGrade, passed, ladder);

    setLadder({
      highestPassed: step.highestPassed,
      lowestFailed: step.lowestFailed,
    });

    if (!step.done) {
      startQuestions(step.nextGrade, "primary");
      return;
    }

    // The level is found: save it for the summary and end this subject.
    setFinished(true);

    setResults((prev) => ({
      ...prev,
      [subject]: step.finalGrade,
    }));

    setCompletedSubjects((prev) =>
      prev.includes(subject)
        ? prev
        : [...prev, subject]
    );
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

    // The last question of the list was answered: score the list.
    const result = calculateScore(
      questions,
      updatedAnswers
    );
    setScore(result);

    // Second chance finished: passed if determineFinalLevel says "advance"
    // (main score 60%+ and second-chance score 67%+).
    if (phase === "secondChance") {
      finishGrade(
        determineFinalLevel(primaryPercentage, result.percentage) === "advance"
      );
      return;
    }

    // Main questions finished. determineResult gives:
    //   "advance"      = 70% or more → passed
    //   "secondChance" = 60% to 69%  → try the second-chance questions
    //   "stay"         = below 60%   → failed
    const outcome = determineResult(result.percentage);

    if (outcome === "secondChance") {
      const retryQuestions = gradeQuestions.secondChance ?? [];

      // Some grades have no second-chance questions yet.
      // Then a score of 60% to 69% counts as not passed.
      if (retryQuestions.length > 0) {
        setPrimaryPercentage(result.percentage);
        startQuestions(currentGrade, "secondChance");
        return;
      }
    }

    finishGrade(outcome === "advance");
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
        Highest Passed Grade: {ladder.highestPassed ?? "none yet"}
      </p>

      {/* The questions are hidden once this subject's level is found. */}
      {!finished && question && (
        <>
          {phase === "secondChance" && (
            <p>
              <strong>Second chance:</strong> a few more questions for this grade.
            </p>
          )}

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
        </>
      )}

      {/* The result for this subject, shown once its level is found. */}
      {finished && score && (
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
            Final Grade:{" "}
            {gradeLevelLabel(
              results[subject as keyof typeof results] ?? LOWEST_GRADE
            )}
          </p>
        </div>
      )}
      {completedSubjects.length > 0 && (
  <>
    <h2>Completed Subject Levels</h2>

    {/* null = this subject hasn't been done yet, so show "-". */}
    <p>
      Math: {results.math === null ? "-" : gradeLevelLabel(results.math)}
    </p>

    <p>
      Science: {results.science === null ? "-" : gradeLevelLabel(results.science)}
    </p>

    <p>
      Literature: {results.literature === null ? "-" : gradeLevelLabel(results.literature)}
    </p>
  </>
)}
    </div>
  );
}
