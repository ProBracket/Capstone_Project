import ChildNavbar from "@/components/ChildNavbar";

export default function ChallengesPage() {
  return (
    <>
      <ChildNavbar />

      <main className="ml-72 min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pt-12 px-8 flex justify-center">
        <div className="w-full max-w-5xl">

          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">

            <div className="text-7xl mb-6">
              🏆
            </div>

            <h1 className="text-5xl font-bold mb-6">
              Daily Challenge
            </h1>

            <p className="text-xl text-gray-600 mb-8">
              Complete 5 Math problems today and earn 20 XP.
            </p>

            <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg transition-all">
              Start Challenge
            </button>

          </div>

        </div>
      </main>
    </>
  );
}