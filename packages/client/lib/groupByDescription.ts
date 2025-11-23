import { Movement } from "./types";

type GroupedTransfer = {
  description: string;
  totalAmount: number;
  movements: Movement[];
}

export function groupTransfersByDescription(movements: Movement[]): GroupedTransfer[] {
  const groups: Record<string, GroupedTransfer> = {};
  if (!movements || !Array.isArray(movements)) {
    return [];
  }

  for (const mov of movements) {
    const desc = mov.description?.trim() || "Sin descripción";
    if (!groups[desc]) {
      groups[desc] = {
        description: desc,
        totalAmount: 0,
        movements: [],
      };
    }
    groups[desc].totalAmount -= mov.amount || 0;
    groups[desc].movements.push(mov);
  }
  

  return Object.values(groups).filter(
    group =>
      !group.description.toLowerCase().includes("transf") &&
      !group.description.toLowerCase().includes("depósito") &&
      !group.description.toLowerCase().includes("deposito") &&
      !group.description.toLowerCase().includes("traspaso") 
  );
}
