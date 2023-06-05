import { Logger } from '@nestjs/common';

export function isInCurrentMonthYear(date: Date): boolean {
  const currentDate = new Date();

  const check =
    currentDate.getFullYear() === date.getFullYear() &&
    currentDate.getMonth() === date.getMonth();

  return check;
}
