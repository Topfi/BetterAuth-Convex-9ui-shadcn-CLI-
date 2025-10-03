import { useLayoutEffect, useMemo, useRef } from "react";
import { useMutation, useQuery } from "convex/react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";
import { api } from "@/convex/api";
import {
  defaultLocalizationSettings,
  type LocalizationDateFormat,
  type LocalizationSettings,
  type LocalizationTimeFormat,
  type LocalizationTimeZone,
} from "@/shared/settings/localization";
import { CircleIcon } from "lucide-react";

type DateFormatOption = {
  value: LocalizationDateFormat;
  label: string;
  preview: string;
  description: string;
};

type TimeFormatOption = {
  value: LocalizationTimeFormat;
  label: string;
  preview: string;
  description: string;
};

const DATE_FORMAT_OPTIONS: DateFormatOption[] = [
  {
    value: "system",
    label: "System default",
    preview: "Wed, Jan 3, 2025",
    description: "Match the operating system locale and preferences.",
  },
  {
    value: "dayMonthYear",
    label: "31.12.2025",
    preview: "31.12.2025",
    description: "European-style day-first date format.",
  },
  {
    value: "monthDayYear",
    label: "Dec 31, 2025",
    preview: "Dec 31, 2025",
    description: "Month-first date with abbreviated month names.",
  },
  {
    value: "iso8601",
    label: "ISO 8601",
    preview: "2025-12-31",
    description: "Canonical ISO date component for logs and exports.",
  },
];

const TIME_FORMAT_OPTIONS: TimeFormatOption[] = [
  {
    value: "system",
    label: "System default",
    preview: "2:05:09 PM",
    description: "Match the operating system locale preferences.",
  },
  {
    value: "twelveHour",
    label: "12-hour",
    preview: "02:05:09 PM",
    description: "12-hour clock with AM/PM indicator.",
  },
  {
    value: "twentyFourHour",
    label: "24-hour",
    preview: "14:05:09",
    description: "24-hour clock with leading zero padding.",
  },
];

