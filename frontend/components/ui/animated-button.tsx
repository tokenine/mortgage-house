import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { animatedButtonVariants } from "@/lib/animations"

const AnimatedButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof animatedButtonVariants> & {
      asChild?: boolean
    }
>(({ className, variant, size, asChild = false, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(animatedButtonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    >
      {children}
    </Comp>
  )
})
AnimatedButton.displayName = "AnimatedButton"

export { AnimatedButton, animatedButtonVariants }