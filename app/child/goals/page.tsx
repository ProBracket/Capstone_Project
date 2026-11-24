import ChildNavbar from "@/components/ChildNavbar";

export default function GoalsPage() {
  return (
    <>
      <ChildNavbar />

      <main className="ml-72 min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 pt-12 px-8 flex justify-center">
        <div className="w-full max-w-5xl">

          <div className="bg-white rounded-3xl shadow-2xl p-12">

            <h1 className="text-5xl font-bold text-center mb-10">
              🎯 My Goals
            </h1>

            <div className="space-y-5">

              <div className="bg-green-100 p-5 rounded-xl">
                ✅ Complete Math Addition Lesson
              </div>

              <div className="bg-green-100 p-5 rounded-xl">
                ✅ Read One Story Book
              </div>

              <div className="bg-yellow-100 p-5 rounded-xl">
                ⏳ Complete Human Body Module
              </div>

            </div>

          </div>

        </div>
      </main>
    </>
  );
}