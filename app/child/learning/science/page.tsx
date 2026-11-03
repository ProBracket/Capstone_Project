import ChildNavbar from "@/components/ChildNavbar";

export default function SciencePage() {
  return (
    <>
      <ChildNavbar />

      <main className="ml-64 min-h-screen p-8 bg-green-50">
        <h1 className="text-4xl font-bold text-green-700 mb-4">
          🔬 Science
        </h1>

        <p className="mb-6">
          Welcome to Science Learning!
        </p>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-2">
            Lesson 1: Human Body
          </h2>

          <p>Learn how the human body works.</p>
        </div>
      </main>
    </>
  );
}