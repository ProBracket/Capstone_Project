/** Bud's conversation rules (the "tutor").
 *
 * This file decides WHAT BUD SAYS. Nothing else.
 * - No database (saving messages is lib/conversations.ts)
 * - No screen (that is app/child/chat/page.tsx)
 * - No AI in this file: the rules below decide what happens. The AI only
 *   re-words Bud's replies afterwards (app/api/bud/route.ts), and if the AI
 *   is unavailable, the messages written here are shown as they are.
 *
 * The Think First rule: Bud never gives the answer before the child has tried.
 *   1st wrong try → hint 1 (small)
 *   2nd wrong try → hint 2 (bigger)
 *   3rd wrong try → hint 3 (biggest)
 *   4th wrong try → Bud explains the answer, then moves on to the next problem
 * If the child asks Bud to "just tell me" before trying, Bud does NOT give in.
 * He encourages a guess instead, and that does not count as a wrong try.
 */

// ─────────────────────────────────────────────────────────────
// BLOCK 1: The tutor's name, and what a "problem" looks like
// ─────────────────────────────────────────────────────────────

// The name children see on screen.
// Change it here and every screen updates. (The database always stores
// "assistant" for Bud's messages, so a rename never touches saved chats.)
export const TUTOR_NAME = "Bud";

// A "type" is a description of what something looks like. It stores nothing.
// This one says: every problem Bud asks must have these 5 parts.
export type Problem = {
  // Which subject the problem belongs to. Only these three words are allowed;
  // TypeScript shows an error if you type anything else (like "Math" or "art").
  subject: "math" | "science" | "literature";

  // What Bud asks the child, e.g. "What is 7 + 5?"
  question: string;

  // Every answer we'll accept as correct. It's a list (string[]) because
  // children can write the same answer different ways, e.g. ["12", "twelve"].
  answers: string[];

  // Exactly 3 hints, smallest first. [string, string, string] means "a list of
  // exactly 3 pieces of text", so a problem with 2 or 4 hints shows an error.
  // Lists count from 0: 1st wrong try → hints[0], 2nd → hints[1], 3rd → hints[2].
  hints: [string, string, string];

  // What Bud says after the 4th wrong try: the answer AND why it's right,
  // so the child still learns something.
  explanation: string;
};

// ─────────────────────────────────────────────────────────────
// BLOCK 2: Practice problems
// ─────────────────────────────────────────────────────────────

