"use client";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput } from "./password-input";
import { PasswordStrength } from "./password-strength";
import { FieldError, FormFeedback } from "./form-feedback";
import { registerSchema, type RegisterValues } from "@/lib/validation";
import { authApi } from "@/lib/auth-api";
export function RegisterForm() {
  const [success, setSuccess] = useState("");
  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });
  const password = useWatch({ control, name: "password" });
  async function submit(values: RegisterValues) {
    clearErrors("root");
    setSuccess("");
    try {
      await authApi.register(values);
      reset();
      setSuccess(
        "Your request was accepted. Check your email for next steps, or log in if your account is ready.",
      );
    } catch (error) {
      setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Unable to create your account. Please try again.",
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
            id="email"
            className="mt-2 h-11"
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
              autoComplete="new-password"
              placeholder="Create a password"
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password
                  ? "password-hint password-error"
                  : "password-hint"
              }
              {...register("password")}
            />
          </div>
          <p id="password-hint" className="mt-2 text-xs text-slate-500">
            Use 12–128 characters. A memorable passphrase works well.
          </p>
          <PasswordStrength password={password} />
          <FieldError id="password-error" message={errors.password?.message} />
        </div>
        <div>
          <Label htmlFor="confirm-password">Confirm password</Label>
          <div className="mt-2">
            <PasswordInput
              id="confirm-password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword ? "confirm-error" : undefined
              }
              {...register("confirmPassword")}
            />
          </div>
          <FieldError
            id="confirm-error"
            message={errors.confirmPassword?.message}
          />
        </div>
        <div>
          <div className="flex items-start gap-2.5">
            <Controller
              control={control}
              name="terms"
              render={({ field }) => (
                <Checkbox
                  className="mt-0.5"
                  id="terms"
                  checked={field.value}
                  onCheckedChange={(value) => field.onChange(value === true)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  aria-invalid={!!errors.terms}
                  aria-describedby={errors.terms ? "terms-error" : undefined}
                />
              )}
            />
            <label htmlFor="terms" className="text-xs leading-5 text-slate-500">
              I agree to the{" "}
              <Link
                href="/terms"
                className="font-medium text-pink-600 hover:underline"
              >
                Terms of service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="font-medium text-pink-600 hover:underline"
              >
                Privacy policy
              </Link>
              .
            </label>
          </div>
          <FieldError id="terms-error" message={errors.terms?.message} />
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
            Creating account…
          </>
        ) : (
          <>
            Create account
            <ArrowRight size={16} />
          </>
        )}
      </Button>
      <p className="text-center text-xs text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-pink-600 hover:underline"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
