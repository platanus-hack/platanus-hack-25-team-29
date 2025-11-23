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
    let desc = mov.description?.trim().split(" ")[0] || ["Sin", "descripción"];
    const descArr = mov.description?.trim().split(" ") || ["Sin", "descripción"];
    let filteredArr = descArr;
    if (/\d/.test(descArr[0])) {
      filteredArr = descArr.slice(1);
    }
    desc = filteredArr.slice(0, 2).join(" ") || "Sin descripción";
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