// BACKUP PROBLEMS: Bud's questions are normally written by the AI for each
// conversation (lib/problemGenerator.ts). This list is used instead whenever
// the AI is unavailable or a generated problem fails the safety checks, and
// by the homepage demo. The rules below work the same for both.
//
// Problem[] means "a list of problems". Each { ... } is one problem, and
// TypeScript checks that every one fills in all 5 parts from the form above.
export const PRACTICE_PROBLEMS: Problem[] = [
  // Problem 1: math
  {
    subject: "math",
    question: "What is 7 × 8?",
    answers: ["56", "fifty-six", "fifty six"],
    hints: [
      "7 × 8 means 8 groups of 7.",
      "Try 7 × 4 first, then double it!",
      "7 × 4 = 28. What is 28 + 28?",
    ],
    explanation:
      "7 × 8 = 56. A trick: 7 × 4 = 28, and doubling 28 gives 56.",
  },

  // Problem 2: science
  {
    subject: "science",
    question: "What do plants need from the sun to make their own food?",
    answers: ["light", "sunlight", "sun light", "light energy"],
    hints: [
      "Think about what the sun gives us during the day.",
      "You can see it, and it goes away at night.",
      "It starts with the letter L.",
    ],
    explanation:
      "Plants need sunlight. They use its energy to turn water and air into food. This is called photosynthesis.",
  },

  // Problem 3: literature
  {
    subject: "literature",
    question: "What is the special word for the main character of a story?",
    answers: ["protagonist", "the protagonist"],
    hints: [
      "It's a fancy word for the character the story is mostly about.",
      'It starts with "pro", like a pro player is the star of the team.',
      "It sounds like pro-TAG-oh-nist.",
    ],
    explanation:
      "The main character is called the protagonist. It's the character the story follows, like the hero of a fairy tale.",
  },

  // Problems 4 to 6: a second backup for each subject, so a round of
  // 6 questions never repeats a question even if the AI fails.

  // Problem 4: math
  {
    subject: "math",
    question: "A box holds 6 eggs. How many eggs are in 9 boxes?",
    answers: ["54", "fifty-four", "fifty four"],
    hints: [
      "Each box has the same number of eggs, so you can multiply.",
      "You need 9 groups of 6.",
      "6 × 10 = 60. Take away one box of 6.",
    ],
    explanation:
      "9 boxes of 6 eggs is 6 × 9 = 54. A trick: 6 × 10 = 60, then take away one box: 60 − 6 = 54.",
  },

  // Problem 5: science
  {
    subject: "science",
    question: "What is the name for water falling from clouds as rain or snow?",
    answers: ["precipitation"],
    hints: [
      "It's one of the steps of the water cycle.",
      "It comes after water vapour forms clouds.",
      'It starts with "pre", like "precip..."',
    ],
    explanation:
      "It's called precipitation. Water evaporates, forms clouds, then falls back down as rain, snow, sleet or hail.",
  },

  // Problem 6: literature
  {
    subject: "literature",
    question:
      'In the sentence "The wind whispered through the trees", the wind does something only people can do. What is this literary device called?',
    answers: ["personification"],
    hints: [
      "Can wind really whisper? Only people whisper.",
      "The device gives human actions to something that isn't a person.",
      'It has the word "person" inside it.',
    ],
    explanation:
      "It's personification: giving human actions or feelings to something that isn't human, like wind that whispers.",
  },
];

// The subjects Bud asks about, in the order he asks them.
export const SUBJECTS: Problem["subject"][] = ["math", "science", "literature"];

// How many questions per subject in one round. 2 × 3 subjects = 6 questions,
// asked in the order math, science, literature, math, science, literature.
export const QUESTIONS_PER_SUBJECT = 2;

// Size limits for one problem. A problem that breaks them is rejected.
// Answers are kept short (a number or a few words) so isCorrect can check
// them reliably inside a child's sentence.
const MAX_QUESTION_LENGTH = 500;
const MAX_ANSWER_LENGTH = 40;
const MAX_ANSWERS = 6;
const MAX_HINT_LENGTH = 300;
const MAX_EXPLANATION_LENGTH = 600;

/** Checks that a value really is a Problem: the right subject, a question,
 * 1 to 6 short answers, exactly 3 hints and an explanation, all within the
 * size limits above.
 *
 * Used for problems that come from outside this file: problems written by
 * the AI, and problems the chat page sends to the server. Both could be
 * missing parts or be far too long, so neither is trusted until checked.
 *
 * "value is Problem" tells TypeScript: if this returns true, treat the value
 * as a Problem from here on.
 */
export function isValidProblem(value: unknown): value is Problem {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const p = value as Record<string, unknown>;

  // Helper: is this text, not empty, and no longer than the limit?
  const isText = (text: unknown, maxLength: number) =>
    typeof text === "string" && text.trim() !== "" && text.length <= maxLength;

  return (
    SUBJECTS.includes(p.subject as Problem["subject"]) &&
    isText(p.question, MAX_QUESTION_LENGTH) &&
    Array.isArray(p.answers) &&
    p.answers.length >= 1 &&
    p.answers.length <= MAX_ANSWERS &&
    p.answers.every((answer) => isText(answer, MAX_ANSWER_LENGTH)) &&
    Array.isArray(p.hints) &&
    p.hints.length === 3 &&
    p.hints.every((hint) => isText(hint, MAX_HINT_LENGTH)) &&
    isText(p.explanation, MAX_EXPLANATION_LENGTH)
  );
}

// ─────────────────────────────────────────────────────────────
// BLOCK 3: What Bud remembers (the "state")
// ─────────────────────────────────────────────────────────────

