"use client";
export function PasswordStrength({ password }: { password: string }) {
  const score =
    password.length === 0
      ? 0
      : Math.min(
          4,
          (password.length >= 12 ? 2 : 1) +
            Number(password.length >= 16) +
            Number(
              /[a-z]/.test(password) &&
                /[A-Z]/.test(password) &&
                /[^a-zA-Z]/.test(password),
            ),
        );
  const labels = [
    "Use at least 12 characters",
    "Weak",
    "Fair",
    "Good",
    "Strong",
  ];
  return (
    <div className="mt-3">
      <div
        className="flex gap-1.5"
        role="meter"
        aria-label="Estimated password strength"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={score}
        aria-valuetext={labels[score]}
      >
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={`h-1 flex-1 rounded-full ${n > score ? "bg-slate-100" : score < 2 ? "bg-amber-500" : score < 4 ? "bg-pink-400" : "bg-emerald-500"}`}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {labels[score]}
        {score > 0 && " · Longer passwords are better."}
      </p>
    </div>
  );
}
