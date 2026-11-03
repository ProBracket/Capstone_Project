import Link from "next/link";
import ChildNavbar from "@/components/ChildNavbar";

export default function WelcomePage() {
  return (
    <>
      <ChildNavbar />

      <main className="ml-64 p-8">
        <h1 className="text-4xl font-bold mb-4">
          Welcome Back 👋
        </h1>

        <p className="text-gray-600 mb-8">
          Ready to learn today?
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/child/chat">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold">
                🤖 Chat with ThinkFirst AI
              </h2>
            </div>
          </Link>

          <Link href="/child/learning">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold">
                📚 Guided Learning
              </h2>
            </div>
          </Link>
        </div>
      </main>
    </>
  );
}