// How one problem ended. Only these three words are allowed:
//   "first-try"  = correct with no wrong tries
//   "with-hints" = correct after 1 to 3 wrong tries (so after some hints)
//   "explained"  = 4 wrong tries, so Bud explained the answer
// Used for the summary parents see (Block 6).
export type ProblemResult = "first-try" | "with-hints" | "explained";

// Everything Bud needs to remember to decide what to say next.
// Each time the child sends a message, Bud reads this state, replies, and
// returns a NEW updated copy. The old state is never changed directly; this
// makes bugs easier to trace and is how React expects data to change.
export type TutorState = {
  // The problems for this conversation, in the order Bud asks them.
  // Usually written by the AI when the chat opens; PRACTICE_PROBLEMS if not.
  // They never change during a conversation.
  problems: Problem[];

  // Which problem we're on, as a position in the problems list above.
  // Counts from 0 like every list: 0 = first problem, 1 = second, 2 = third.
  problemIndex: number;

  // How many times the child has answered THIS problem wrong.
  // 0 = no wrong tries yet, 1 → hint 1, 2 → hint 2, 3 → hint 3, 4 → explain.
  // Goes back to 0 whenever we move on to the next problem.
  wrongTries: number;

  // true once every problem is done. Then the conversation is over.
  finished: boolean;

  // How each finished problem went, in order. One result is added each time
  // a problem ends, e.g. ["first-try", "with-hints"] after two problems.
  results: ProblemResult[];

  // The wrong answers already given for THIS problem, in cleaned-up form
  // (see cleanUp). Giving the same wrong answer again does not count as a
  // new try, so repeating "54" four times can't unlock the explanation.
  // Goes back to an empty list whenever we move on to the next problem.
  triedAnswers: string[];
};

/** The state at the start of every new conversation: this conversation's
 * problems, first problem (0), no wrong tries yet (0), not finished (false),
 * and no results or tried answers yet (empty lists []).
 */
function getStartState(problems: Problem[]): TutorState {
  return {
    problems: problems,
    problemIndex: 0,
    wrongTries: 0,
    finished: false,
    results: [],
    triedAnswers: [],
  };
}

// ─────────────────────────────────────────────────────────────
// BLOCK 4: Checking an answer
// ─────────────────────────────────────────────────────────────

/** Tidies up text so two answers can be compared fairly.
 * Example: "  Fifty-Six! " → "fifty-six"
 *
 * Not exported: only isCorrect (below) needs it.
 */
function cleanUp(text: string): string {
  return (
    text
      // 1. Make everything lowercase: "Fifty-Six!" → "fifty-six!"
      .toLowerCase()
      // 2. Remove punctuation. The pattern means "any character that is NOT
      //    a letter (a-z), a number (0-9), a space (\s) or a hyphen (-)".
      //    Each one found is replaced with "" (nothing): "fifty-six!" → "fifty-six"
      .replace(/[^a-z0-9\s-]/g, "")
      // 3. Turn any run of spaces into a single space: "fifty   six" → "fifty six"
      .replace(/\s+/g, " ")
      // 4. Remove spaces at the start and end: "  fifty-six " → "fifty-six"
      .trim()
  );
}

/** Checks whether the child's answer is correct for this problem.
 * Returns true (correct) or false (not correct).
 *
 * The child's answer counts as correct if it CONTAINS one of the accepted
 * answers as whole words, so "I think it's 56" is accepted, but "556" is not.
 */
export function isCorrect(problem: Problem, childAnswer: string): boolean {
  // Clean up the child's answer and put a space on each side.
  // "I think it's 56!" → " i think its 56 "
  // The extra spaces let us search for whole words (see below).
  const paddedAnswer = " " + cleanUp(childAnswer) + " ";

  // Go through the accepted answers one at a time, e.g. "56", then "fifty-six"...
  for (const accepted of problem.answers) {
    // Clean up the accepted answer too, and add spaces around it: " 56 "
    const paddedAccepted = " " + cleanUp(accepted) + " ";

    // Is " 56 " somewhere inside " i think its 56 "? Yes → correct.
    // The spaces are what stop "556" from matching: " 556 " does not contain " 56 ".
    if (paddedAnswer.includes(paddedAccepted)) {
      return true; // found a match, so stop here: the answer is correct
    }
  }

  // We checked every accepted answer and none matched.
  return false;
}

