import { NewIngredientForm } from "./new-ingredient-form";

export default function NewIngredientPage() {
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Novo ingrediente</h1>
        <p className="text-sm text-muted-foreground">
          Adiciona um ingrediente à base de dados
        </p>
      </div>
      <NewIngredientForm />
    </div>
  );
}
