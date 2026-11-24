
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { getChild } from "@/lib/children";
import {
  CALIBRATION_SUBJECTS,
  saveCalibrationResults,
} from "@/lib/calibrationResults";

import {
  calculateScore,
  climbLadder,
  determineFinalLevel,
  determineResult,
  gradeLevelLabel,
  LOWEST_GRADE,
  shuffleQuestions,
  startingGrade,
  type GradeQuestions,
  type LadderMemory,
} from "@/lib/calibration";

import mathQuestions from "@/lib/calibration/math.json";
import scienceQuestions from "@/lib/calibration/science.json";
import literatureQuestions from "@/lib/calibration/literature.json";

import type { Question } from "@/lib/calibration";

import { supabase } from "@/lib/supabase";

/** Gets one list of questions from the JSON files, in their original order.
 * phase "primary" = the main questions, "secondChance" = the short retry.
 * Returns an empty list if that grade has no questions of that kind.
 */
function getQuestionList(
  subjectName: string,
  grade: number,
  phase: "primary" | "secondChance"
): Question[] {
  const questionData =
    subjectName === "math"
      ? mathQuestions
      : subjectName === "science"
      ? scienceQuestions
      : literatureQuestions;

  const gradeQuestions = questionData[
    `grade${grade}` as keyof typeof questionData
  ] as GradeQuestions;

  return (gradeQuestions[phase] ?? []) as Question[];
}

export default function CalibrationPage({
  searchParams,
}: {
  // The part of the address after "?", e.g. /calibration?childId=abc.
  // Next.js passes it as a Promise; use() below waits for it.
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Which child is taking the test, from /calibration?childId=<id>.
  // null if the page was opened without one (e.g. for testing).
  const childIdParam = use(searchParams).childId;
  const childId = typeof childIdParam === "string" ? childIdParam : null;

  // The child's school grade (from their profile), or null if unknown.
  const [schoolGrade, setSchoolGrade] = useState<number | null>(null);

  // true while the child's profile is loading. The subject buttons wait for
  // it, so the test doesn't start at the wrong grade.
  const [childLoading, setChildLoading] = useState(childId !== null);

  // Load the child's profile once, to find their school grade.
  useEffect(() => {
    if (childId === null) {
      return;
    }
    getChild(childId).then(({ data }) => {
      // data is null if the child wasn't found; the test then starts at Grade 4.
      if (data) {
        setSchoolGrade(data.grade);
      }
      setChildLoading(false);
    });
  }, [childId]);

  // The grade every subject starts at: the child's school grade, kept
  // within Grades 4 to 9. Grade 4 if the school grade is unknown.
  const firstGrade =
    schoolGrade === null ? LOWEST_GRADE : startingGrade(schoolGrade);

  // null until the child picks a subject. The questions are shuffled when a
  // subject is picked (a click only happens in the browser), so the server
  // and the browser never draw the page with two different question orders.
  const [subject, setSubject] = useState<string | null>(null);
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

  // The list being answered right now (main or second chance), already
  // shuffled. Kept in state so the order stays the same while the child
  // answers, instead of changing every time the page redraws.
  const [questions, setQuestions] = useState<Question[]>([]);

  const question = questions[currentQuestion];

  /** Gets the page ready for a new list of questions, in a random order. */
  function startQuestions(
    subjectName: string,
    grade: number,
    newPhase: "primary" | "secondChance"
  ) {
    setQuestions(shuffleQuestions(getQuestionList(subjectName, grade, newPhase)));
    setCurrentGrade(grade);
    setPhase(newPhase);
    setCurrentQuestion(0);
    setAnswers({});
    setStudentAnswer("");
  }

  function changeSubject(
    newSubject: string
  ) {
    // Wait for the child's profile, so the test starts at the right grade.
    if (childLoading) {
      return;
    }

    setSubject(newSubject);

    // A new subject starts at the child's grade with no ladder memory.
    // newSubject is passed in because `subject` only updates on the next redraw.
    startQuestions(newSubject, firstGrade, "primary");
    setLadder({ highestPassed: null, lowestFailed: null });
    setFinished(false);
    setScore(null);
  }

  /** Runs once the child has passed or failed the current grade.
   * climbLadder decides whether to move to another grade or stop.
   */
  function finishGrade(passed: boolean) {
    // Can't happen (questions only show after a subject is picked),
    // but TypeScript needs to know subject isn't null below.
    if (subject === null) {
      return;
    }

    const step = climbLadder(currentGrade, passed, ladder);

    setLadder({
      highestPassed: step.highestPassed,
      lowestFailed: step.lowestFailed,
    });

    if (!step.done) {
      startQuestions(subject, step.nextGrade, "primary");
      return;
    }

    // The level is found: save it for the summary and end this subject.
    setFinished(true);

    // The new results and finished subjects, worked out here (instead of
    // inside the set functions) so they can also be saved just below.
    const newResults = { ...results, [subject]: step.finalGrade };
    const newCompleted = completedSubjects.includes(subject)
      ? completedSubjects
      : [...completedSubjects, subject];

    setResults(newResults);
    setCompletedSubjects(newCompleted);

    // Every subject done → save the results for this child, so they aren't
    // sent to calibration again next time (lib/calibrationResults.ts).
    const allDone = CALIBRATION_SUBJECTS.every((name) =>
      newCompleted.includes(name)
    );
    if (
      allDone &&
      childId !== null &&
      newResults.math !== null &&
      newResults.science !== null &&
      newResults.literature !== null
    ) {
      void saveCalibrationResults(childId, {
        math: newResults.math,
        science: newResults.science,
        literature: newResults.literature,
      });
    }
  }

  function nextQuestion() {
    // Nothing to answer before a subject is picked.
    if (subject === null || !question) {
      return;
    }

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
      const retryQuestions = getQuestionList(subject, currentGrade, "secondChance");

      // Some grades have no second-chance questions yet.
      // Then a score of 60% to 69% counts as not passed.
      if (retryQuestions.length > 0) {
        setPrimaryPercentage(result.percentage);
        startQuestions(subject, currentGrade, "secondChance");
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

      {/* Before a subject is picked, only ask the child to pick one. */}
      {subject === null && (
        <p>
          {childLoading
            ? "Loading your profile…"
            : `Choose a subject to start. Each subject starts at ${gradeLevelLabel(firstGrade)}.`}
        </p>
      )}

      {subject !== null && (
        <>
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
        </>
      )}

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

    {/* All subjects done: the child can go on to the rest of the app. */}
    {completedSubjects.length === CALIBRATION_SUBJECTS.length && childId !== null && (
      <Link href={`/child/welcome?childId=${childId}`}>
        All done! Continue to ThinkFirst →
      </Link>
    )}
  </>
)}
    </div>
  );
}