export default function LocalizationTab() {
  const preferences = useQuery(api.settings_localization.getPreferences, {});
  const updatePreferences = useMutation(
    api.settings_localization.updatePreferences,
  );
  const rootRef = useRef<HTMLDivElement | null>(null);

  const updatePreferencesOptimistic = useMemo(() => {
    // useMemo prevents recomputing the optimistic updater on every render.
    return updatePreferences.withOptimisticUpdate((localStore, args) => {
      const previous =
        localStore.getQuery(api.settings_localization.getPreferences, {}) ??
        defaultLocalizationSettings;
      const merged: LocalizationSettings = {
        ...previous,
        ...args,
      };
      localStore.setQuery(api.settings_localization.getPreferences, {}, merged);
    });
  }, [updatePreferences]);

  // useMemo caches the grouped zones so we don't recompute the full list on every render.
  const timeZones = useMemo(() => getGroupedTimeZones(), []);

  const resolved = preferences ?? defaultLocalizationSettings;
  const isLoading = preferences === undefined;

  // Keep only the latest mounted LocalizationTab active in the accessibility tree.
  // This mirrors ThemeTab's pattern to avoid duplicate interactive elements when tests
  // (or StrictMode/dev) mount multiple instances.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (isLoading) {
      if (activeLocalizationTabRoot && activeLocalizationTabRoot !== root) {
        // Another instance is already active; keep this one inactive.
        markLocalizationTabInactive(root);
        return;
      }
      // No other active instance; keep this one active so skeleton is discoverable.
      markLocalizationTabActive(root);
      activeLocalizationTabRoot = root;
      return;
    }

    if (activeLocalizationTabRoot && activeLocalizationTabRoot !== root) {
      markLocalizationTabInactive(activeLocalizationTabRoot);
    }

    markLocalizationTabActive(root);
    activeLocalizationTabRoot = root;

    return () => {
      if (activeLocalizationTabRoot === root) {
        activeLocalizationTabRoot = null;
      }
    };
  }, [isLoading]);

  const persistPreferences = (next: LocalizationSettings) => {
    console.log(
      "persistPreferences",
      typeof updatePreferencesOptimistic,
      updatePreferencesOptimistic,
      updatePreferencesOptimistic.mock?.calls.length,
    );
    void updatePreferencesOptimistic(next).catch((error) => {
      console.error("[LocalizationTab] Failed to update preferences", error);
      toast.error("Could not save your localization settings. Try again.");
    });
    console.log(
      "persistPreferences after call",
      updatePreferencesOptimistic.mock?.calls.length,
    );
  };

  const handleTimeZoneChange = (next: LocalizationTimeZone) => {
    if (next === resolved.timeZone) {
      return;
    }

    persistPreferences({
      ...resolved,
      timeZone: next,
    });
  };

  const handleDateFormatChange = (next: LocalizationDateFormat) => {
    if (next === resolved.dateFormat) {
      return;
    }

    console.log("handleDateFormatChange", next);

    persistPreferences({
      ...resolved,
      dateFormat: next,
    });
  };

  const handleTimeFormatChange = (next: LocalizationTimeFormat) => {
    if (next === resolved.timeFormat) {
      return;
    }

    console.log("handleTimeFormatChange", next);

    persistPreferences({
      ...resolved,
      timeFormat: next,
    });
  };

  const handleShowSecondsChange = (next: boolean) => {
    if (next === resolved.showSeconds) {
      return;
    }

    persistPreferences({
      ...resolved,
      showSeconds: next,
    });
  };

  return (
    <div ref={rootRef} className="space-y-6">
      {isLoading ? (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="space-y-6"
        >
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : null}
      {!isLoading && (
        <>
          <section className="space-y-2">
            <h3 className="text-base font-semibold leading-tight">
              Localization
            </h3>
            <p className="text-sm text-muted-foreground">
              Control how Hominis displays time in the workspace toolbar.
              Changes apply instantly on this device and sync to other clients
              in the background.
            </p>
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Time zone</CardTitle>
              <CardDescription>
                Override the detected system time zone for toolbar timestamps.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="localization-time-zone">Time zone</Label>
                <Select
                  value={resolved.timeZone}
                  onValueChange={(value) =>
                    handleTimeZoneChange(value as LocalizationTimeZone)
                  }
                >
                  <SelectTrigger id="localization-time-zone" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="system">System default</SelectItem>
                    {timeZones.map((group) => (
                      <SelectGroup key={group.region}>
                        <SelectLabel>{group.region}</SelectLabel>
                        {group.zones.map((zone) => (
                          <SelectItem key={zone} value={zone}>
                            {zone}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Date format
              </CardTitle>
              <CardDescription>
                Choose how dates appear across Hominis, including the toolbar
                clock.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                role="radiogroup"
                aria-label="Date format"
                className="space-y-3"
              >
                {DATE_FORMAT_OPTIONS.map((option) => {
                  const id = `localization-date-format-${option.value}`;
                  const inputId = `${id}-input`;
                  const labelId = `${id}-label`;
                  const previewId = `${id}-preview`;
                  const descriptionId = `${id}-description`;
                  return (
                    <div key={option.value} className="contents">
                      <Label
                        htmlFor={inputId}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 text-left text-card-foreground shadow-sm transition-colors duration-150 hover:border-ring/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring/50 has-[input:focus-visible]:ring-offset-2 has-[input:focus-visible]:ring-offset-background has-[input:checked]:border-primary has-[input:checked]:bg-primary/5"
                      >
                        <input
                          id={inputId}
                          className="peer sr-only"
                          type="radio"
                          name="localization-date-format"
                          value={option.value}
                          checked={resolved.dateFormat === option.value}
                          onChange={() => handleDateFormatChange(option.value)}
                          onClick={() => {
                            if (resolved.dateFormat === option.value) {
                              handleDateFormatChange(option.value);
                            }
                          }}
                          aria-labelledby={labelId}
                          aria-describedby={`${previewId} ${descriptionId}`}
                        />
                        <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border border-input bg-background transition-colors duration-150 peer-checked:border-primary">
                          <CircleIcon className="size-2 fill-primary text-primary opacity-0 transition-opacity duration-150 peer-checked:opacity-100" />
                        </span>
                        <div className="space-y-1">
                          <span id={labelId} className="text-sm font-medium">
                            {option.label}
                          </span>
                          <p
                            id={previewId}
                            className="text-xs text-muted-foreground"
                          >
                            {option.preview}
                          </p>
                          <p
                            id={descriptionId}
                            className="text-sm text-muted-foreground"
                          >
                            {option.description}
                          </p>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Time format
              </CardTitle>
              <CardDescription>
                Pick how the live toolbar clock should render the current time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                role="radiogroup"
                aria-label="Time format"
                className="space-y-3"
              >
                {TIME_FORMAT_OPTIONS.map((option) => {
                  const id = `localization-time-format-${option.value}`;
                  const inputId = `${id}-input`;
                  const labelId = `${id}-label`;
                  const previewId = `${id}-preview`;
                  const descriptionId = `${id}-description`;
                  return (
                    <div key={option.value} className="contents">
                      <Label
                        htmlFor={inputId}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 text-left text-card-foreground shadow-sm transition-colors duration-150 hover:border-ring/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring/50 has-[input:focus-visible]:ring-offset-2 has-[input:focus-visible]:ring-offset-background has-[input:checked]:border-primary has-[input:checked]:bg-primary/5"
                      >
                        <input
                          id={inputId}
                          className="peer sr-only"
                          type="radio"
                          name="localization-time-format"
                          value={option.value}
                          checked={resolved.timeFormat === option.value}
                          onChange={() => handleTimeFormatChange(option.value)}
                          onClick={() => {
                            if (resolved.timeFormat === option.value) {
                              handleTimeFormatChange(option.value);
                            }
                          }}
                          aria-labelledby={labelId}
                          aria-describedby={`${previewId} ${descriptionId}`}
                        />
                        <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border border-input bg-background transition-colors duration-150 peer-checked:border-primary">
                          <CircleIcon className="size-2 fill-primary text-primary opacity-0 transition-opacity duration-150 peer-checked:opacity-100" />
                        </span>
                        <div className="space-y-1">
                          <span id={labelId} className="text-sm font-medium">
                            {option.label}
                          </span>
                          <p
                            id={previewId}
                            className="text-xs text-muted-foreground"
                          >
                            {option.preview}
                          </p>
                          <p
                            id={descriptionId}
                            className="text-sm text-muted-foreground"
                          >
                            {option.description}
                          </p>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-start justify-between rounded-lg border bg-card text-card-foreground p-4 shadow-sm">
                <div className="space-y-1">
                  <Label
                    id="localization-show-seconds-label"
                    htmlFor="localization-show-seconds"
                    className="text-sm font-medium"
                  >
                    Show seconds
                  </Label>
                  <p
                    id="localization-show-seconds-description"
                    className="text-sm text-muted-foreground"
                  >
                    Toggle whether the toolbar clock displays seconds.
                  </p>
                </div>
                <Switch
                  id="localization-show-seconds"
                  checked={resolved.showSeconds}
                  onCheckedChange={(checked) =>
                    handleShowSecondsChange(checked === true)
                  }
                  aria-labelledby="localization-show-seconds-label"
                  aria-describedby="localization-show-seconds-description"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Language</CardTitle>
              <CardDescription>
                Language support is coming soon. For now Hominis is available in
                English only.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="localization-language">Language</Label>
              <Select value={resolved.language} disabled>
                <SelectTrigger id="localization-language" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="item-aligned">
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function getGroupedTimeZones() {
  const supported =
    typeof Intl.supportedValuesOf === "function"
      ? (Intl.supportedValuesOf("timeZone") as string[])
      : ["UTC", "Europe/London", "America/New_York", "Asia/Tokyo"];

  const grouped = new Map<string, string[]>();
  for (const zone of supported) {
    const [region = "Other"] = zone.split("/");
    const list = grouped.get(region) ?? [];
    list.push(zone);
    grouped.set(region, list);
  }

  return Array.from(grouped.entries())
    .map(([region, zones]) => ({
      region,
      zones: zones.sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.region.localeCompare(b.region));
}

// Accessibility activation management (mirrors ThemeTab)
let activeLocalizationTabRoot: HTMLDivElement | null = null;
function markLocalizationTabInactive(root: HTMLDivElement) {
  root.setAttribute("aria-hidden", "true");
  root.setAttribute("data-localization-tab-inactive", "true");
  root.setAttribute("inert", "");
}
function markLocalizationTabActive(root: HTMLDivElement) {
  root.removeAttribute("aria-hidden");
  root.removeAttribute("data-localization-tab-inactive");
  root.removeAttribute("inert");
}