// ─────────────────────────────────────────────────────────────
// BLOCK 5a: Bud's reply, asking a problem, and the opening message
// ─────────────────────────────────────────────────────────────

// What kind of reply Bud is giving. The AI route (app/api/bud/route.ts) uses
// this to decide what it is allowed to say, e.g. for "hint" it is given the
// hint but never the answer.
//   "opening"   = the first message of a conversation
//   "correct"   = the child got it right
//   "hint"      = a wrong try, answered with hint 1, 2 or 3
//   "explain"   = the 4th wrong try, so Bud explains the answer
//   "encourage" = the child asked for the answer before trying
//   "chit-chat" = a friendly message like "thanks" or "hi"
//   "try-again" = not a real attempt (nonsense, or a wrong answer repeated)
//   "done"      = the conversation is already over
export type BudStepKind =
  | "opening"
  | "correct"
  | "hint"
  | "explain"
  | "encourage"
  | "chit-chat"
  | "try-again"
  | "done";

// Which step of the conversation a reply belongs to.
export type BudStep = {
  kind: BudStepKind;
  problemIndex: number; // the problem this reply is about (counts from 0)
  hintNumber: number; // 1, 2 or 3 when kind is "hint"; 0 for every other kind
};

// What every Bud function gives back.
export type BudReply = {
  // The complete rule-based message. Shown exactly as written whenever the
  // AI is not used or fails.
  message: string;

  // The updated state to use for the child's next message.
  state: TutorState;

  // What kind of reply this is (see BudStep above).
  step: BudStep;

  // The end of the message that always comes from the rules, never the AI:
  // the next problem, the current problem repeated, or the "you finished"
  // line. "" (empty) when there is nothing to add.
  // The AI writes only the part BEFORE this line.
  nextLine: string;
};

/** Builds the text Bud uses to ask a problem.
 * Example: askProblem(problems, 0) → "Problem 1 of 3: What is 7 × 8?"
 *
 * Not exported: only used inside this file.
 */
function askProblem(problems: Problem[], problemIndex: number): string {
  // Look up the problem at this position in the list.
  const problem = problems[problemIndex];

  // Text inside backticks (`) can include values using ${ }.
  // problemIndex + 1 because people count from 1, while lists count from 0.
  // problems.length is how many problems this conversation has.
  return `Problem ${problemIndex + 1} of ${problems.length}: ${problem.question}`;
}

/** Bud's first message, shown when a conversation starts
 * (before the child has typed anything).
 *
 * problems = the problems for this conversation. If none are given (the
 * homepage demo), the first 3 backup PRACTICE_PROBLEMS are used.
 */
export function getOpeningReply(
  problems: Problem[] = PRACTICE_PROBLEMS.slice(0, 3)
): BudReply {
  return {
    // "\n\n" means "start a new line, with a blank line in between".
    message:
      `Hi! I'm ${TUTOR_NAME} 🌱 Let's think together. ` +
      `Try each problem yourself first, and I'll give you hints if you need them.\n\n` +
      askProblem(problems, 0),
    // A brand-new conversation always starts from the starting state.
    state: getStartState(problems),
    // The opening is always the rule-based text; it is not sent to the AI.
    step: { kind: "opening", problemIndex: 0, hintNumber: 0 },
    nextLine: askProblem(problems, 0),
  };
}

// ─────────────────────────────────────────────────────────────
// BLOCK 5b: Spotting "just tell me" / "I don't know"
// ─────────────────────────────────────────────────────────────

