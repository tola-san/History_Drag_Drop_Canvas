"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput } from "./password-input";
import { FieldError, FormFeedback } from "./form-feedback";
import { loginSchema, type LoginValues } from "@/lib/validation";
import { authApi } from "@/lib/auth-api";
export function LoginForm() {
  const router = useRouter();
  const [success, setSuccess] = useState("");
  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });
  async function submit(values: LoginValues) {
    clearErrors("root");
    setSuccess("");
    try {
      await authApi.login(values);
      await authApi.me();
      setSuccess("Signed in. Opening your workspace…");
      router.replace("/onboarding");
      router.refresh();
    } catch (error) {
      setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Unable to sign in. Please try again.",
      });
    }
  }
  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="space-y-5"
      aria-busy={isSubmitting}
    >
      <fieldset
        disabled={isSubmitting}
        className="min-w-0 space-y-5 disabled:opacity-70"
      >
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            className="mt-2 h-11"
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          <FieldError id="email-error" message={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="mt-2">
            <PasswordInput
              id="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
          </div>
          <FieldError id="password-error" message={errors.password?.message} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="rememberMe"
              render={({ field }) => (
                <Checkbox
                  id="remember"
                  checked={field.value}
                  onCheckedChange={(value) => field.onChange(value === true)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                />
              )}
            />
            <Label
              htmlFor="remember"
              className="text-xs font-normal text-slate-600"
            >
              Remember me
            </Label>
          </div>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-pink-600 hover:text-pink-800"
          >
            Forgot password?
          </Link>
        </div>
      </fieldset>
      <FormFeedback error={errors.root?.message} success={success} />
      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full bg-pink-600 text-white hover:bg-pink-700"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle className="animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            Log in
            <ArrowRight size={16} />
          </>
        )}
      </Button>
      <p className="text-center text-xs leading-5 text-slate-500">
        Don’t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-pink-600 hover:underline"
        >
          Sign up for free
        </Link>
      </p>
    </form>
  );
}
