import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    fullName: z
      .string({ error: () => "Full name is required." })
      .trim()
      .min(2, "Full name must be at least 2 characters.")
      .max(100, "Full name must be at most 100 characters."),

    email: z
      .string({ error: () => "Email is required." })
      .trim()
      .toLowerCase()
      .email("Invalid email address."),

    // bcrypt silently truncates passwords beyond 72 bytes
    // enforcing the max here prevents silent data loss
    password: z
      .string({ error: () => "Password is required." })
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password must be at most 72 characters."),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ error: () => "Email is required." })
      .trim()
      .toLowerCase()
      .email("Invalid email address."),

    password: z
      .string({ error: () => "Password is required." })
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password must be at most 72 characters."),
  }),
});