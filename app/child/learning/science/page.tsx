"use client";

import { useEffect, useState } from "react";

import ChildNavbar from "@/components/ChildNavbar";

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

      <main className="ml-64 min-h-screen p-8 bg-green-50">
        <h1 className="text-4xl font-bold text-green-700 mb-4">
          🔬 Science
        </h1>

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