"use client";

import { useEffect, useState } from "react";

import ChildNavbar from "@/components/ChildNavbar";
// line icons (same icon set as the navbar)
import { ArrowLeft, FlaskConical } from "lucide-react";

// Science page (/child/learning/science)
// Same chunky style as the home page, in the Science colour.
// Lessons are not built yet, so the page shows a "coming soon" message.
// When the team adds lessons, the lesson list goes where that message is.

import { getActiveChildId } from "@/lib/activeChild";

import { getTopicsForSubject, } from "@/lib/lessons";

type Topic = {
  topic: string;
  outcomes: string[];
  keywords: string[];
};

export default function SciencePage() {
  const [childId, setChildId] = useState<string | null>(null);

  const [topics, setTopics] = useState<Topic[]>([]);

  const [frameworkGrade, setFrameworkGrade] =
    useState<number | null>(null);

  const [selectedTopic, setSelectedTopic] =
    useState<Topic | null>(null);

  const [lesson, setLesson] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTopics() {
      const activeChild = getActiveChildId();

      setChildId(activeChild);

      if (!activeChild) {
        setLoading(false);
        return;
      }

      try {
        const result = await getTopicsForSubject(
          activeChild,
          "science"
        );

        setTopics(result.topics);
        setFrameworkGrade(result.frameworkGrade);
      } catch (error) {
        console.error(error);
      }

      setLoading(false);
    }

    loadTopics();
  }, []);

  async function handleTopicClick(
    topic: Topic
  ) {
    setSelectedTopic(topic);

    if (frameworkGrade === null) {
      return;
    }

    try {
      const response = await fetch(
  "/api/lesson",
  {
    method: "POST",
    headers: {
      "Content-Type":
        "application/json",
    },
    body: JSON.stringify({
      subject: "science",
      frameworkGrade,
      topic,
    }),
  }
);

const result = await response.json();

setLesson(result.lesson);

      setLesson(result.lesson);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <>
      <ChildNavbar />

      {/* ml-sidebar = leave room for the sidebar (same on every child page) */}
      <main className="ml-sidebar min-h-screen bg-background px-10 py-8">
        <div className="mx-auto max-w-4xl">

          {/* back to the "Choose a Subject" page */}
          <Link
            href="/child/learning"
            className="inline-flex items-center gap-2 rounded-control font-semibold text-muted hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" size={18} strokeWidth={2.25} />
            All subjects
          </Link>

          {/* ----- BIG SUBJECT BANNER ----- */}
          <section className="mt-4 flex flex-wrap items-center gap-6 rounded-3xl border-b-8 border-sky-500 bg-sky-300 px-8 py-7 text-sky-950">
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/50">
              <FlaskConical aria-hidden="true" size={44} strokeWidth={2.25} />
            </span>

            <div>
              <h1 className="text-4xl font-extrabold">Science</h1>
              <p className="font-semibold opacity-80">Plants, animals and space</p>
            </div>
          </section>

          {/* ----- LESSONS (coming soon) ----- */}
          <h2 className="mt-8 text-2xl font-extrabold text-foreground">Lessons</h2>

        {loading && (
          <p>Loading topics...</p>
        )}

        {!loading && !childId && (
          <p>No active child selected.</p>
        )}

        {!loading && childId && (
          <>
            <h2 className="text-2xl font-semibold mb-4">
              Choose a Topic
            </h2>

            <div className="grid gap-4">
              {topics.map((topic) => (
                <button
                  key={topic.topic}
                  onClick={() =>
                    handleTopicClick(topic)
                  }
                  className="bg-white p-4 rounded-xl shadow text-left hover:bg-green-100"
                >
                  {topic.topic}
                </button>
              ))}
            </div>

            {selectedTopic && (
              <div className="mt-8 bg-white p-6 rounded-xl shadow">
                <h3 className="text-xl font-bold mb-2">
                  {selectedTopic.topic}
                </h3>

                <p className="font-semibold mb-2">
                  Learning Outcomes
                </p>

                <ul className="list-disc pl-6">
                  {selectedTopic.outcomes.map(
                    (outcome) => (
                      <li key={outcome}>
                        {outcome}
                      </li>
                    )
                  )}
                </ul>

                <p className="font-semibold mt-4 mb-2">
                  Keywords
                </p>

                <p>
                  {selectedTopic.keywords.join(
                    ", "
                  )}
                </p>
              </div>
            )}

            {lesson && (
              <div className="mt-8 bg-white p-6 rounded-xl shadow">
                <h3 className="text-xl font-bold mb-4">
                  Generated Lesson
                </h3>

                <div className="whitespace-pre-wrap">
                  {lesson}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
