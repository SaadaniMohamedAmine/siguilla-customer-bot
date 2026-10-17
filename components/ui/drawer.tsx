"use client";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Icon } from "./icon";
import { CloseIcon } from "@/lib/icons";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;

export function DrawerContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  const t = useTranslations("Common");
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="overlay-anim anim-keep fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        className={cn(
          "drawer-anim anim-keep fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col border-l border-border bg-surface-raised p-6 shadow-[var(--shadow-lift)] duration-250 ease-[var(--ease-lux)] data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 text-text-muted hover:text-text">
          <Icon icon={CloseIcon} size={18} label={t("close")} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("font-serif text-h3 text-text", className)} {...props} />;
}