// Phrases that mean the child wants the answer instead of trying.
// Written in their cleaned-up form (lowercase, no punctuation), because
// cleanUp removes apostrophes: "don't" becomes "dont", "what's" becomes "whats".
const ASKING_FOR_ANSWER_PHRASES = [
  "tell me",
  "give me the answer",
  "whats the answer",
  "what is the answer",
  "dont know",
  "idk",
  "no idea",
  "give up",
  "help",
  "hint",
];

// What Bud says instead of giving in. It encourages a guess and does NOT
// count as a wrong try (the Think First rule).
const ENCOURAGE_TO_TRY =
  "I know you can figure this out! Thinking first is how your brain grows 🌱 " +
  "Take your best guess, even if you're not sure. Trying is how we learn.";

/** Checks whether the child is asking for the answer instead of trying.
 * Returns true for messages like "just tell me", "I don't know" or "help".
 *
 * Uses the same whole-word method as isCorrect, so "help" matches
 * "help me please" but not "helpful".
 */
function isAskingForAnswer(childMessage: string): boolean {
  // Clean up the message and add a space on each side, exactly like isCorrect.
  // "I don't know!" → " i dont know "
  const paddedMessage = " " + cleanUp(childMessage) + " ";

  // Check each phrase in the list, one at a time.
  for (const phrase of ASKING_FOR_ANSWER_PHRASES) {
    // Is " dont know " inside " i dont know "? Yes → the child is asking.
    if (paddedMessage.includes(" " + phrase + " ")) {
      return true;
    }
  }

  // None of the phrases were found, so treat the message as a real attempt.
  return false;
}

// ─────────────────────────────────────────────────────────────
// BLOCK 5b+: Spotting chit-chat ("thanks", "hello", "ok")
// TEMPORARY: rules can't really understand conversation. Once the AI is
// connected, it should handle chit-chat and this block can be removed.
// ─────────────────────────────────────────────────────────────

// Friendly messages that are not answers. Without this list, "thanks!"
// would be treated as a wrong answer and the child would get a hint.
// Written in cleaned-up form (lowercase, no punctuation), like the list above.
const CHIT_CHAT_PHRASES = [
  "thanks",
  "thank you",
  "thx",
  "ty",
  "helpful",
  "hello",
  "hi",
  "hey",
  "ok",
  "okay",
  "cool",
  "nice",
  "awesome",
  "yay",
  "lol",
];

// What Bud says to chit-chat, before repeating the current problem.
// It does NOT count as a wrong try.
const CHIT_CHAT_REPLY = "😊 Let's keep going!";

/** Checks whether the message is friendly chit-chat rather than an answer.
 * Returns true for messages like "thanks!", "hello" or "ok cool".
 *
 * Same whole-word method as isCorrect and isAskingForAnswer.
 */
function isChitChat(childMessage: string): boolean {
  // Clean up and pad with spaces: "Thanks!!" → " thanks "
  const paddedMessage = " " + cleanUp(childMessage) + " ";

  // Check each chit-chat phrase, one at a time.
  for (const phrase of CHIT_CHAT_PHRASES) {
    if (paddedMessage.includes(" " + phrase + " ")) {
      return true;
    }
  }

  // No chit-chat phrase found.
  return false;
}

// ─────────────────────────────────────────────────────────────
// BLOCK 5b++: Spotting messages that are not a real try
// Without this, a child could type "x", "x", "x", "x" (or keyboard mashing
// like "jfkdla") to use up the 3 hints and get the explanation right away.
// ─────────────────────────────────────────────────────────────

// Number words, so "fifty six" counts as a number answer.
const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "thirty",
  "forty", "fifty", "sixty", "seventy", "eighty", "ninety", "hundred",
  "thousand",
];

// What Bud says when the message is not a real try. Neither counts as a try.
const NONSENSE_REPLY =
  "Hmm, I couldn't understand that one 🤔 Give it a real try! That one doesn't count.";
const NONSENSE_NUMBER_REPLY =
  "Hmm, I couldn't understand that one 🤔 This one needs a number for an answer. Give it a real try!";
const REPEAT_REPLY =
  "You already tried that answer! Try something different 🤔 That one doesn't count.";

/** Checks whether the correct answer to this problem is a number.
 * True if any accepted answer contains a digit, e.g. "56".
 */
