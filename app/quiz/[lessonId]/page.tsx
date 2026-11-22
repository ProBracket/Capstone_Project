
import RetryAnswer from "../../../components/RetryAnswer";

export default function QuizPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <RetryAnswer
        question="What is 7 + 5?"
        correctAnswer="12"
        hint="Start at 7 and count forward 5 more."
      />
    </main>
  );
}
