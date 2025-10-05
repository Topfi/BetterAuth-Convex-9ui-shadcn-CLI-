import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "convex/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import ProfileTab from "@/features/settings/profile/ProfileTab";
import SecurityTab from "@/features/settings/security/SecurityTab";
import PrivacyTab from "@/features/settings/privacy/PrivacyTab";
import { api } from "@/convex/api";

const SETTINGS_TABS = [
  { value: "profile", label: "Profile" },
  { value: "security", label: "Security" },
  { value: "privacy", label: "Privacy" },
] as const;

export default function Settings() {
  const navigate = useNavigate();
  const currentUser = useQuery(api.auth.getCurrentUser);
  const identity = useQuery(api.identity.getMe, {});

  const isLoading = currentUser === undefined || identity === undefined;

  const handleBack = () => {
    navigate("/workspace");
  };

  return (
    <div className="space-y-6">
      <Card className="border shadow-sm">
        <CardHeader className="p-6 pb-4">
          <Button
            type="button"
            variant="ghost"
            className="gap-2 w-fit"
            onClick={handleBack}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to workspace
          </Button>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-6">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="w-full sm:w-auto justify-start">
              {SETTINGS_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="profile" className="space-y-2 pt-6">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-1/3" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <ProfileTab currentUser={currentUser} identity={identity} />
              )}
            </TabsContent>
            <TabsContent value="security" className="space-y-6 pt-6">
              <section className="space-y-2">
                <h2 className="text-lg font-semibold leading-tight">
                  Security
                </h2>
                <p className="text-sm text-muted-foreground">
                  Review passphrase policies and upcoming multi-factor
                  authentication controls.
                </p>
              </section>
              <SecurityTab
                accountEmail={currentUser?.email ?? undefined}
                accountName={
                  identity?.usernameDisplay ?? currentUser?.name ?? undefined
                }
              />
            </TabsContent>
            <TabsContent value="privacy" className="space-y-6 pt-6">
              <section className="space-y-2">
                <h2 className="text-lg font-semibold leading-tight">Privacy</h2>
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
