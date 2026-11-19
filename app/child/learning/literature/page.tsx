import ChildNavbar from "@/components/ChildNavbar";

export default function LiteraturePage() {
  return (
    <>
      <ChildNavbar />

      <main className="ml-64 min-h-screen p-8 bg-purple-50">
        <h1 className="text-4xl font-bold text-purple-700 mb-4">
          📖 Literature
        </h1>

        <p className="mb-6">
          Welcome to Literature Learning!
        </p>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-2">
            Lesson 1: Reading Stories
          </h2>

          <p>
            Explore exciting stories and improve reading skills.
          </p>
        </div>
      </main>
    </>
  );
}