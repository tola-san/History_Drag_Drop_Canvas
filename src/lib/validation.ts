import { z } from "zod";
const email = z.email("Enter a valid email address.").max(254);
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
  rememberMe: z.boolean(),
});
export const registerSchema = z
  .object({
    email,
    password: z
      .string()
      .min(12, "Use at least 12 characters.")
      .max(128, "Use no more than 128 characters."),
    confirmPassword: z.string().min(1, "Confirm your password."),
    terms: z.boolean().refine(Boolean, "Please accept the terms to continue."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });
export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
