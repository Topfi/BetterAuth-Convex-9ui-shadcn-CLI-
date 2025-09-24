import { toastManager } from "@/hooks/use-toast";

type ToastKind = "success" | "error" | "info" | "warning" | "loading";

type ToastAddOptions = Parameters<typeof toastManager.add>[0];
type ToastUpdateOptions = Parameters<typeof toastManager.update>[1];
type ToastPromiseOptions = Parameters<typeof toastManager.promise>[1];

type ToastContent = string | Partial<ToastAddOptions> | undefined;

type PromiseContent<Value> = ToastContent | ((value: Value) => ToastContent);

type PromiseConfig<Value> = {
  loading: ToastContent;
  success: PromiseContent<Value>;
  error: PromiseContent<unknown>;
};

const DEFAULT_TITLES: Record<ToastKind, string> = {
  success: "Success",
  error: "Something went wrong",
  warning: "Please review",
  info: "Heads up",
  loading: "Working...",
};

function isToastKind(value: string): value is ToastKind {
  return ["success", "error", "warning", "info", "loading"].includes(value);
}

function resolveDefaultTitle(
  type: string | undefined,
  fallback: ToastKind,
): string {
  if (type && isToastKind(type)) {
    return DEFAULT_TITLES[type];
  }
  return DEFAULT_TITLES[fallback];
}

function normalizeToastContent(
  content: ToastContent,
  fallbackType: ToastKind,
): ToastAddOptions {
  if (typeof content === "string") {
    return {
      type: fallbackType,
      title: content,
    } satisfies ToastAddOptions;
  }

  const base: Partial<ToastAddOptions> = content ?? {};
  const resolvedType = base.type ?? fallbackType;

  return {
    ...base,
    type: resolvedType,
    title: base.title ?? resolveDefaultTitle(resolvedType, fallbackType),
  } satisfies ToastAddOptions;
}

function normalizePromiseContent<Value>(
  content: PromiseContent<Value>,
  fallbackType: ToastKind,
): PromiseContent<Value> {
  if (typeof content === "function") {
    return (value: Value) =>
      normalizeToastContent(content(value), fallbackType);
  }
  return normalizeToastContent(content, fallbackType);
}

export const toast = {
  add(options: ToastAddOptions) {
    return toastManager.add(options);
  },
  update(toastId: string, options: ToastUpdateOptions) {
    toastManager.update(toastId, options);
  },
  close(toastId: string) {
    toastManager.close(toastId);
  },
  success(content: ToastContent) {
    return toastManager.add(normalizeToastContent(content, "success"));
  },
  error(content: ToastContent) {
    return toastManager.add(normalizeToastContent(content, "error"));
  },
  info(content: ToastContent) {
    return toastManager.add(normalizeToastContent(content, "info"));
  },
  warning(content: ToastContent) {
    return toastManager.add(normalizeToastContent(content, "warning"));
  },
  loading(content: ToastContent) {
    return toastManager.add(normalizeToastContent(content, "loading"));
  },
  promise<Value>(
    promise: Promise<Value>,
    options: PromiseConfig<Value>,
  ): Promise<Value> {
    const normalized: ToastPromiseOptions = {
      loading: normalizeToastContent(options.loading, "loading"),
      success: normalizePromiseContent(options.success, "success"),
      error: normalizePromiseContent(options.error, "error"),
    } satisfies ToastPromiseOptions;

    return toastManager.promise(promise, normalized);
  },
};

export type {
  PromiseConfig as ToastPromiseConfig,
  ToastAddOptions,
  ToastUpdateOptions,
};
