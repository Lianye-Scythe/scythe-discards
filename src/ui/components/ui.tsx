// Locally owned shadcn/ui-style primitives, adapted to Chrome's control vocabulary.
// Interaction primitives: Radix UI. Styling and layout: this project's styles.css.
import type { ComponentProps, ReactNode } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as RadioPrimitive from '@radix-ui/react-radio-group';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cva } from 'class-variance-authority';
import { Check, ChevronDown, Circle } from 'lucide-react';
import { cn } from '../lib/utils.ts';

const buttonVariants = cva('button', {
  variants: {
    variant: {
      primary: 'button-primary',
      outline: 'button-outline',
      text: 'button-text',
      icon: 'button-icon',
    },
  },
  defaultVariants: { variant: 'outline' },
});

export function Button({ className, variant, type = 'button', ...props }: ComponentProps<'button'> & {
  variant?: 'primary' | 'outline' | 'text' | 'icon';
}) {
  return <button type={type} className={cn(buttonVariants({ variant }), className)} {...props} />;
}

export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return <SwitchPrimitive.Root className={cn('switch', className)} {...props}>
    <SwitchPrimitive.Thumb className="switch-thumb" />
  </SwitchPrimitive.Root>;
}

export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return <CheckboxPrimitive.Root className={cn('checkbox', className)} {...props}>
    <CheckboxPrimitive.Indicator><Check size={14} strokeWidth={2.6} /></CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>;
}

export function RadioGroup(props: ComponentProps<typeof RadioPrimitive.Root>) {
  return <RadioPrimitive.Root {...props} />;
}

export function RadioItem({ className, ...props }: ComponentProps<typeof RadioPrimitive.Item>) {
  return <RadioPrimitive.Item className={cn('radio', className)} {...props}>
    <RadioPrimitive.Indicator className="radio-indicator"><Circle size={10} fill="currentColor" strokeWidth={0} /></RadioPrimitive.Indicator>
  </RadioPrimitive.Item>;
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn('input', className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return <span className={cn('select-wrap', className)}>
    <select className="select" {...props}>{children}</select>
    <ChevronDown size={16} aria-hidden="true" />
  </span>;
}

export function SettingRow({ title, description, children, className }: {
  title: ReactNode; description?: ReactNode; children?: ReactNode; className?: string;
}) {
  return <div className={cn('setting-row', className)}>
    <div className="setting-copy"><div className="setting-title">{title}</div>
      {description && <div className="description">{description}</div>}</div>
    {children && <div className="setting-control">{children}</div>}
  </div>;
}
