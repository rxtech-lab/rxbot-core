"use client";

export default function Page() {
  return (
    <div>
      <span>This is a page with a callback error.</span>
      <button
        key={"button"}
        onClick={() => {
          throw new Error("Custom: This is a custom error.");
        }}
      >
        Click
      </button>
    </div>
  );
}
