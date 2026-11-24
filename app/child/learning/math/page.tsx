import ChildNavbar from "@/components/ChildNavbar";

export default function MathPage() {
  return (
    <>
      <ChildNavbar />

      <main className="ml-64 min-h-screen p-8 bg-blue-50">
        <h1 className="text-4xl font-bold text-blue-700 mb-4 flex items-center gap-3">
          🧮 Math
        </h1>

        <p className="mb-6">
          Welcome to Math Learning!
        </p>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-2">
            Lesson 1: Addition
          </h2>

          <p>Learn how to add numbers together.</p>
        </div>
      </main>
    </>
  );
}