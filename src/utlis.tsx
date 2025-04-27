import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...classes: any[]) {
    return twMerge(clsx(...classes));
}