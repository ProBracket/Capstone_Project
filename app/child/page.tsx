import Link from "next/link";
import ChildNavbar from "@/components/ChildNavbar";

export default function ChildDashboard() {
  return (
    <>
      <ChildNavbar />

      <main className="ml-64 min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 pt-12 px-8 flex justify-center">
        

        <div className="w-full max-w-6xl">

          <div className="text-center mb-12">
            <h1 className="text-6xl font-extrabold text-slate-800 mb-4">
              Welcome Back 👋
            </h1>

            <p className="text-xl text-gray-600">
              Ready to continue your learning adventure today?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">

            <Link href="/child/chat">
              <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all p-10 text-center cursor-pointer">

                <div className="text-6xl mb-4">
                  🤖
                </div>

                <h2 className="text-3xl font-bold mb-3">
                  ThinkFirst AI Chat
                </h2>

                <p className="text-gray-600">
                  Ask questions and learn with your personal AI assistant.
                </p>

              </div>
            </Link>

            <Link href="/child/learning">
              <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all p-10 text-center cursor-pointer">

                <div className="text-6xl mb-4">
                  📚
                </div>

                <h2 className="text-3xl font-bold mb-3">
                  Guided Learning
                </h2>

                <p className="text-gray-600">
                  Continue learning Math, Science, and Literature.
                </p>

              </div>
            </Link>

          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-10">

            <div className="bg-white p-8 rounded-3xl shadow-lg text-center">
              <h3 className="text-lg text-gray-500">
                Lessons Completed
              </h3>

              <p className="text-4xl font-bold text-blue-600 mt-3">
                12
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-lg text-center">
              <h3 className="text-lg text-gray-500">
                Current Streak
              </h3>

              <p className="text-4xl font-bold text-orange-500 mt-3">
                🔥 5 Days
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-lg text-center">
              <h3 className="text-lg text-gray-500">
                Badges Earned
              </h3>

              <p className="text-4xl font-bold text-purple-600 mt-3">
                🏆 7
              </p>
            </div>

          </div>

        </div>

      </main>
    </>
  );
}