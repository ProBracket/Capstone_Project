/** Sends a child to the calibration test the first time they use the app.
 *
 * Placed on the child's welcome page. It shows nothing on screen: it only
 * checks whether this child has finished calibration and, if not, moves
 * them to /calibration?childId=<id>, which starts at their school grade.
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasCompletedCalibration } from "@/lib/calibrationResults";

type Props = {
  // The child using the app, or null if the page was opened without one.
  childId: string | null;
};

export default function CalibrationGate({ childId }: Props) {
  const router = useRouter();

  useEffect(() => {
    // No child chosen: nothing to check.
    if (childId === null) {
      return;
    }

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
