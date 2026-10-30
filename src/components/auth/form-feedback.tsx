import { CircleAlert, CircleCheck } from "lucide-react";
export function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="mt-1.5 text-xs text-red-600">
      {message}
    </p>
  ) : null;
}
export function FormFeedback({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (!error && !success) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      className={`flex gap-2 rounded-lg border p-3 text-sm leading-5 ${error ? "border-red-100 bg-red-50 text-red-700" : "border-emerald-100 bg-emerald-50 text-emerald-800"}`}
    >
      {error ? (
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
      ) : (
        <CircleCheck className="mt-0.5 size-4 shrink-0" />
      )}
      <span>{error || success}</span>
    </div>
  );
}
