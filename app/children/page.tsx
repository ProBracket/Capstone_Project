"use client";

import { useEffect, useState } from "react";
import { getChildren, addChild } from "@/lib/auth";

type Child = {
  id: number;
  nickname: string;
  age: number;
};

const fakeChildren: Child[] = [
  { id: 1, nickname: "Tommy", age: 7 },
  { id: 2, nickname: "Sarah", age: 9 },
];

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>(fakeChildren);
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState("");

  async function loadChildren() {
  const { data, error } = await getChildren();

  if (error) {
    console.error(error);
    return;
  }

  const combinedChildren = [
    ...fakeChildren,
    ...(data || []),
  ];

  setChildren(combinedChildren);
}

useEffect(() => {
  async function fetchData() {
    const { data, error } = await getChildren();

    if (error) {
      console.error(error);
      return;
    }

    const combinedChildren = [
      ...fakeChildren,
      ...(data || []),
    ];

    setChildren(combinedChildren);
  }

  fetchData();
}, []);

  const handleAddChild = async () => {
  if (!nickname || !age) return;

  const { data, error } = await addChild(
    nickname,
    Number(age)
  );

  if (error) {
    alert(`Error: ${error.message}`);
    return;
  }

  if (data && data.length > 0) {
    setChildren((prev) => [...prev, data[0]]);
  }

  setNickname("");
  setAge("");
  
  await loadChildren();
  alert("Child added successfully!");
};

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 p-6">

      {/* Background Effects */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"></div>

      <div className="absolute bottom-20 right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.04)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      {/* Main Card */}
      <div className="relative z-10 max-w-2xl mx-auto bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-blue-100">

        <h1
          className="text-4xl font-extrabold text-center mb-2 tracking-wide text-blue-700 drop-shadow-[0_0_10px_rgba(37,99,235,0.3)]"
          style={{ fontFamily: "Trebuchet MS, sans-serif" }}
        >
          ThinkFirst
        </h1>

        <h2
          className="text-2xl text-center mb-6 italic text-gray-700"
          style={{
            fontFamily:
              "Comic Sans MS, Monotype Corsiva, cursive",
          }}
        >
          My Children
        </h2>

        {/* Children List */}
        <div className="mb-6">
          {children.length === 0 ? (
            <div className="text-center text-gray-500">
              No children found.
            </div>
          ) : (
            children.map((child) => (
              <div
                key={child.id}
                className="bg-gradient-to-r from-white to-blue-50 border border-blue-200 rounded-xl p-4 mb-3 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <p className="text-base">
                  <strong className="text-blue-700">
                    Nickname:
                  </strong>{" "}
                  {child.nickname}
                </p>

                <p className="text-base mt-1">
                  <strong className="text-blue-700">
                    Age:
                  </strong>{" "}
                  {child.age}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Add Child Form */}
        <div className="max-w-sm mx-auto bg-white border border-blue-100 rounded-xl p-5 shadow-lg">

          <h3 className="text-lg font-semibold text-slate-700 mb-3">
            Add New Child
          </h3>

          <div className="space-y-3">

            <input
              type="text"
              placeholder="Nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full p-3 border border-blue-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="number"
              placeholder="Age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full p-3 border border-blue-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={handleAddChild}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg font-semibold shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300"
            >
              Add Child
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}