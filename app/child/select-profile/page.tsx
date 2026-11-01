"use client";

export default function SelectProfilePage() {
  const children = [
    {
      id: "1",
      name: "Emma",
      avatar: "😀",
    },
    {
      id: "2",
      name: "Noah",
      avatar: "🚀",
    },
    {
      id: "3",
      name: "Ava",
      avatar: "🐱",
    },
  ];

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
        {children.map((child) => (
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
        "/child/calibration";
    }}
  >
    <div style={{ fontSize: "60px" }}>
      {child.avatar}
    </div>

    <div>{child.name}</div>
  </button>
))}
      </div>
    </div>
  );
}
