import Link from "next/link";
import ChildNavbar from "@/components/ChildNavbar";
import CalibrationGate from "@/components/CalibrationGate";

export default async function WelcomePage({
  searchParams,
}: {
  // The part of the address after "?". The profile picker opens this page
  // as /child/welcome?childId=<id>.
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { childId } = await searchParams;

  return (
    <>
      {/* First time using the app → sends the child to calibration. */}
      <CalibrationGate childId={typeof childId === "string" ? childId : null} />

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
                🤖 Chat with Bud
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