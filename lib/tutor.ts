/** Bud's conversation rules (the "tutor").
 *
 * This file decides WHAT BUD SAYS. Nothing else.
 * - No database (saving messages is lib/conversations.ts)
 * - No screen (that is app/child/chat/page.tsx)
 * - No AI yet: Bud follows simple rules written below
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

// PLACEHOLDERS: a few sample problems so we can build and test the
// conversation now. Later they'll come from the team's real question bank
// (or the AI). Only this list changes then; the rules below stay the same.
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
];

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
  // Which problem we're on, as a position in PRACTICE_PROBLEMS.
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
};

// The state at the start of every new conversation:
// first problem (0), no wrong tries yet (0), not finished (false),
// and no results yet (an empty list []).
export const START_STATE: TutorState = {
  problemIndex: 0,
  wrongTries: 0,
  finished: false,
  results: [],
};

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

// What every Bud function gives back: the message to show (and read aloud),
// plus the updated state to use for the child's next message.
export type BudReply = {
  message: string;
  state: TutorState;
};

/** Builds the text Bud uses to ask a problem.
 * Example: askProblem(0) → "Problem 1 of 3: What is 7 × 8?"
 *
 * Not exported: only used inside this file.
 */
function askProblem(problemIndex: number): string {
  // Look up the problem at this position in the list.
  const problem = PRACTICE_PROBLEMS[problemIndex];

  // Text inside backticks (`) can include values using ${ }.
  // problemIndex + 1 because people count from 1, while lists count from 0.
  // PRACTICE_PROBLEMS.length is how many problems are in the list (3).
  return `Problem ${problemIndex + 1} of ${PRACTICE_PROBLEMS.length}: ${problem.question}`;
}

/** Bud's first message, shown when a conversation starts
 * (before the child has typed anything).
 */
export function getOpeningReply(): BudReply {
  return {
    // "\n\n" means "start a new line, with a blank line in between".
    message:
      `Hi! I'm ${TUTOR_NAME} 🌱 Let's think together. ` +
      `Try each problem yourself first, and I'll give you hints if you need them.\n\n` +
      askProblem(0),
    // A brand-new conversation always starts from the starting state.
    state: START_STATE,
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
// BLOCK 5c: The main function, getBudReply
// ─────────────────────────────────────────────────────────────

/** Moves the conversation on to the next problem, or ends it if there are
 * no problems left. Used after a correct answer, and (in 5d) after Bud
 * explains an answer.
 *
 * firstLine: what Bud says before the next problem, e.g. "🎉 Yes, that's right!"
 * result:    how the problem that just ended went, e.g. "first-try"
 *
 * Not exported: only getBudReply uses it.
 */
function moveToNextProblem(
  state: TutorState,
  firstLine: string,
  result: ProblemResult
): BudReply {
  // The position of the next problem in the list.
  const nextIndex = state.problemIndex + 1;

  // A NEW list: all the old results, plus this problem's result at the end.
  // .concat() never changes the old list, it makes a new one.
  // e.g. ["first-try"].concat("explained") → ["first-try", "explained"]
  const newResults = state.results.concat(result);

  // No problems left? (With 3 problems, positions are 0, 1, 2, so
  // nextIndex 3 means we've run out.)
  if (nextIndex >= PRACTICE_PROBLEMS.length) {
    return {
      message:
        firstLine + "\n\n🌟 You finished all the problems! Great thinking today.",
      state: {
        problemIndex: state.problemIndex, // stay on the last problem (there is no next one)
        wrongTries: 0,
        finished: true, // the conversation is over
        results: newResults, // includes the last problem's result
      },
    };
  }

  // Otherwise, ask the next problem with a fresh count of wrong tries.
  return {
    message: firstLine + "\n\n" + askProblem(nextIndex),
    state: {
      problemIndex: nextIndex, // move to the next problem
      wrongTries: 0, // new problem, so wrong tries start again from 0
      finished: false,
      results: newResults, // remember how the problem we just finished went
    },
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
 *   4. Otherwise, a wrong try      → a hint, or the explanation once the hints run out
 */
export function getBudReply(state: TutorState, childMessage: string): BudReply {
  // Check 0: the conversation is already over.
  // The state hasn't changed, so we give back the same state.
  if (state.finished) {
    return {
      message: "We're all done for today! 🌟 Great job thinking first.",
      state: state,
    };
  }

  // Look up the problem the child is currently working on.
  const problem = PRACTICE_PROBLEMS[state.problemIndex];

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
      result
    );
  }

  // Check 2: the child wants the answer without trying.
  // Bud encourages them and repeats the problem. wrongTries stays the same,
  // because asking is not an attempt.
  if (isAskingForAnswer(childMessage)) {
    return {
      message: ENCOURAGE_TO_TRY + "\n\n" + askProblem(state.problemIndex),
      state: state,
    };
  }

  // Check 3: friendly chit-chat. Same idea: reply, repeat the problem,
  // and don't count it as a try.
  if (isChitChat(childMessage)) {
    return {
      message: CHIT_CHAT_REPLY + "\n\n" + askProblem(state.problemIndex),
      state: state,
    };
  }

  // ───────────────────────────────────────────────────────────
  // BLOCK 5d: Wrong answers (hints, then the explanation)
  // This block is still inside getBudReply: it is check 4.
  // ───────────────────────────────────────────────────────────

  // Check 4: a wrong try. (Every check above returned early, so if we
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
        problemIndex: state.problemIndex, // same problem: the child tries again
        wrongTries: newWrongTries, // remember how many wrong tries so far
        finished: false,
        results: state.results, // no problem finished, so the results don't change
      },
    };
  }

  // No hints left (this is the 4th wrong try). Bud explains the answer so the
  // child still learns from it, then moves on using the same helper as a
  // correct answer.
  return moveToNextProblem(
    state,
    "Good effort! Let's work through it together.\n\n" + problem.explanation,
    "explained" // record that Bud had to explain this one
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
