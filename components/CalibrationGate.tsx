/** Sends a child to the calibration test the first time they use the app.
 *
 * Placed on the child's welcome page. It shows nothing on screen. It checks
 * whether this child has finished calibration and, if not, moves them to
 * /calibration?childId=<id>, which starts at their school grade.
 *
 * Which child it is comes from app/child/layout.tsx, which asks Supabase who
 * is playing on this device (and saves it for lib/activeChild.ts). It used to
 * come from the URL, but then any child could type a sibling's id there.
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActiveChildId } from "@/app/child/ActiveChildProvider";
import { hasCompletedCalibration } from "@/lib/calibrationResults";

export default function CalibrationGate() {
  const router = useRouter();
  const childId = useActiveChildId();

  useEffect(() => {
    // If the child leaves this page before the check finishes, ignore the
    // result instead of moving them to calibration from another page.
    let stillHere = true;

    hasCompletedCalibration(childId).then((done) => {
      if (stillHere && !done) {
        // replace (not push) so the Back button doesn't return here and
        // send them to calibration again.
        router.replace(`/calibration?childId=${childId}`);
      }
    });

    // Runs when the child leaves this page.
    return () => {
      stillHere = false;
    };
  }, [childId, router]);

  // Nothing to show on screen.
  return null;
}
