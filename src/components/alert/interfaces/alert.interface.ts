export interface Alert {
  id?: string;
  name: string;
  condition: string;
  amount: number;
  frequency: number;
  message: string;
  category: string;
  userId: string;
}
