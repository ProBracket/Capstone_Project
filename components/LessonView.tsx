/** The lesson screen shared by the Math, Science and Literature pages.
 *
 * 1. Shows the curriculum topics for the child's level in this subject
 *    (getTopicsForSubject in lib/lessons.ts).
 * 2. When a topic is clicked, asks /api/lesson to write a lesson.
 * 3. Shows the lesson as tidy sections and a summary, then a practice box
 *    where the child answers with Bud's Think First rules (LessonPractice).
 *
 * Each subject page passes only its subject, title, emoji and colours.
 */
"use client";

import { useEffect, useState } from "react";
import ChildNavbar from "@/components/ChildNavbar";
import LessonPractice from "@/components/LessonPractice";
import { authHeaders } from "@/lib/authHeaders";
import { getActiveChildId } from "@/lib/activeChild";
import type { Lesson } from "@/lib/lessonGenerator";
import { getTopicsForSubject } from "@/lib/lessons";
import type { Topic } from "@/lib/problemGenerator";
import type { Problem } from "@/lib/tutor";

// The subject's colours. Written out in full in each page (e.g.
// "text-amber-700") because Tailwind only includes classes it can find
// spelled out in the code.
export type LessonColours = {
  background: string; // page background, e.g. "bg-amber-50"
  heading: string; // heading text, e.g. "text-amber-700"
  hover: string; // topic button hover, e.g. "hover:bg-amber-100"
};

type LessonViewProps = {
  subject: Problem["subject"];
  title: string; // e.g. "Math"
  emoji: string; // e.g. "➗"
  colours: LessonColours;
};

export default function LessonView({ subject, title, emoji, colours }: LessonViewProps) {
  const [childId, setChildId] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  // The curriculum grade (4 to 9) the topics belong to.
  const [grade, setGrade] = useState<number | null>(null);
  const [loadingTopics, setLoadingTopics] = useState(true);
  // true if the child's level couldn't be read (no AI profile yet, which
  // means calibration isn't finished, or the database couldn't be reached).
  const [topicsFailed, setTopicsFailed] = useState(false);

  // The topic that was clicked, and its lesson once written.
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [writingLesson, setWritingLesson] = useState(false);
  const [error, setError] = useState("");

  // Load the topics once, when the page opens.
  useEffect(() => {
    async function loadTopics() {
      const activeChild = getActiveChildId();
      setChildId(activeChild);
      if (!activeChild) {
        setLoadingTopics(false);
        return;
      }
      try {
        const result = await getTopicsForSubject(activeChild, subject);
        setTopics(result.topics);
        setGrade(result.frameworkGrade);
      } catch (loadError) {
        console.error("Could not load lesson topics:", loadError);
        setTopicsFailed(true);
      }
      setLoadingTopics(false);
    }
    loadTopics();
  }, [subject]);

  /** Runs when a topic is clicked: asks the server to write its lesson. */
  async function openTopic(topic: Topic) {
    if (grade === null) {
      return;
    }
    setSelectedTopic(topic);
    setLesson(null);
    setError("");
    setWritingLesson(true);

    try {
      const response = await fetch("/api/lesson", {
        method: "POST",
        headers: await authHeaders(), // includes the login token (lib/authHeaders.ts)
        // Only the topic's NAME is sent; the server looks the topic up itself.
        body: JSON.stringify({ subject, grade, topicName: topic.topic }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Something went wrong while writing this lesson.");
      } else {
        setLesson(result as Lesson);
      }
    } catch (fetchError) {
      console.error(fetchError);
      setError("Something went wrong while writing this lesson.");
    } finally {
      setWritingLesson(false);
    }
  }

  /** Back to the list of topics. */
  function closeTopic() {
    setSelectedTopic(null);
    setLesson(null);
    setError("");
  }

  return (
    <>
      <ChildNavbar />

      {/* ml-sidebar = leave room for the side menu (same on every child page). */}
      <main className={`ml-sidebar min-h-screen p-8 ${colours.background}`}>
        <div className="mx-auto max-w-3xl">
          <h1 className={`mb-6 text-4xl font-bold ${colours.heading}`}>
            {emoji} {title}
          </h1>

          {loadingTopics && <p className="text-gray-700">Loading topics...</p>}

          {!loadingTopics && !childId && (
            <p className="text-gray-700">No learner selected. Pick a learner first.</p>
          )}

          {/* 1. The list of topics (hidden while a lesson is open). */}
          {!loadingTopics && childId && selectedTopic === null && (
            <>
              <h2 className="mb-4 text-2xl font-semibold text-gray-800">Choose a topic</h2>
              {topicsFailed && (
                <p className="text-gray-700">
                  We couldn&apos;t find this learner&apos;s level. If they haven&apos;t taken the
                  calibration test yet, do that first. Otherwise, please refresh the page.
                </p>
              )}
              <div className="grid gap-4">
                {topics.map((topic) => (
                  <button
                    key={topic.topic}
                    type="button"
                    onClick={() => openTopic(topic)}
                    className={`rounded-xl bg-white p-4 text-left text-lg text-gray-800 shadow ${colours.hover}`}
                  >
                    {topic.topic}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* 2. A topic is open. */}
          {selectedTopic !== null && (
            <>
              <button
                type="button"
                onClick={closeTopic}
                className="mb-6 rounded-full border border-gray-300 bg-white px-5 py-2 font-semibold text-gray-700 hover:bg-gray-50"
              >
                ← All topics
              </button>

              {writingLesson && (
                <div className="rounded-xl bg-white p-6 text-gray-700 shadow">
                  🌱 Bud is writing your lesson on <strong>{selectedTopic.topic}</strong>...
                </div>
              )}

              {error !== "" && (
                <div className="rounded-xl bg-white p-6 shadow">
                  <p className="text-gray-800">{error}</p>
                  <button
                    type="button"
                    onClick={() => openTopic(selectedTopic)}
                    className="mt-4 rounded-full bg-gray-800 px-5 py-2 font-semibold text-white"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* 3. The lesson: sections, summary, then practice. */}
              {lesson !== null && (
                <article>
                  <h2 className={`mb-6 text-3xl font-bold ${colours.heading}`}>{lesson.title}</h2>

                  {lesson.sections.map((section, index) => (
                    <section key={index} className="mb-5 rounded-xl bg-white p-6 shadow">
                      <h3 className="mb-2 text-xl font-bold text-gray-800">
                        {index + 1}. {section.heading}
                      </h3>
                      <p className="text-lg leading-8 text-gray-800">{section.text}</p>
                    </section>
                  ))}

                  <section className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-6">
                    <h3 className="mb-2 text-xl font-bold text-gray-800">⭐ Remember</h3>
                    <p className="text-lg leading-8 text-gray-800">{lesson.summary}</p>
                  </section>

                  {lesson.problems.length > 0 ? (
                    // key = a new practice box (fresh memory) for each lesson.
                    <LessonPractice key={lesson.title} problems={lesson.problems} />
                  ) : (
                    <p className="mt-6 text-gray-700">
                      No practice questions this time. Try another topic, or chat with Bud!
                    </p>
                  )}
                </article>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
