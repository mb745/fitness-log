import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { profileUpdateSchema } from "../../../lib/validation/profile.validation";
import { useProfile } from "../../../lib/hooks/profile";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Select } from "../../ui/select";
import { Toast } from "../../ui/toast";

const schema = profileUpdateSchema;

type FormData = z.infer<typeof schema>;

const PersonalTab: React.FC = () => {
  const { data: profile, updateProfile, updating } = useProfile();

  const { register, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {} as FormData,
  });

  useEffect(() => {
    if (profile) {
      reset({
        weight_kg: profile.weight_kg ?? undefined,
        height_cm: profile.height_cm ?? undefined,
        gender: profile.gender ?? undefined,
      });
    }
  }, [profile, reset]);

  const [toast, setToast] = React.useState<string | null>(null);

  const onSubmit = async (data: FormData) => {
    try {
      await updateProfile(data);
      setToast("Zapisano zmiany");
      reset(data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error updating profile:", error);
      setToast("Błąd podczas zapisywania");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
      <div>
        <label htmlFor="weight_kg" className="block text-sm font-medium mb-1">
          Waga (kg)
        </label>
        <Input id="weight_kg" type="number" step="0.1" {...register("weight_kg", { valueAsNumber: true })} />
      </div>
      <div>
        <label htmlFor="height_cm" className="block text-sm font-medium mb-1">
          Wzrost (cm)
        </label>
        <Input id="height_cm" type="number" {...register("height_cm", { valueAsNumber: true })} />
      </div>
      <div>
        <label htmlFor="gender" className="block text-sm font-medium mb-1">
          Płeć
        </label>
        <Select id="gender" {...register("gender")}>
          <option value="">-- wybierz --</option>
          <option value="male">Mężczyzna</option>
          <option value="female">Kobieta</option>
          <option value="na">Nie chcę podawać</option>
        </Select>
      </div>
      <Button type="submit" disabled={updating}>
        {updating ? "Zapisywanie…" : "Zapisz"}
      </Button>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </form>
  );
};

export default PersonalTab;
