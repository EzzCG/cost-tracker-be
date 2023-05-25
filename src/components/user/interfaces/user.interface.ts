import { Alert } from 'src/components/alert/schemas/alert.schema.';
import { Category } from 'src/components/category/schemas/category.schema';
import { Expense } from 'src/components/expense/schemas/expense.schema';
import { MonthlyReport } from 'src/components/report/schemas/report.schema';

export interface User {
  id?: string;
  name: string;
  surname: string;
  email: string;
  password: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
