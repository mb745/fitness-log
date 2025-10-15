import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabaseClient } from "@/db/supabase.client";

const schema = z
  .object({
    email: z.string().email("Nieprawidłowy e-mail"),
    password: z
      .string()
      .min(8, "Min. 8 znaków, w tym litera i cyfra")
      .regex(/[A-Za-z].*[0-9]|[0-9].*[A-Za-z]/, "Musi zawierać literę i cyfrę"),
    confirmPassword: z.string(),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: "Zaakceptuj regulamin" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są zgodne",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function RegisterForm({ className }: { className?: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });
  const passwordValue = watch("password");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (data: FormValues) => {
    setErrorMessage(null);
    const { error: signUpError, data: signUpData } = await supabaseClient.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (signUpError) {
      if (signUpError.status === 409) {
        setErrorMessage("Użytkownik już istnieje");
      } else {
        setErrorMessage("Rejestracja nie powiodła się");
      }
      return;
    }

    // Check if session was created (email confirmation might be required)
    if (!signUpData.session) {
      setErrorMessage("Potwierdź swój adres e-mail przed zalogowaniem");
      return;
    }

    // Small delay to ensure cookies are synchronized
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Create profile via API
    const response = await fetch("/api/v1/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      setErrorMessage(errorData.message || "Nie udało się utworzyć profilu");
      return;
    }

    // Redirect on success
    window.location.replace("/dashboard");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("grid gap-4", className)} noValidate>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          aria-invalid={!!errors.email}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/50"
          {...register("email")}
        />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          Hasło
        </label>
        <input
          id="password"
          type="password"
          aria-invalid={!!errors.password}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/50"
          {...register("password")}
        />
        {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">
          Potwierdź hasło
        </label>
        <input
          id="confirmPassword"
          type="password"
          aria-invalid={!!errors.confirmPassword}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/50"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>}
      </div>

      {/* Password strength indicator - basic */}
      <PasswordStrengthIndicator password={passwordValue} />

      <div className="flex items-start gap-2">
        <input
          id="terms"
          type="checkbox"
          aria-invalid={!!errors.termsAccepted}
          className="mt-1 size-4 rounded border-input text-primary focus:ring-primary"
          {...register("termsAccepted")}
        />
        <label htmlFor="terms" className="text-sm">
          Akceptuję regulamin
        </label>
      </div>
      {errors.termsAccepted && <p className="-mt-2 text-xs text-destructive">{errors.termsAccepted.message}</p>}

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
        {isSubmitting ? "Rejestracja..." : "Zarejestruj się"}
      </Button>
    </form>
  );
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  // Simple heuristic – length based (placeholder for zxcvbn)
  const getStrength = () => {
    if (!password) return { label: "", color: "" };
    if (password.length < 8) return { label: "Słabe", color: "bg-destructive" };
    if (password.length < 12) return { label: "Średnie", color: "bg-yellow-500" };
    return { label: "Mocne", color: "bg-green-600" };
  };
  const { label, color } = getStrength();
  if (!label) return null;
  return (
    <div className="space-y-1">
      <div className="h-2 w-full rounded bg-muted">
        <div
          className={cn("h-2 rounded", color)}
          style={{ width: label === "Słabe" ? "33%" : label === "Średnie" ? "66%" : "100%" }}
        />
      </div>
      <p className="text-xs">Siła hasła: {label}</p>
    </div>
  );
}
