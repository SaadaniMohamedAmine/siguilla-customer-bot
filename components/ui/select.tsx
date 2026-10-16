"use client";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Icon } from "./icon";
import { ChevronDownIcon, CheckIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "anim-keep group flex h-10 w-full items-center justify-between rounded-sm border border-border bg-surface px-3 text-body text-text transition-[border-color,box-shadow] duration-200 hover:border-text-muted focus-visible:border-focus focus-visible:shadow-[0_0_0_3px_var(--tint)] focus-visible:outline-none data-[state=open]:border-accent disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <Icon icon={ChevronDownIcon} size={16} className="anim-keep text-text-muted transition-transform duration-300 group-data-[state=open]:rotate-180" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          "menu-anim anim-keep z-50 overflow-hidden rounded-md border border-border bg-surface-raised shadow-[var(--shadow-lift)]",
          className,
        )}
        position="popper"
        sideOffset={4}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1.5">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "anim-keep relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-3 pr-9 text-body text-text outline-none transition-colors duration-150 data-[highlighted]:bg-tint data-[state=checked]:bg-tint",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-3">
        <Icon icon={CheckIcon} size={14} className="text-link" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
