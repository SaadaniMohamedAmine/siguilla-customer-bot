import { z } from "zod";

export const SignInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const SignUpSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const ResetPasswordSchema = z.object({
  password: z.string().min(8).max(72),
});

export function passwordStrength(password: string): "weak" | "fair" | "strong" {
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(password)).length;
  if (password.length >= 12 && classes >= 3) return "strong";
  if (password.length >= 8 && classes >= 2) return "fair";
  return "weak";
}
