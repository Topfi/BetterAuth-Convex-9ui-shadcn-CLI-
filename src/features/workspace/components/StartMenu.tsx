import { useCallback, useMemo, useState } from "react";
import { Bot } from "lucide-react";
import { useAction, useMutation } from "convex/react";

import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { api } from "@/convex/api";

import { GENERATED_PREFIX, getWorkspaceApplet } from "../applets/registry";
import { buildNewAppletNode, type NewAppletNode } from "../createAppletNode";
import type { WorkspaceApplet } from "../applets/types";

interface StartMenuProps {
  sortedApplets: WorkspaceApplet[];
  openApplets: ReadonlySet<string>;
  onSelectApplet: (appletId: string) => void;
  onClose: () => void;
  addNode: (
    node: NewAppletNode["node"],
    persistence: NewAppletNode["persistence"],
  ) => void;
  existingCount: number;
  nextZIndex: number;
  onRemoveNode: (id: string) => void;
}

export function StartMenu({
  sortedApplets,
  openApplets,
  onSelectApplet,
  onClose,
  addNode,
  existingCount,
  nextZIndex,
  onRemoveNode,
}: StartMenuProps) {
  const [query, setQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return sortedApplets;
    }
    return sortedApplets.filter((applet) =>
      applet.name.toLowerCase().includes(trimmed),
    );
  }, [query, sortedApplets]);

  const requestGen = useMutation(api.applets_generated.request);
  const startBuild = useAction(api.applets_generated.startBuild);

  const handleLaunch = useCallback(
    (applet: WorkspaceApplet) => {
      if (!applet.allowMultipleInstances && openApplets.has(applet.id)) {
        toast.warning(`"${applet.name}" is already open in this workspace.`);
        return;
      }
      onSelectApplet(applet.id);
    },
    [onSelectApplet, openApplets],
  );

  const handleGenerate = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    if (isGenerating) {
      return;
    }

    try {
      setIsGenerating(true);
      const { appletId, name } = await requestGen({ query: trimmed });
      const generatedId = `${GENERATED_PREFIX}${appletId}`;
      const resolvedApplet =
        getWorkspaceApplet(generatedId) ??
        ({
          id: generatedId,
          name: name ?? trimmed,
          icon: Bot,
          Component: () => null,
          minSize: { width: 360, height: 260 },
        } satisfies WorkspaceApplet);

      const { node, persistence } = buildNewAppletNode(
        resolvedApplet,
        existingCount,
        nextZIndex,
        onRemoveNode,
      );

      addNode(node, persistence);
      onClose();
      setQuery("");

      void toast.promise(startBuild({ appletId, prompt: trimmed }), {
        loading: {
          title: "Generating applet",
          description: `Synthesizing “${trimmed}”…`,
        },
        success: {
          title: "Generation started",
          description: "We’ll stream results into the node once ready.",
        },
        error: (error) => ({
          title: "Generation failed to start",
          description:
            error instanceof Error
              ? error.message
              : "Unexpected error while starting the generator.",
        }),
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to start generation. Please try again.";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }, [
    addNode,
    existingCount,
    isGenerating,
    nextZIndex,
    onClose,
    onRemoveNode,
    query,
    requestGen,
    startBuild,
  ]);

  return (
    <>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search applets…"
        autoFocus
      />
      <CommandList>
        <CommandEmpty>No applets found.</CommandEmpty>
        <div className="border-b px-3 pb-4 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Quick launch
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {sortedApplets.map((applet) => {
              const Icon = applet.icon;
              const isAlreadyOpen =
                !applet.allowMultipleInstances && openApplets.has(applet.id);
              return (
                <Button
                  key={applet.id}
                  type="button"
                  variant="outline"
                  className={cn(
                    "flex h-auto flex-col items-center gap-2 py-3",
                    isAlreadyOpen &&
                      "cursor-not-allowed opacity-60 hover:opacity-60 focus-visible:ring-0",
                  )}
                  aria-disabled={isAlreadyOpen}
                  onClick={() => {
                    if (isAlreadyOpen) {
                      toast.warning(
                        `"${applet.name}" is already open in this workspace.`,
                      );
                      return;
                    }
                    onSelectApplet(applet.id);
                  }}
                >
                  <Icon className="size-5" aria-hidden />
                  <span className="text-xs font-medium text-foreground sm:text-sm">
                    {applet.name}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
        <CommandGroup heading="All applets">
          {filtered.map((applet) => {
            const Icon = applet.icon;
            const isAlreadyOpen =
              !applet.allowMultipleInstances && openApplets.has(applet.id);
            return (
              <CommandItem
                key={applet.id}
                value={`${applet.name} ${applet.id}`}
                onSelect={() => handleLaunch(applet)}
                className={cn(
                  isAlreadyOpen &&
                    "cursor-not-allowed opacity-60 data-[selected=true]:opacity-60",
                )}
                aria-disabled={isAlreadyOpen}
              >
                <Icon className="size-4" aria-hidden />
                {applet.name}
                {isAlreadyOpen ? <CommandShortcut>Open</CommandShortcut> : null}
              </CommandItem>
            );
          })}
          {filtered.length === 0 && query.trim().length > 0 && (
            <CommandItem
              value={`generate:${query}`}
              onSelect={handleGenerate}
              disabled={isGenerating}
            >
              <Bot className="size-4" aria-hidden />
              Generate “{query}”
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </>
  );
}
