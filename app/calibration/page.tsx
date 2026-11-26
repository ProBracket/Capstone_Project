
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
// line icons (same icon set as the rest of the app)
import { ArrowRight, BookOpen, Calculator, FlaskConical, Sprout } from "lucide-react";

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

    // ----- WHAT THE CHILD SEES -----
  // Same chunky style as the child pages. Only the look changed:
  // every button still calls the same function as before.
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-3xl">

        {/* ----- TEAL BANNER ----- */}
        <section className="flex items-center gap-5 rounded-3xl border-b-8 border-teal-900 bg-primary px-8 py-6 text-white">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-primary">
            <Sprout aria-hidden="true" size={30} strokeWidth={2.25} />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold">Let&apos;s find your level!</h1>
            <p className="mt-1 font-semibold text-teal-100">
              Answer a few questions in each subject. No pressure, just do your best.
            </p>
          </div>
        </section>

        {/* ----- SUBJECT BUTTONS (same colours as the home page tiles) ----- */}
        {/* The picked subject stays bright, the others fade a little.
            A small "Done" tag shows once a subject's level is found. */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => changeSubject("math")}
            className={`flex items-center gap-3 rounded-2xl border-b-[6px] border-amber-500 bg-amber-300 p-4 text-lg font-extrabold text-amber-950 transition hover:-translate-y-1 ${
              subject !== null && subject !== "math" ? "opacity-60" : ""
            }`}
          >
            <Calculator aria-hidden="true" size={26} strokeWidth={2.25} />
            Math
            {results.math !== null && (
              <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs">Done</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => changeSubject("science")}
            className={`flex items-center gap-3 rounded-2xl border-b-[6px] border-sky-500 bg-sky-300 p-4 text-lg font-extrabold text-sky-950 transition hover:-translate-y-1 ${
              subject !== null && subject !== "science" ? "opacity-60" : ""
            }`}
          >
            <FlaskConical aria-hidden="true" size={26} strokeWidth={2.25} />
            Science
            {results.science !== null && (
              <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs">Done</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => changeSubject("literature")}
            className={`flex items-center gap-3 rounded-2xl border-b-[6px] border-pink-500 bg-pink-300 p-4 text-lg font-extrabold text-pink-950 transition hover:-translate-y-1 ${
              subject !== null && subject !== "literature" ? "opacity-60" : ""
            }`}
          >
            <BookOpen aria-hidden="true" size={26} strokeWidth={2.25} />
            Literature
            {results.literature !== null && (
              <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs">Done</span>
            )}
          </button>
        </div>

        {/* Before a subject is picked, only ask the child to pick one. */}
        {subject === null && (
          <section className="mt-6 rounded-3xl border-2 border-b-8 border-border bg-surface p-8">
            <h2 className="text-2xl font-extrabold">Pick a subject to start</h2>
            <p className="mt-2 text-lg text-muted">
              {childLoading
                ? "Loading your profile…"
                : `Each subject starts at ${gradeLevelLabel(firstGrade)}. You can do them in any order.`}
            </p>
          </section>
        )}

        {/* ----- QUESTION CARD ----- */}
        {/* The questions are hidden once this subject's level is found. */}
        {!finished && question && (
          <section className="mt-6 rounded-3xl border-2 border-b-8 border-border bg-surface p-8">
            {/* grade + question number, and the subject on the right */}
            <div className="flex flex-wrap justify-between gap-2 font-bold text-muted">
              <span>
                Grade {currentGrade} · Question {currentQuestion + 1} of {questions.length}
              </span>
              <span className="capitalize">{subject}</span>
            </div>

            {/* progress through this set of questions */}
            <div
              role="progressbar"
              aria-label="Questions answered"
              aria-valuenow={currentQuestion + 1}
              aria-valuemin={1}
              aria-valuemax={questions.length}
              className="mt-3 h-3 rounded-full bg-surface-muted"
            >
              <div
                className="h-3 rounded-full bg-amber-400"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>

            <p className="mt-3 text-sm text-muted">
              Highest passed grade: {ladder.highestPassed ?? "none yet"}
            </p>

            {phase === "secondChance" && (
              <p className="mt-4 rounded-2xl bg-amber-100 p-3 text-amber-900">
                <strong>Second chance:</strong> a few more questions for this grade.
              </p>
            )}

            {/* the question */}
            <h2 className="mt-6 text-2xl font-extrabold">{question.question}</h2>

            {question.type === "multiple_choice" ? (
              // big answer tiles. Each is still a real radio button
              // (hidden with sr-only), so keyboards and screen readers work.
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {Object.entries(question.choices ?? {}).map(([key, value]) => (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-b-[5px] p-4 text-lg font-bold transition focus-within:ring-4 focus-within:ring-primary/30 ${
                      studentAnswer === key
                        ? "border-primary bg-primary-soft"
                        : "border-border bg-surface hover:bg-surface-muted"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.number}`}
                      value={key}
                      checked={studentAnswer === key}
                      onChange={() => setStudentAnswer(key)}
                      className="sr-only"
                    />
                    {/* the letter box: turns teal when picked */}
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-extrabold ${
                        studentAnswer === key
                          ? "border-primary bg-primary text-on-primary"
                          : "border-border"
                      }`}
                    >
                      {key.toUpperCase()}
                    </span>
                    {value}
                  </label>
                ))}
              </div>
            ) : (
              // typed answer
              <input
                type="text"
                value={studentAnswer}
                onChange={(e) => setStudentAnswer(e.target.value)}
                placeholder="Enter your answer"
                aria-label="Your answer"
                className="mt-5 w-full rounded-2xl border-2 border-border bg-surface p-4 text-lg focus:border-primary focus:outline-none"
              />
            )}

            {/* chunky teal button: locked until an answer is picked */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={nextQuestion}
                disabled={!studentAnswer.trim()}
                className="inline-flex items-center gap-2 rounded-2xl border-b-4 border-teal-900 bg-primary px-7 py-3 text-lg font-extrabold text-on-primary transition hover:bg-primary-hover active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next question
                <ArrowRight aria-hidden="true" size={20} strokeWidth={2.5} />
              </button>
            </div>
          </section>
        )}

        {/* ----- RESULT CARD ----- */}
        {/* The result for this subject, shown once its level is found. */}
        {finished && score && (
          <section className="mt-6 rounded-3xl border-2 border-b-8 border-border bg-surface p-8 text-center">
            <p className="font-bold capitalize text-muted">{subject} result</p>
            <p className="text-6xl font-extrabold text-primary">
              {score.percentage.toFixed(1)}%
            </p>
            <span className="mt-3 inline-block rounded-full bg-amber-100 px-5 py-2 text-lg font-extrabold text-amber-900">
              Your level:{" "}
              {gradeLevelLabel(
                results[subject as keyof typeof results] ?? LOWEST_GRADE
              )}
            </span>

            <div className="mt-6 flex justify-center gap-10 font-bold text-muted">
              <p>
                <span className="block text-2xl text-foreground">{score.correct}</span>
                correct
              </p>
              <p>
                <span className="block text-2xl text-foreground">{score.total}</span>
                questions
              </p>
              <p>
                <span className="block text-2xl capitalize text-foreground">
                  {determineResult(score.percentage)}
                </span>
                outcome
              </p>
            </div>
          </section>
        )}

        {/* ----- LEVELS SO FAR ----- */}
        {completedSubjects.length > 0 && (
          <section className="mt-6 rounded-3xl border-2 border-b-8 border-border bg-surface p-8">
            <h2 className="text-2xl font-extrabold">Your levels so far</h2>

            {/* null = this subject hasn't been done yet, so show "-". */}
            <div className="mt-4 grid grid-cols-3 gap-3 text-center font-extrabold">
              <p className="rounded-2xl border-b-[5px] border-amber-500 bg-amber-300 p-3 text-amber-950">
                Math
                <span className="block font-semibold">
                  {results.math === null ? "-" : gradeLevelLabel(results.math)}
                </span>
              </p>
              <p className="rounded-2xl border-b-[5px] border-sky-500 bg-sky-300 p-3 text-sky-950">
                Science
                <span className="block font-semibold">
                  {results.science === null ? "-" : gradeLevelLabel(results.science)}
                </span>
              </p>
              <p className="rounded-2xl border-b-[5px] border-pink-500 bg-pink-300 p-3 text-pink-950">
                Literature
                <span className="block font-semibold">
                  {results.literature === null ? "-" : gradeLevelLabel(results.literature)}
                </span>
              </p>
            </div>

            {/* All subjects done: the child can go on to the rest of the app. */}
            {completedSubjects.length === CALIBRATION_SUBJECTS.length && childId !== null && (
              <Link
                href={`/child/welcome?childId=${childId}`}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl border-b-4 border-teal-900 bg-primary px-7 py-3 text-lg font-extrabold text-on-primary transition hover:bg-primary-hover active:translate-y-1 active:border-b-0"
              >
                All done! Continue to ThinkFirst
                <ArrowRight aria-hidden="true" size={20} strokeWidth={2.5} />
              </Link>
            )}
          </section>
        )}

      </div>
    </main>
  );
}
