"use client";

interface StatusBarProps {
  phase: "idle" | "discovering" | "auditing" | "done" | "error";
  message: string;
}

export default function StatusBar({ phase, message }: StatusBarProps) {
  if (phase === "idle") return null;

  const styles = {
    discovering: "bg-indigo-50 border-indigo-200 text-indigo-800",
    auditing: "bg-purple-50 border-purple-200 text-purple-800",
    done: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    idle: "",
  };

  return (
    <div className={`px-4 py-2.5 border-b text-sm flex items-center gap-2 ${styles[phase]}`}>
      {(phase === "discovering" || phase === "auditing") && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {phase === "done" && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {phase === "error" && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <span>{message}</span>
    </div>
  );
}
