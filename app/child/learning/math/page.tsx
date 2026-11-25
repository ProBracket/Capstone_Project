"use client";

import { useEffect, useState } from "react";

import ChildNavbar from "@/components/ChildNavbar";

import { getActiveChildId } from "@/lib/activeChild";
import { getTopicsForSubject } from "@/lib/lessons";

type Topic = {
  topic: string;
  outcomes: string[];
  keywords: string[];
};

export default function MathPage() {
  const [childId, setChildId] = useState<string | null>(null);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [frameworkGrade, setFrameworkGrade] =
    useState<number | null>(null);

  const [selectedTopic, setSelectedTopic] =
    useState<Topic | null>(null);

  const [lesson, setLesson] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [generatingLesson, setGeneratingLesson] =
    useState(false);

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
          "math"
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

  async function handleTopicClick(topic: Topic) {
    setSelectedTopic(topic);

    setLesson(null);

    if (frameworkGrade === null) {
      return;
    }

    setGeneratingLesson(true);

    try {
      const response = await fetch("/api/lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: "math",
          frameworkGrade,
          topic,
        }),
      });

      const result = await response.json();

      setLesson(
        result.lesson ??
          "No lesson content was returned."
      );
    } catch (error) {
      console.error(error);

      setLesson(
        "Sorry, something went wrong while generating this lesson."
      );
    } finally {
      setGeneratingLesson(false);
    }
  }

  return (
    <>
      <ChildNavbar />

      <main className="ml-64 min-h-screen bg-amber-50 p-8">
        <h1 className="mb-6 text-4xl font-bold text-amber-700">
          ➗ Math
        </h1>

        {loading && (
          <p>Loading topics...</p>
        )}

        {!loading && !childId && (
          <p>No active child selected.</p>
        )}

        {!loading && childId && (
          <>
            <h2 className="mb-4 text-2xl font-semibold">
              Choose a Topic
            </h2>

            <div className="grid gap-4">
              {topics.map((topic) => (
                <button
                  key={topic.topic}
                  onClick={() =>
                    handleTopicClick(topic)
                  }
                  className="rounded-xl bg-white p-4 text-left shadow hover:bg-amber-100"
                >
                  {topic.topic}
                </button>
              ))}
            </div>

            {selectedTopic && (
              <div className="mt-8 rounded-xl bg-white p-6 shadow">
                <h2 className="text-2xl font-bold text-amber-700">
                  {selectedTopic.topic}
                </h2>

                {generatingLesson ? (
                  <p className="mt-2 text-gray-600">
                    Generating lesson...
                  </p>
                ) : (
                  <p className="mt-2 text-gray-600">
                    Lesson ready.
                  </p>
                )}
              </div>
            )}

            {lesson && (
              <div className="mt-8 rounded-xl bg-white p-8 shadow">
                <h2 className="mb-6 text-3xl font-bold text-amber-700">
                  {selectedTopic?.topic}
                </h2>

                <div className="whitespace-pre-wrap text-lg leading-8 text-gray-800">
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