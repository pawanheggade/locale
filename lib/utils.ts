

// A simple utility for conditionally joining class names.
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export const inputBaseStyles = "rounded-md border border-gray-300 bg-white text-sm text-black ring-offset-white placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-600";

export const overlayInputBaseStyles = "bg-transparent border-0 rounded-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-b-2 focus-visible:border-red-500 h-10 px-1";