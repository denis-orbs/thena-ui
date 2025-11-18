import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge classes with tailwind-merge with clsx full feature */
export default function cn(...inputs) {
  return twMerge(clsx(inputs))
}
