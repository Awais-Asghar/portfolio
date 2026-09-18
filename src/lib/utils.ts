import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCount(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}
