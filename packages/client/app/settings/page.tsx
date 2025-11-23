'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"


export default function SettingsPage() {
  const [budget, setBudget] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("budget");
      return stored ? Number(stored) : "500000";
    }
    return "";
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBudget(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("budget", value);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("budget", budget.toString());
    }
    // Aquí podrías poner una notificación/toast etc.
  };

  return (
    <div className="p-10 pb-28">
      <h1 className="text-2xl font-bold mb-10 font-display">Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-8 w-xs">
        <div>
          <Label htmlFor="budget" className="text-base font-semibold">
            Presupuesto Variable Mensual
          </Label>
          <Input
            id="budget"
            type="number"
            value={budget}
            onChange={handleChange}
            min={0}
            className="mt-2"
            />
        </div>
        <Button type="submit" className="w-full">Guardar</Button>
      </form>
    </div>
  );
}
