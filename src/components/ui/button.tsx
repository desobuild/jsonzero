import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-surface-elevated text-text-secondary border border-border-subtle hover:bg-surface-overlay hover:text-text-primary',
        accent: 'bg-accent text-accent-foreground hover:opacity-90',
        ghost:
          'text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
        outline:
          'border border-border text-text-secondary hover:bg-surface-elevated hover:text-text-primary',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-9 sm:h-9 px-3.5 text-sm',
        toolbar: 'h-10 sm:h-9 px-3 sm:px-3.5 text-sm',
        lg: 'h-10 px-4 text-sm',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
