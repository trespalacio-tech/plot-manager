import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-bone-50 dark:focus-visible:ring-offset-stone-900 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primario: verde brand. Funciona igual en ambos esquemas.
        default:
          "bg-brand-600 text-bone-50 shadow-soft hover:bg-brand-700 active:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400 dark:text-stone-900",
        destructive:
          "bg-earth-600 text-bone-50 shadow-soft hover:bg-earth-700 active:bg-earth-700 dark:bg-earth-500 dark:hover:bg-earth-400 dark:text-stone-900",
        // Outline neutro y cálido: borde stone, fondo blanco hueso (claro);
        // borde stone-700, fondo stone-800 (oscuro).
        outline:
          "border border-stone-200 bg-white text-stone-800 shadow-soft hover:bg-bone-100 hover:border-stone-300 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700 dark:hover:border-stone-600",
        secondary:
          "bg-stone-100 text-stone-800 shadow-soft hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-100 dark:hover:bg-stone-600",
        ghost:
          "text-stone-700 hover:bg-bone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100",
        link:
          "text-brand-700 underline-offset-4 hover:underline dark:text-brand-300",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
