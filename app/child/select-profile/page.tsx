"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SelectProfilePage() {
 const [children, setChildren] = useState<any[]>([]);

useEffect(() => {
    async function loadChildren() {
      const { data, error } = await supabase
        .from("children")
        .select("*");

      if (error) {
        console.error(error);
        return;
      }

      setChildren(data || []);
    }

    loadChildren();
  }, []);
 
  return (
    <div
      style={{
        textAlign: "center",
        padding: "50px",
      }}
    >
      <h1>Who's Learning Today?</h1>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "30px",
          marginTop: "40px",
        }}
      >
        {children.length === 0 ? (
  <p>No child profiles found.</p>
) : (
  children.map((child) => (
    <button
      key={child.id}
      style={{
        border: "none",
        background: "none",
        cursor: "pointer",
        fontSize: "20px",
      }}
      onClick={() => {
        localStorage.setItem(
          "selectedChildId",
          child.id
        );

        window.location.href =
          "/calibration";
      }}
    >
      <div style={{ fontSize: "60px" }}>
        😀
      </div>

      <div>{child.name}</div>
    </button>
  ))
)}
      </div>
    </div>
  );
}
