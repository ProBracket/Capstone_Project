/** Literature lessons (/child/learning/literature).
 * Everything happens in components/LessonView.tsx; this page only picks
 * the subject, its title and its colours.
 */
"use client";

import LessonView from "@/components/LessonView";

export default function LiteraturePage() {
  return (
    <LessonView
      subject="literature"
      title="Literature"
      emoji="📚"
      colours={{
        background: "bg-pink-50",
        heading: "text-pink-700",
        hover: "hover:bg-pink-100",
      }}
    />
  );
}
