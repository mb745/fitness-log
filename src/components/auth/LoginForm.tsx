import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabaseClient } from "@/db/supabase.client";

const schema = z.object({
  email: z.string().email("Nieprawidłowy e-mail"),
  password: z.string().min(8, "Hasło musi mieć min. 8 znaków"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm({ className }: { className?: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (data: FormValues) => {
    setErrorMessage(null);
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      if (error.status === 429) {
        setErrorMessage("Zbyt wiele prób. Spróbuj ponownie później.");
      } else {
        setErrorMessage("Nieprawidłowe dane logowania");
      }
    } else {
      window.location.replace("/dashboard");
    }
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
          autoComplete="email"
          aria-invalid={!!errors.email}
          data-testid="email-input"
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
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          data-testid="password-input"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/50"
          {...register("password")}
        />
        {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
      </div>

      {errorMessage && (
        <p className="text-sm text-destructive" data-testid="error-message">
          {errorMessage}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} data-testid="login-button" className="mt-2 w-full">
        {isSubmitting ? "Logowanie..." : "Zaloguj się"}
      </Button>
    </form>
  );
}

export default LoginForm;
