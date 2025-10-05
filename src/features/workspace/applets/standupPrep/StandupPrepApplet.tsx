import { ChangeEvent, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import { Check, Clipboard, Loader } from "lucide-react";

const SECTION_ORDER = ["yesterday", "today", "blockers"] as const;

type SectionKey = (typeof SECTION_ORDER)[number];

type SectionConfig = {
  key: SectionKey;
  label: string;
  placeholder: string;
};

const SECTIONS: SectionConfig[] = [
  {
    key: "yesterday",
    label: "Since yesterday",
    placeholder: "Shipments, experiments, wins…",
  },
  {
    key: "today",
    label: "Today",
    placeholder: "Top priorities or problems to unblock",
  },
  {
    key: "blockers",
    label: "Blockers",
    placeholder: "Who or what is slowing things down?",
  },
];

const formatClipboardPayload = (fields: Record<SectionKey, string>) =>
  SECTION_ORDER.map((key) => {
    const title = SECTIONS.find((section) => section.key === key)?.label ?? key;
    const content = fields[key]?.trim();
    return content ? `${title}:\n${content}` : `${title}:\n• …`;
  }).join("\n\n");

export function StandupPrepApplet() {
  const [fields, setFields] = useState<Record<SectionKey, string>>({
    yesterday: "",
    today: "",
    blockers: "",
  });
  const [copyState, setCopyState] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const resetTimeoutRef = useRef<number | null>(null);

  const totalCharacters =
    fields.yesterday.trim().length +
    fields.today.trim().length +
    fields.blockers.trim().length;

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const scheduleReset = () => {
    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current);
    }
    resetTimeoutRef.current = window.setTimeout(() => {
      setCopyState("idle");
      resetTimeoutRef.current = null;
    }, 2_400);
  };

  const handleChange =
    (key: SectionKey) => (event: ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.target.value;
      setFields((previous) => ({ ...previous, [key]: value }));
    };

  const handleClear = () => {
    setFields({ yesterday: "", today: "", blockers: "" });
    setCopyState("idle");
    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  };

  const attemptClipboardWrite = async (payload: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(payload);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = payload;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  };

  const handleCopy = async () => {
    const payload = formatClipboardPayload(fields);

    try {
      setCopyState("pending");
      await attemptClipboardWrite(payload);
      setCopyState("success");
    } catch (error) {
      console.error("Failed to copy standup notes", error);
      setCopyState("error");
    } finally {
      scheduleReset();
    }
  };

  const helperText =
    copyState === "success"
      ? "Copied—drop it into Slack or your meeting doc."
      : copyState === "error"
        ? "Could not access the clipboard. Copy manually instead."
        : "Draft quick standup bullets and copy when you are ready.";

  const copyIcon =
    copyState === "success" ? (
      <Check className="size-4" aria-hidden />
    ) : copyState === "pending" ? (
      <Loader className="size-4 animate-spin" aria-hidden />
    ) : (
      <Clipboard className="size-4" aria-hidden />
    );

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle>Standup Prep</CardTitle>
        <CardDescription>
          Capture crisp updates, then ship them to your team with one click.
        </CardDescription>
        <Badge variant="outline">{totalCharacters} characters</Badge>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="grid grow grid-rows-3 gap-4">
          {SECTIONS.map((section) => (
            <label key={section.key} className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{section.label}</span>
                <span className="text-muted-foreground text-xs">
                  {fields[section.key].trim().length} chars
                </span>
              </div>
              <Textarea
                placeholder={section.placeholder}
                value={fields[section.key]}
                onChange={handleChange(section.key)}
                rows={4}
              />
            </label>
          ))}
        </div>
      </CardContent>

      <Separator />

      <CardFooter className="flex flex-col gap-3 pt-4">
        <div className="flex w-full gap-2">
          <Button
            type="button"
            onClick={handleCopy}
            className="flex-1"
            disabled={copyState === "pending"}
          >
            {copyIcon}
            {copyState === "success"
              ? "Copied"
              : copyState === "pending"
                ? "Copying"
                : "Copy to clipboard"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            disabled={!fields.yesterday && !fields.today && !fields.blockers}
          >
            Clear
          </Button>
        </div>
        <p className="text-muted-foreground text-xs" aria-live="polite">
          {helperText}
        </p>
      </CardFooter>
    </Card>
  );
}
