export interface Sticker {
  id: string; // Unique ID, usually the code
  code: string; // e.g., BRA01
  number: number | string;
  team: string; // e.g., "México", "África do Sul"
  teamCode: string; // e.g., "MEX"
  group: string; // e.g., "A"
  category: string; // e.g., "Seleção", "Página Inicial"
  name: string; // e.g., "Lionel Messi" or empty
  isSpecial: boolean;
  quantityOwned: number; // 0 = missing, 1 = collected, >1 = repeated
  pasted: boolean;
  notes: string;
  image?: string;
  edition?: 'normal' | 'lilac' | 'bronze' | 'silver' | 'gold' | 'shiny';
}
export interface Expense {
  id: string;
  date: string;
  description: string;
  amountSpent: number;
  packsBought: number;
  notes?: string;
}
