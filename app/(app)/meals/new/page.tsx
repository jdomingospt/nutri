import { NewMealForm } from "./new-meal-form";
import { format } from "date-fns";

export default function NewMealPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  return (
    <div className="max-w-md mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Nova refeição</h1>
        <p className="text-sm text-muted-foreground">
          Adiciona uma refeição manualmente
        </p>
      </div>
      <NewMealForm defaultDate={today} />
    </div>
  );
}