function expectsNumber(problem: Problem): boolean {
  return problem.answers.some((answer) => /\d/.test(answer));
}

/** Checks whether one word looks like a real word rather than keyboard mashing.
 * A real-looking word:
 *   - has at least 2 letters
 *   - has a vowel (a, e, i, o, u or y)
 *   - does not have 5 consonants in a row ("jfkdl")
 *   - does not repeat the same letter 3 times in a row ("aaa")
 */
function looksLikeAWord(word: string): boolean {
  if (word.length < 2) {
    return false;
  }
  if (!/[aeiouy]/.test(word)) {
    return false;
  }
  // [^aeiouy\d-] = any character that is not a vowel, digit or hyphen.
  // {5} = five of them in a row.
  if (/[^aeiouy\d-]{5}/.test(word)) {
    return false;
  }
  // (.)\1\1 = any character followed by the same character twice more.
  if (/(.)\1\1/.test(word)) {
    return false;
  }
  return true;
}

/** Checks whether the message is nonsense instead of a real try.
 * Returns true for "x", "jfkdla;jfkl;", "???", or (for a number question)
 * a message without any number in it.
 */
function isNonsense(problem: Problem, childMessage: string): boolean {
  // Only punctuation or spaces (e.g. "???") leaves nothing after cleanUp.
  const cleaned = cleanUp(childMessage);
  if (cleaned === "") {
    return true;
  }

  // The separate words, e.g. "fifty-six apples" → ["fifty", "six", "apples"].
  const words = cleaned.split(/[\s-]+/);

  // Number questions: a real try must contain a number,
  // written with digits ("54") or in words ("fifty").
  if (expectsNumber(problem)) {
    const hasDigit = /\d/.test(cleaned);
    const hasNumberWord = words.some((word) => NUMBER_WORDS.includes(word));
    return !hasDigit && !hasNumberWord;
  }

  // Word questions: a real try must have at least one real-looking word.
  return !words.some(looksLikeAWord);
}

/** Checks whether the child already gave this exact wrong answer to this problem.
 * Compares cleaned-up forms, so "Rain!" and "rain" count as the same answer.
 */
function isRepeat(state: TutorState, childMessage: string): boolean {
  return state.triedAnswers.includes(cleanUp(childMessage));
}

// ─────────────────────────────────────────────────────────────
// BLOCK 5c: The main function, getBudReply
// ─────────────────────────────────────────────────────────────

/** Moves the conversation on to the next problem, or ends it if there are
 * no problems left. Used after a correct answer, and (in 5d) after Bud
 * explains an answer.
 *
 * firstLine: what Bud says before the next problem, e.g. "🎉 Yes, that's right!"
 * result:    how the problem that just ended went, e.g. "first-try"
 * kind:      "correct" or "explain", which tells the AI what kind of reply this is
 *
 * Not exported: only getBudReply uses it.
 */
function moveToNextProblem(
  state: TutorState,
  firstLine: string,
  result: ProblemResult,
  kind: "correct" | "explain"
): BudReply {
  // The position of the next problem in the list.
  const nextIndex = state.problemIndex + 1;

  // A NEW list: all the old results, plus this problem's result at the end.
  // .concat() never changes the old list, it makes a new one.
  // e.g. ["first-try"].concat("explained") → ["first-try", "explained"]
  const newResults = state.results.concat(result);

  // This reply is about the problem that just ended (not the next one).
  const step: BudStep = {
    kind: kind,
    problemIndex: state.problemIndex,
    hintNumber: 0,
  };

  // No problems left? (With 3 problems, positions are 0, 1, 2, so
  // nextIndex 3 means we've run out.)
  if (nextIndex >= state.problems.length) {
    const finishedLine = "🌟 You finished all the problems! Great thinking today.";
    return {
      message: firstLine + "\n\n" + finishedLine,
      state: {
        problems: state.problems, // same problems for the whole conversation
        problemIndex: state.problemIndex, // stay on the last problem (there is no next one)
        wrongTries: 0,
        finished: true, // the conversation is over
        results: newResults, // includes the last problem's result
        triedAnswers: [],
      },
      step: step,
      nextLine: finishedLine,
    };
  }

  // Otherwise, ask the next problem with a fresh count of wrong tries.
  return {
    message: firstLine + "\n\n" + askProblem(state.problems, nextIndex),
    state: {
      problems: state.problems,
      problemIndex: nextIndex, // move to the next problem
      wrongTries: 0, // new problem, so wrong tries start again from 0
      finished: false,
      results: newResults, // remember how the problem we just finished went
      triedAnswers: [], // new problem, so no answers tried yet
    },
    step: step,
    nextLine: askProblem(state.problems, nextIndex),
  };
}

