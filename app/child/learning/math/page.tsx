/** Math lessons (/child/learning/math).
 * Everything happens in components/LessonView.tsx; this page only picks
 * the subject, its title and its colours.
 */
"use client";

import LessonView from "@/components/LessonView";

export default function MathPage() {
  return (
    <LessonView
      subject="math"
      title="Math"
      emoji="➗"
      colours={{
        background: "bg-amber-50",
        heading: "text-amber-700",
        hover: "hover:bg-amber-100",
      }}
    />
  );
}
