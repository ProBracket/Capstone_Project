/** Science lessons (/child/learning/science).
 * Everything happens in components/LessonView.tsx; this page only picks
 * the subject, its title and its colours.
 */
"use client";

import LessonView from "@/components/LessonView";

export default function SciencePage() {
  return (
    <LessonView
      subject="science"
      title="Science"
      emoji="🔬"
      colours={{
        background: "bg-green-50",
        heading: "text-green-700",
        hover: "hover:bg-green-100",
      }}
    />
  );
}