/** THE MAIN FUNCTION. The chat page calls this every time the child sends a message.
 *
 * Takes:   the current state, and what the child typed
 * Returns: what Bud says, and the new state to use next time
 *
 * Bud goes through these checks in order and stops at the first one that matches:
 *   0. Already finished?           → say we're done
 *   1. Correct answer?             → praise, then the next problem
 *   2. Asking for the answer?      → encourage a guess (not counted as a try)
 *   3. Chit-chat ("thanks", "hi")? → friendly reply (not counted as a try)
 *   4. Nonsense or a repeat?       → ask for a real try (not counted as a try)
 *   5. Otherwise, a wrong try      → a hint, or the explanation once the hints run out
 */
export function getBudReply(state: TutorState, childMessage: string): BudReply {
  // Check 0: the conversation is already over.
  // The state hasn't changed, so we give back the same state.
  if (state.finished) {
    return {
      message: "We're all done for today! 🌟 Great job thinking first.",
      state: state,
      step: { kind: "done", problemIndex: state.problemIndex, hintNumber: 0 },
      nextLine: "",
    };
  }

  // Look up the problem the child is currently working on.
  const problem = state.problems[state.problemIndex];

  // The current problem, as Bud asks it. Repeated after replies that don't
  // move on (checks 2, 3 and 4 below).
  const currentQuestion = askProblem(state.problems, state.problemIndex);

  // Check 1: correct answer. This is checked FIRST, so a message like
  // "thanks, it's 56" counts as correct even though it also has "thanks".
  if (isCorrect(problem, childMessage)) {
    // Record how it was solved: no wrong tries → "first-try",
    // otherwise the child needed at least one hint → "with-hints".
    // `let` (instead of const) because the value may change on the next line.
    let result: ProblemResult = "with-hints";
    if (state.wrongTries === 0) {
      result = "first-try"; // === means "is exactly equal to"
    }

    return moveToNextProblem(
      state,
      "🎉 Yes, that's right! Great thinking.",
      result,
      "correct"
    );
  }

  // Check 2: the child wants the answer without trying.
  // Bud encourages them and repeats the problem. wrongTries stays the same,
  // because asking is not an attempt.
  if (isAskingForAnswer(childMessage)) {
    return {
      message: ENCOURAGE_TO_TRY + "\n\n" + currentQuestion,
      state: state,
      step: { kind: "encourage", problemIndex: state.problemIndex, hintNumber: 0 },
      nextLine: currentQuestion,
    };
  }

  // Check 3: friendly chit-chat. Same idea: reply, repeat the problem,
  // and don't count it as a try.
  if (isChitChat(childMessage)) {
    return {
      message: CHIT_CHAT_REPLY + "\n\n" + currentQuestion,
      state: state,
      step: { kind: "chit-chat", problemIndex: state.problemIndex, hintNumber: 0 },
      nextLine: currentQuestion,
    };
  }

  // Check 4: not a real try (nonsense, or the same wrong answer again).
  // Bud asks for a real try and repeats the problem. Like checks 2 and 3,
  // the state stays the same, so no hint is used up.
  if (isNonsense(problem, childMessage) || isRepeat(state, childMessage)) {
    // Pick the message that explains what went wrong.
    let tryAgainLine = REPEAT_REPLY;
    if (isNonsense(problem, childMessage)) {
      tryAgainLine = expectsNumber(problem) ? NONSENSE_NUMBER_REPLY : NONSENSE_REPLY;
    }

    return {
      message: tryAgainLine + "\n\n" + currentQuestion,
      state: state,
      step: { kind: "try-again", problemIndex: state.problemIndex, hintNumber: 0 },
      nextLine: currentQuestion,
    };
  }

  // ───────────────────────────────────────────────────────────
  // BLOCK 5d: Wrong answers (hints, then the explanation)
  // This block is still inside getBudReply: it is check 5.
  // ───────────────────────────────────────────────────────────

  // Check 5: a wrong try. (Every check above returned early, so if we
  // reach this line the message was a real attempt that wasn't correct.)

  // Count this wrong try. We make a new number instead of changing state.
  const newWrongTries = state.wrongTries + 1;

  // Are there hints left? Every problem has 3 hints (problem.hints.length is 3),
  // so wrong tries 1, 2 and 3 each get a hint.
  if (newWrongTries <= problem.hints.length) {
    // Lists count from 0, so the 1st wrong try gets hints[0],
    // the 2nd gets hints[1], and the 3rd gets hints[2].
    const hint = problem.hints[newWrongTries - 1];

    return {
      message: "Not quite, but good try! 💡 Hint: " + hint,
      state: {
        problems: state.problems,
        problemIndex: state.problemIndex, // same problem: the child tries again
        wrongTries: newWrongTries, // remember how many wrong tries so far
        finished: false,
        results: state.results, // no problem finished, so the results don't change
        // Remember this wrong answer, so giving it again won't count (check 4).
        triedAnswers: state.triedAnswers.concat(cleanUp(childMessage)),
      },
      step: {
        kind: "hint",
        problemIndex: state.problemIndex,
        hintNumber: newWrongTries, // 1st wrong try → hint 1, and so on
      },
      // Nothing is added after a hint: the child simply tries again.
      nextLine: "",
    };
  }

  // No hints left (this is the 4th wrong try). Bud explains the answer so the
  // child still learns from it, then moves on using the same helper as a
  // correct answer.
  return moveToNextProblem(
    state,
    "Good effort! Let's work through it together.\n\n" + problem.explanation,
    "explained", // record that Bud had to explain this one
    "explain"
  );
}

