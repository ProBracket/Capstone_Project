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



export function isCorrectAnswer(
  question: Question,
  studentAnswer: string
): boolean {
  const answer = studentAnswer.trim().toLowerCase();

  if (question.type === "multiple_choice") {
    return answer === question.answer?.toLowerCase();
  }

  if (question.type === "short_answer") {
    return question.keywords?.some(keyword =>
      answer.includes(keyword.toLowerCase())
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