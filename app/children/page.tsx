"use client";

import { useState } from "react";

type Child = {
  id: number;
  nickname: string;
  age: number;
};

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([
    { id: 1, nickname: "Tommy", age: 7 },
    { id: 2, nickname: "Sarah", age: 9 },
  ]);

  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState("");

  const handleAddChild = () => {
    if (!nickname || !age) return;

    const newChild: Child = {
      id: Date.now(),
      nickname,
      age: Number(age),
    };

    setChildren([...children, newChild]);

    setNickname("");
    setAge("");
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        My Children
      </h1>

      <div className="mb-6">
        {children.map((child) => (
          <div
            key={child.id}
            className="border p-4 rounded mb-3"
          >
            <p>
              <strong>Nickname:</strong> {child.nickname}
            </p>

            <p>
              <strong>Age:</strong> {child.age}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3 max-w-md">
        <input
          type="text"
          placeholder="Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          type="number"
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <button
          onClick={handleAddChild}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Child
        </button>
      </div>
    </div>
  );
}