"use client";
import { toast as toastify, type ToastOptions } from "react-toastify";
import { Icon } from "./icon";
import { CheckCircleIcon, ErrorIcon, WarningIcon, InfoIcon } from "@/lib/icons";

const ICONS = { success: CheckCircleIcon, error: ErrorIcon, warning: WarningIcon, info: InfoIcon } as const;
const TONE = { success: "text-success", error: "text-error", warning: "text-warning", info: "text-link" } as const;
const BORDER = { success: "border-l-success", error: "border-l-error", warning: "border-l-warning", info: "border-l-link" } as const;

type ToastKind = keyof typeof ICONS;

function render(kind: ToastKind, message: string) {
  return (
    <div className="flex items-start gap-2">
      <Icon icon={ICONS[kind]} size={18} className={`mt-0.5 shrink-0 ${TONE[kind]}`} />
      <span className="text-body text-text">{message}</span>
    </div>
  );
}

const base: ToastOptions = {
  className: "!rounded-xl border-l-2",
  hideProgressBar: false,
};

export const toast = {
  success: (message: string, opts?: ToastOptions) =>
    toastify(render("success", message), { ...base, className: `${base.className} ${BORDER.success}`, ...opts }),
  error: (message: string, opts?: ToastOptions) =>
    toastify(render("error", message), { ...base, className: `${base.className} ${BORDER.error}`, ...opts }),
  warning: (message: string, opts?: ToastOptions) =>
    toastify(render("warning", message), { ...base, className: `${base.className} ${BORDER.warning}`, ...opts }),
  info: (message: string, opts?: ToastOptions) =>
    toastify(render("info", message), { ...base, className: `${base.className} ${BORDER.info}`, ...opts }),
};
