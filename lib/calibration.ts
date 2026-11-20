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