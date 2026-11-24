import ChildNavbar from "@/components/ChildNavbar";

export default function ProgressPage() {
  return (
    <>
      <ChildNavbar />

      <main className="ml-72 min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-12 px-8 flex justify-center">
        <div className="w-full max-w-5xl">

          <div className="bg-white rounded-3xl shadow-2xl p-12">

            <h1 className="text-5xl font-bold text-center mb-10">
              📈 Learning Progress
            </h1>

            <div className="space-y-8">

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Math</span>
                  <span>80%</span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-5">
                  <div className="bg-blue-500 h-5 rounded-full w-4/5"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Science</span>
                  <span>60%</span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-5">
                  <div className="bg-green-500 h-5 rounded-full w-3/5"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Literature</span>
                  <span>40%</span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-5">
                  <div className="bg-purple-500 h-5 rounded-full w-2/5"></div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </main>
    </>
  );
}