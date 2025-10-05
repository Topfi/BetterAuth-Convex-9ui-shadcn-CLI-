import { useQuery } from "convex/react";
import { useState } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import GeneralTab from "@/features/settings/general/GeneralTab";
import ThemeTab from "@/features/settings/theme/ThemeTab";
import ProfileTab from "@/features/settings/profile/ProfileTab";
import PrivacyTab from "@/features/settings/privacy/PrivacyTab";
import { api } from "@/convex/api";

const SETTINGS_TABS = [
  { value: "general", label: "General" },
  { value: "theme", label: "Theme" },
  { value: "profile", label: "Profile" },
  { value: "privacy", label: "Privacy" },
] as const;

export function SettingsApplet() {
  const currentUser = useQuery(api.auth.getCurrentUser);
  const identity = useQuery(api.identity.getMe, {});
  const [activeTab, setActiveTab] =
    useState<(typeof SETTINGS_TABS)[number]["value"]>("general");

  const isLoading = currentUser === undefined || identity === undefined;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4">
        <Card className="border shadow-sm">
          {/* Header with title and description */}
          <CardHeader className="px-6 pt-6">
            <h2 className="text-lg font-semibold leading-tight">Settings</h2>
            <p className="text-sm text-muted-foreground">
              Personalize Hominis and keep your account details up to date.
            </p>
          </CardHeader>

          {/* Sidebar + Content */}
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-[220px_minmax(0,1fr)] gap-8">
              {/* Sidebar with vertical buttons */}
              <div className="flex flex-col gap-1 rounded-xl border border-border/60 bg-muted/20 p-1">
                {SETTINGS_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`text-left rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab.value
                        ? "bg-background shadow-sm"
                        : "hover:bg-muted"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="flex-1 min-w-0 overflow-hidden">
                {activeTab === "general" && (
                  <GeneralTab
                    currentUser={currentUser}
                    identity={identity}
                    isLoading={isLoading}
                  />
                )}

                {activeTab === "theme" && <ThemeTab />}

                {activeTab === "profile" && (
                  <>
                    {isLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-10 w-1/3" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : (
                      <ProfileTab
                        currentUser={currentUser}
                        identity={identity}
                      />
                    )}
                  </>
                )}

                {activeTab === "privacy" && (
                  <div className="space-y-6">
                    <section className="space-y-2">
                      <h3 className="text-base font-semibold leading-tight">
                        Privacy
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Export your data or close your account in line with our
                        privacy commitments.
                      </p>
                    </section>
                    {isLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-10 w-1/3" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-28 w-full" />
                      </div>
                    ) : (
                      <PrivacyTab identity={identity} />
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