// ─────────────────────────────────────────────────────────────
// BLOCK 6: The summary parents see in chat history
// ─────────────────────────────────────────────────────────────

/** Turns the results in a state into one short sentence for parents.
 * Example: "Practised 3 problems: 1 solved on the first try,
 *           1 solved with hints, 1 explained by Bud."
 *
 * Saved with the conversation when it ends, and shown in the parent's
 * chat history.
 */
export function getSummary(state: TutorState): string {
  // Start each count at 0. `let` because these numbers go up in the loop.
  let firstTry = 0;
  let withHints = 0;
  let explained = 0;

  // Go through the results one at a time and add 1 to the matching count.
  // count++ is short for count = count + 1.
  for (const result of state.results) {
    if (result === "first-try") {
      firstTry++;
    } else if (result === "with-hints") {
      withHints++;
    } else {
      explained++; // the only result left is "explained"
    }
  }

  // How many problems were finished in total.
  const total = state.results.length;

  // The child left before finishing even one problem.
  if (total === 0) {
    return "Started a conversation but didn't finish any problems.";
  }

  // "1 problem" but "2 problems": only add the "s" when there's more than one.
  let problemWord = "problems";
  if (total === 1) {
    problemWord = "problem";
  }

  // Build the sentence from the counts.
  let summary =
    `Practised ${total} ${problemWord}: ` +
    `${firstTry} solved on the first try, ` +
    `${withHints} solved with hints, ` +
    `${explained} explained by ${TUTOR_NAME}.`;

  // If the conversation isn't finished, the child left part-way through.
  // The ! means "not": !state.finished is true when finished is false.
  if (!state.finished) {
    summary = summary + " Stopped before the end.";
  }

  return summary;
}
