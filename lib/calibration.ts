export type Question = {
  number: number;
  skill: string;
  type: "multiple_choice" | "short_answer";
  question: string;
  answer?: string;
  keywords?: string[];
  choices?: Record<string, string>;

};

export type GradeQuestions = {
  primary: Question[];
  secondChance: Question[];
};


export type SubjectQuestions = {
  grade4: GradeQuestions;
  grade5: GradeQuestions;
  grade6: GradeQuestions;
  grade7: GradeQuestions;
  grade8: GradeQuestions;
  grade9: GradeQuestions;
};



export function getGradeQuestions(
  data: SubjectQuestions,
  grade: number
): GradeQuestions {
  return data[`grade${grade}` as keyof SubjectQuestions];
}



/** Removes commas and spaces used inside numbers, so "8,795" and "8 795"
 * both become "8795". Commas or spaces that are not between two digits
 * (e.g. "yes, gas") are left alone.
 */
function removeNumberSeparators(text: string): string {
  // (\d) = a digit, [,\s] = a comma or a space, (?=\d) = followed by a digit.
  // The digit before is kept ("$1"); only the comma or space is removed.
  return text.replace(/(\d)[,\s](?=\d)/g, "$1");
}

/** Checks one short-answer keyword against the student's answer.
 *
 * Number keywords (e.g. "8795") must match a WHOLE number in the answer,
 * so "88795" or "87950" are not accepted for 8795.
 * Word keywords (e.g. "gas") only need to appear somewhere in the answer,
 * so "it's a gas" and "gases" are both accepted.
 */
function matchesKeyword(answer: string, keyword: string): boolean {
  const cleanKeyword = removeNumberSeparators(keyword.trim().toLowerCase());

  // A keyword made only of digits (and optionally a decimal point) is a number.
  if (/^\d+(\.\d+)?$/.test(cleanKeyword)) {
    // Every number written in the answer, e.g. "I got 8795 or 8796" → ["8795", "8796"].
    // ?? [] = use an empty list if the answer contains no numbers at all.
    // ": string[]" tells TypeScript this is always a list of text.
    const numbersInAnswer: string[] = answer.match(/\d+(\.\d+)?/g) ?? [];
    return numbersInAnswer.includes(cleanKeyword);
  }

  return answer.includes(cleanKeyword);
}

export function isCorrectAnswer(
  question: Question,
  studentAnswer: string
): boolean {
  // Lowercase, trimmed, and with number separators removed ("8,795" → "8795").
  const answer = removeNumberSeparators(studentAnswer.trim().toLowerCase());

  if (question.type === "multiple_choice") {
    return answer === question.answer?.toLowerCase();
  }

  if (question.type === "short_answer") {
    return question.keywords?.some(keyword =>
      matchesKeyword(answer, keyword)
    ) ?? false;
  }

  return false;
}



export function calculateScore(
  questions: Question[],
  answers: Record<number, string>
) {
  let correct = 0;

  for (const question of questions) {
    const answer = answers[question.number];

    if (
      answer &&
      isCorrectAnswer(question, answer)
    ) {
      correct++;
    }
  }

  return {
    correct,
    total: questions.length,
    percentage:
      (correct / questions.length) * 100
  };
}


export function determineResult(
  percentage: number
) {
  if (percentage >= 70) {
    return "advance";
  }

  if (percentage >= 60) {
    return "secondChance";
  }

  return "stay";
}


export function determineFinalLevel(
  primaryScore: number,
  secondChanceScore: number
) {
  if (primaryScore >= 70) {
    return "advance";
  }

  if (
    primaryScore >= 60 &&
    secondChanceScore >= 67
  ) {
    return "advance";
  }

  return "stay";
}


export function getNextGrade(
  currentGrade: number
) {
  return Math.min(currentGrade + 1, 9);
}

export function getPreviousGrade(
  currentGrade: number
) {
  return Math.max(currentGrade - 1, 4);
}



export function determineNextGrade(
  currentGrade: number,
  percentage: number
) {
  if (percentage >= 70) {
    return getNextGrade(currentGrade);
  }

  if (percentage < 60) {
    return getPreviousGrade(currentGrade);
  }

  return currentGrade;
}


export function determineFinalGrade(
  startingGrade: number,
  currentGrade: number,
  percentage: number
) {
  if (percentage >= 70) {
    return currentGrade;
  }

  if (percentage < 60) {
    return Math.max(currentGrade - 1, 4);
  }

  return currentGrade;
}

// ─────────────────────────────────────────────────────────────
// The grade ladder: moving between grades until the level is found
// ─────────────────────────────────────────────────────────────

// The lowest and highest grades that have questions.
export const LOWEST_GRADE = 4;
export const HIGHEST_GRADE = 9;

// Saved as the final grade when the child does not pass Grade 4.
// Shown to people as "Below Grade 4" (see gradeLevelLabel).
export const BELOW_LOWEST_GRADE = LOWEST_GRADE - 1;

// What the ladder remembers between grades.
// null = nothing passed (or failed) yet.
export type LadderMemory = {
  highestPassed: number | null;
  lowestFailed: number | null;
};

// What climbLadder decides after each grade.
export type LadderStep = LadderMemory & {
  done: boolean; // true = the test is over for this subject
  nextGrade: number; // the grade to test next (only used when done is false)
  finalGrade: number; // the child's level (only used when done is true)
};

/** Decides what happens after the child finishes a grade.
 *
 * Passed → remember it, then go up one grade, unless this is the top grade
 *          or the grade above was already failed (then the test is over).
 * Failed → remember it, then go down one grade, unless this is the bottom
 *          grade or the grade below was already passed (then the test is over).
 *
 * Because the ladder remembers what was passed and failed, it can never go
 * back and forth between two grades forever.
 * The final level is always the highest grade passed, or BELOW_LOWEST_GRADE
 * if no grade was passed.
 */
export function climbLadder(
  grade: number,
  passed: boolean,
  memory: LadderMemory
): LadderStep {
  // Update the memory with this grade's result.
  const highestPassed = passed ? grade : memory.highestPassed;
  const lowestFailed = passed ? memory.lowestFailed : grade;

  // The level so far: the highest grade passed, or "below the lowest grade".
  const finalGrade = highestPassed ?? BELOW_LOWEST_GRADE;

  // Is there anywhere left to go?
  const done = passed
    ? grade === HIGHEST_GRADE || lowestFailed === grade + 1
    : grade === LOWEST_GRADE || highestPassed === grade - 1;

  return {
    highestPassed,
    lowestFailed,
    done,
    nextGrade: passed ? grade + 1 : grade - 1,
    finalGrade,
  };
}

/** Returns a copy of the questions in a random order.
 * The original list is not changed.
 *
 * Uses the Fisher–Yates shuffle: go from the last position to the first,
 * and swap each question with a random one at or before it. Every order
 * is equally likely.
 */
export function shuffleQuestions(questions: Question[]): Question[] {
  const shuffled = [...questions]; // copy, so the imported JSON list stays as it is

  for (let i = shuffled.length - 1; i > 0; i--) {
    // A random position from 0 to i (inclusive).
    const j = Math.floor(Math.random() * (i + 1));
    // Swap the questions at positions i and j.
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/** Turns a final grade into text, e.g. 6 → "Grade 6", 3 → "Below Grade 4". */
export function gradeLevelLabel(grade: number): string {
  return grade < LOWEST_GRADE ? `Below Grade ${LOWEST_GRADE}` : `Grade ${grade}`;
}