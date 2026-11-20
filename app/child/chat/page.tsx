import ChildNavbar from "@/components/ChildNavbar";

export default function ChatPage() {
  return (
    <>
      <ChildNavbar />

      <main className="ml-72 min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 pt-12 px-8 flex justify-center">
        <div className="w-full max-w-5xl">

          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">

            <div className="text-7xl mb-6">
              🤖
            </div>

            <h1 className="text-5xl font-extrabold text-slate-800 mb-4">
              ThinkFirst AI Chat
            </h1>

            <p className="text-xl text-gray-600 mb-8">
              Ask questions, explore ideas, and learn with your personal AI assistant.
            </p>

            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg transition-all">
              Start Chat
            </button>

          </div>

        </div>
      </main>
    </>
  );
}