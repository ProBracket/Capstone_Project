import Link from "next/link";
import ChildNavbar from "@/components/ChildNavbar";

export default function LearningPage() {
  return (
    <>
      <ChildNavbar />

      <main className="ml-72 min-h-screen bg-linear-to-br from-blue-50 to-purple-50 pt-12 px-8 flex justify-center">
        <div className="w-full max-w-6xl">
          <div className="bg-white rounded-3xl shadow-2xl p-12">

            <h1 className="text-5xl font-bold text-center mb-12">
              📚 Choose a Subject
            </h1>

            <div className="grid md:grid-cols-3 gap-8">

              <Link href="/child/learning/math">
                <div className="bg-blue-100 rounded-3xl p-10 text-center shadow-lg hover:scale-105 transition cursor-pointer">
                  <div className="text-6xl mb-4"> Math</div>
                  <h2 className="text-3xl font-bold">Math</h2>
                </div>
              </Link>

              <Link href="/child/learning/science">
                <div className="bg-green-100 rounded-3xl p-10 text-center shadow-lg hover:scale-105 transition cursor-pointer">
                  <div className="text-6xl mb-4">Science</div>
                  <h2 className="text-3xl font-bold">Science</h2>
                </div>
              </Link>

              <Link href="/child/learning/literature">
                <div className="bg-purple-100 rounded-3xl p-10 text-center shadow-lg hover:scale-105 transition cursor-pointer">
                  <div className="text-6xl mb-4">Literature</div>
                  <h2 className="text-3xl font-bold">Literature</h2>
                </div>
              </Link>

            </div>
          </div>
        </div>
      </main>
    </>
  );
}