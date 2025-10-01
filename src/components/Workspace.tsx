import "@xyflow/react/dist/base.css";

import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  type Node,
  type NodeChange,
  type NodeMouseHandler,
  type OnNodeDrag,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import {
  useMutation,
  useQuery,
  useConvexAuth,
  useConvexConnectionState,
} from "convex/react";
import {
  Check,
  ChevronsUpDown,
  Grid3x3,
  LogOut,
  Plus,
  Settings as SettingsIcon,
  Trash2,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { api } from "../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toolbar, ToolbarButton, ToolbarGroup } from "@/components/ui/toolbar";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { AppletNode } from "@/features/workspace/components/AppletNode";
import {
  getWorkspaceApplet,
  settingsApplet,
  workspaceApplets,
} from "@/features/workspace/applets/registry";
import { buildNewAppletNode } from "@/features/workspace/createAppletNode";
import type { AppletNodeData } from "@/features/workspace/types";
import {
  workspaceNameSchema,
  type WorkspaceDefinition,
  type WorkspaceId,
} from "../../shared/workspace";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/providers/theme-context";

const DEFAULT_VIEWPORT = { x: 0, y: 0, zoom: 0.75 };

type ConnectionStatus = "connected" | "disconnected";

function useClient(): { status: ConnectionStatus } {
  const connectionState = useConvexConnectionState();
  const status: ConnectionStatus = connectionState.isWebSocketConnected
    ? "connected"
    : "disconnected";

  return useMemo(
    () => ({
      status,
    }),
    [status],
  );
}

function formatOfflineDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

type UserMenuProps = {
  currentUser: {
    email?: string | null;
    image?: string | null;
    name?: string | null;
  };
  membership: {
    usernameDisplay?: string | null;
  };
  onSignOut: () => void;
  onOpenSettings: () => void;
};

function UserMenu({
  currentUser,
  membership,
  onSignOut,
  onOpenSettings,
}: UserMenuProps) {
  const resolvedEmail = currentUser.email?.trim() || undefined;
  const resolvedName = currentUser.name?.trim() || undefined;
  const displayName =
    membership.usernameDisplay?.trim() ??
    resolvedName ??
    resolvedEmail ??
    "Account";
  const initialsSource =
    membership.usernameDisplay?.trim() ?? resolvedName ?? resolvedEmail ?? "?";
  const initials = initialsSource.slice(0, 1).toUpperCase();
  const emailLabel = resolvedEmail ?? "Email unavailable";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="flex items-center gap-3 rounded-lg px-2 py-1"
          aria-label="Open user menu"
        >
          <Avatar className="size-8 border" role="img" aria-label={displayName}>
            {currentUser.image ? (
              <AvatarImage src={currentUser.image} alt={displayName} />
            ) : (
              <AvatarFallback aria-hidden>{initials}</AvatarFallback>
            )}
          </Avatar>
          <div className="hidden text-left leading-tight sm:flex sm:flex-col">
            <span className="text-xs font-medium text-foreground">
              {displayName}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {emailLabel}
            </span>
          </div>
          <ChevronsUpDown className="size-3" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        <DropdownMenuItem
          onClick={(_event) => {
            onOpenSettings();
          }}
        >
          <SettingsIcon className="mr-2 size-4" aria-hidden />
          Profile Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(_event) => {
            onSignOut();
          }}
        >
          <LogOut className="mr-2 size-4" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LiveTimeAndDate() {
  const [now, setNow] = useState(() => new Date());
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      }),
    [],
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const formatted = formatter.format(now);

  return (
    <div
      aria-live="polite"
      className={cn(
        buttonVariants({ variant: "ghost", size: "md" }),
        "pointer-events-none select-none text-xs font-medium text-foreground/80 sm:text-sm",
      )}
    >
      {formatted}
    </div>
  );
}

function OnlineIndicator() {
  const { isLoading } = useConvexAuth();
  const { status } = useClient();
  const [offlineSeconds, setOfflineSeconds] = useState(0);

  useEffect(() => {
    if (status !== "disconnected") {
      setOfflineSeconds(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setOfflineSeconds((previous) => previous + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [status]);

  const badgeVariant = status === "connected" ? "success" : "danger";
  const dotClass =
    status === "connected" ? "bg-success-foreground" : "bg-destructive";
  const label =
    status === "connected"
      ? isLoading
        ? "Syncing…"
        : "Online"
      : `Offline: ${formatOfflineDuration(offlineSeconds)}`;

  return (
    <Badge
      variant={badgeVariant}
      className="gap-2 px-3 py-1 text-xs font-medium sm:text-sm"
    >
      <span aria-hidden className={cn("h-2 w-2 rounded-full", dotClass)} />
      {label}
    </Badge>
  );
}

type StartAppletLauncherProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenApplet: (appletId: string) => void;
  openApplets: ReadonlySet<string>;
};

function StartAppletLauncher({
  isOpen,
  onOpenChange,
  onOpenApplet,
  openApplets,
}: StartAppletLauncherProps) {
  const sortedApplets = useMemo(
    () => [...workspaceApplets].sort((a, b) => a.name.localeCompare(b.name)),
    [workspaceApplets],
  );

  const handleLaunch = useCallback(
    (appletId: string) => {
      const applet = sortedApplets.find(
        (candidate) => candidate.id === appletId,
      );
      if (!applet) {
        return;
      }

      if (openApplets.has(applet.id)) {
        toast.warning(`"${applet.name}" is already open in this workspace.`);
        return;
      }

      onOpenApplet(applet.id);
      onOpenChange(false);
    },
    [onOpenApplet, onOpenChange, openApplets, sortedApplets],
  );

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={onOpenChange}
      title="Start applet"
      description="Launch an applet in this workspace"
    >
      <CommandInput placeholder="Search applets" autoFocus />
      <CommandList>
        <CommandEmpty>No applets found.</CommandEmpty>
        <div className="border-b px-3 pb-4 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Quick launch
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {sortedApplets.map((applet) => {
              const Icon = applet.icon;
              const isAlreadyOpen = openApplets.has(applet.id);
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
                    handleLaunch(applet.id);
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
          {sortedApplets.map((applet) => {
            const Icon = applet.icon;
            const isAlreadyOpen = openApplets.has(applet.id);
            return (
              <CommandItem
                key={applet.id}
                value={`${applet.name} ${applet.id}`}
                onSelect={() => {
                  if (isAlreadyOpen) {
                    toast.warning(
                      `"${applet.name}" is already open in this workspace.`,
                    );
                    return;
                  }
                  handleLaunch(applet.id);
                }}
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
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export default function Workspace() {
  const [activeWorkspaceId, setActiveWorkspaceId] =
    useState<WorkspaceId | null>(null);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [workspacePendingDelete, setWorkspacePendingDelete] =
    useState<WorkspaceDefinition | null>(null);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
  const hasBootstrappedWorkspacesRef = useRef(false);

  const workspaces = useQuery(api.workspace.getWorkspaces);
  const currentUser = useQuery(api.auth.getCurrentUser);
  const membership = useQuery(api.identity.getMe, {});
  const persistedNodes = useQuery(
    api.workspace.getNodes,
    activeWorkspaceId === null
      ? "skip"
      : {
          workspaceId: activeWorkspaceId,
        },
  );
  const persistedViewport = useQuery(
    api.workspace.getViewport,
    activeWorkspaceId === null
      ? "skip"
      : {
          workspaceId: activeWorkspaceId,
        },
  );

  const effectiveViewport = useMemo(() => {
    if (activeWorkspaceId === null || persistedViewport === undefined) {
      return undefined;
    }

    if (persistedViewport === null) {
      return {
        workspaceId: activeWorkspaceId,
        position: { x: DEFAULT_VIEWPORT.x, y: DEFAULT_VIEWPORT.y },
        zoom: DEFAULT_VIEWPORT.zoom,
      } as const;
    }

    return persistedViewport;
  }, [activeWorkspaceId, persistedViewport]);

  const sortedWorkspaces = useMemo(() => {
    if (!workspaces) {
      return [] as WorkspaceDefinition[];
    }

    // Maintain stable alphabetical ordering for menu rendering.
    return [...workspaces].sort((left, right) =>
      left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
    );
  }, [workspaces]);

  const activeWorkspaceLabel = (() => {
    const fallback = "Workspace 1";
    if (activeWorkspaceId === null) {
      return fallback;
    }

    return (
      sortedWorkspaces.find((workspace) => workspace.id === activeWorkspaceId)
        ?.name ?? fallback
    );
  })();

  const bootstrapWorkspaces = useMutation(api.workspace.bootstrapWorkspaces);
  const createWorkspaceMutation = useMutation(api.workspace.createWorkspace);
  const deleteWorkspaceMutation = useMutation(api.workspace.deleteWorkspace);

  useEffect(() => {
    if (!sortedWorkspaces.length) {
      return;
    }

    const hasActiveWorkspace = sortedWorkspaces.some(
      (workspace) => workspace.id === activeWorkspaceId,
    );

    if (activeWorkspaceId === null || !hasActiveWorkspace) {
      setActiveWorkspaceId(sortedWorkspaces[0]!.id);
    }
  }, [activeWorkspaceId, sortedWorkspaces]);

  useEffect(() => {
    if (hasBootstrappedWorkspacesRef.current) {
      return;
    }

    if (workspaces === undefined) {
      return;
    }

    if (workspaces.length === 0) {
      hasBootstrappedWorkspacesRef.current = true;
      void bootstrapWorkspaces({});
    }
  }, [bootstrapWorkspaces, workspaces]);

  // Keep optimistic updater stable so Convex subscriptions are reused between renders.
  const createWorkspaceOptimistic = useMemo(
    () =>
      createWorkspaceMutation.withOptimisticUpdate((localStore, args) => {
        const normalizedName = workspaceNameSchema.parse(args.name);
        const previous =
          localStore.getQuery(api.workspace.getWorkspaces, {}) ?? [];
        const usedIds = new Set(previous.map((workspace) => workspace.id));
        let nextId = 1;
        while (usedIds.has(nextId)) {
          nextId += 1;
        }
        const merged = [...previous, { id: nextId, name: normalizedName }].sort(
          (left, right) =>
            left.name.localeCompare(right.name, undefined, {
              sensitivity: "base",
            }),
        );
        localStore.setQuery(api.workspace.getWorkspaces, {}, merged);
      }),
    [createWorkspaceMutation],
  );

  // Keep optimistic updater stable so Convex subscriptions are reused between renders.
  const deleteWorkspaceOptimistic = useMemo(
    () =>
      deleteWorkspaceMutation.withOptimisticUpdate((localStore, args) => {
        const previous =
          localStore.getQuery(api.workspace.getWorkspaces, {}) ?? [];
        const filtered = previous.filter(
          (workspace) => workspace.id !== args.workspaceId,
        );
        localStore.setQuery(api.workspace.getWorkspaces, {}, filtered);
      }),
    [deleteWorkspaceMutation],
  );

  const getSuggestedWorkspaceName = () => {
    const existingNames = new Set(
      sortedWorkspaces.map((workspace) => workspace.name.toLowerCase()),
    );
    let candidate = 1;
    while (existingNames.has(`workspace ${candidate}`.toLowerCase())) {
      candidate += 1;
    }
    return workspaceNameSchema.parse(`Workspace ${candidate}`);
  };

  const handleWorkspaceNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const alphanumeric = rawValue.replace(/[^A-Za-z0-9 ]/g, "");
    setNewWorkspaceName(alphanumeric.slice(0, 32));
  };

  const handleOpenCreateWorkspace = () => {
    setNewWorkspaceName(getSuggestedWorkspaceName());
    setIsCreatingWorkspace(false);
    setIsCreateWorkspaceOpen(true);
  };

  const handleCreateWorkspaceSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const parsedName = workspaceNameSchema.safeParse(newWorkspaceName);
    if (!parsedName.success) {
      const issue = parsedName.error.issues[0];
      toast.error(issue?.message ?? "Invalid workspace name");
      return;
    }

    try {
      setIsCreatingWorkspace(true);
      const created = await createWorkspaceOptimistic({
        name: parsedName.data,
      });
      setIsCreateWorkspaceOpen(false);
      setNewWorkspaceName("");
      setActiveWorkspaceId(created.id);
      toast.success(`Created ${created.name}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create workspace. Please try again.";
      toast.error(message);
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const handleConfirmDeleteWorkspace = async () => {
    if (!workspacePendingDelete) {
      return;
    }

    if (sortedWorkspaces.length <= 1) {
      toast.error("You need at least one workspace.");
      setWorkspacePendingDelete(null);
      return;
    }

    const pending = workspacePendingDelete;
    try {
      setIsDeletingWorkspace(true);
      await deleteWorkspaceOptimistic({ workspaceId: pending.id });
      setWorkspacePendingDelete(null);
      if (activeWorkspaceId === pending.id) {
        const remaining = sortedWorkspaces.filter(
          (workspace) => workspace.id !== pending.id,
        );
        setActiveWorkspaceId(remaining[0]?.id ?? null);
      }
      toast.success(`Deleted ${pending.name}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete workspace. Please try again.";
      toast.error(message);
    } finally {
      setIsDeletingWorkspace(false);
    }
  };

  const trimmedWorkspaceName = newWorkspaceName.trim();
  const isCreateWorkspaceNameValid = trimmedWorkspaceName.length > 0;

  const [nodes, setNodes, applyNodeChanges] = useNodesState<
    Node<AppletNodeData>
  >([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [openApplets, setOpenApplets] = useState<Set<string>>(() => new Set());
  const [isStartOpen, setIsStartOpen] = useState(false);
  const nodesRef = useRef<Node<AppletNodeData>[]>([]);
  const lastAppliedViewportRef = useRef<{
    workspaceId: WorkspaceId;
    position: { x: number; y: number };
    zoom: number;
  } | null>(null);
  const lastPersistedViewportRef = useRef<{
    workspaceId: WorkspaceId;
    position: { x: number; y: number };
    zoom: number;
  } | null>(null);
  const viewportSessionRef = useRef<{
    workspaceId: WorkspaceId | null;
    instance: ReactFlowInstance | null;
    hasApplied: boolean;
  }>({ workspaceId: null, instance: null, hasApplied: false });
  const { backgroundPattern } = useTheme();
  const flowBackground = useMemo(() => {
    if (backgroundPattern === "none") {
      return null;
    }

    const variant = backgroundPattern === "cross" ? "cross" : backgroundPattern;
    const gap = backgroundPattern === "dots" ? 24 : 32;
    const size = backgroundPattern === "dots" ? 1 : 2;

    return { variant, gap, size } as const;
  }, [backgroundPattern]);

  const createWorkspaceNode = useMutation(api.workspace.createNode);
  const updateWorkspaceNode = useMutation(api.workspace.updateNode);
  const removeWorkspaceNode = useMutation(api.workspace.removeNode);
  const setWorkspaceViewport = useMutation(api.workspace.setViewport);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const createWorkspaceNodeOptimistic = useMemo(
    () =>
      createWorkspaceNode.withOptimisticUpdate((localStore, args) => {
        const queryArgs = { workspaceId: args.workspaceId };
        const previous =
          localStore.getQuery(api.workspace.getNodes, queryArgs) ?? [];
        const merged = [
          ...previous.filter((node) => node.id !== args.nodeId),
          {
            workspaceId: args.workspaceId,
            appletId: args.appletId,
            id: args.nodeId,
            label: args.label,
            position: args.position,
            size: args.size,
          },
        ];
        localStore.setQuery(api.workspace.getNodes, queryArgs, merged);
      }),
    [createWorkspaceNode],
  );

  const updateWorkspaceNodeOptimistic = useMemo(
    () =>
      updateWorkspaceNode.withOptimisticUpdate((localStore, args) => {
        const queryArgs = { workspaceId: args.workspaceId };
        const previous =
          localStore.getQuery(api.workspace.getNodes, queryArgs) ?? [];
        const updated = previous.map((node) => {
          if (node.id !== args.nodeId) {
            return node;
          }

          return {
            ...node,
            position: args.position ?? node.position,
            size: args.size ?? node.size,
          };
        });

        localStore.setQuery(api.workspace.getNodes, queryArgs, updated);
      }),
    [updateWorkspaceNode],
  );

  const removeWorkspaceNodeOptimistic = useMemo(
    () =>
      removeWorkspaceNode.withOptimisticUpdate((localStore, args) => {
        const queryArgs = { workspaceId: args.workspaceId };
        const previous =
          localStore.getQuery(api.workspace.getNodes, queryArgs) ?? [];
        localStore.setQuery(
          api.workspace.getNodes,
          queryArgs,
          previous.filter((node) => node.id !== args.nodeId),
        );
      }),
    [removeWorkspaceNode],
  );

  // Avoid recreating the optimistic viewport mutation on every render.
  const setWorkspaceViewportOptimistic = useMemo(
    () =>
      setWorkspaceViewport.withOptimisticUpdate((localStore, args) => {
        const queryArgs = { workspaceId: args.workspaceId };
        localStore.setQuery(api.workspace.getViewport, queryArgs, {
          workspaceId: args.workspaceId,
          position: args.position,
          zoom: args.zoom,
        });
      }),
    [setWorkspaceViewport],
  );

  const promoteNodeZIndex = useCallback(
    (nodeId: string) => {
      const currentNodes = nodesRef.current;

      if (currentNodes.length === 0) {
        return;
      }

      const target = currentNodes.find((candidate) => candidate.id === nodeId);
      if (!target) {
        return;
      }

      const currentZ = target.zIndex ?? 0;
      let maxZ = currentZ;
      let hasEqualDepthPeer = false;
      let hasHigherDepthPeer = false;

      for (const candidate of currentNodes) {
        if (candidate.id === nodeId) {
          continue;
        }

        const candidateZ = candidate.zIndex ?? 0;
        if (candidateZ > currentZ) {
          hasHigherDepthPeer = true;
        }
        if (candidateZ === currentZ) {
          hasEqualDepthPeer = true;
        }
        if (candidateZ > maxZ) {
          maxZ = candidateZ;
        }
      }

      if (!hasHigherDepthPeer && !hasEqualDepthPeer) {
        return;
      }

      const nextZ = maxZ + 1;

      setNodes((current) =>
        current.map((candidate) =>
          candidate.id === nodeId
            ? {
                ...candidate,
                zIndex: nextZ,
              }
            : candidate,
        ),
      );

      void updateWorkspaceNodeOptimistic({
        workspaceId: activeWorkspaceId,
        nodeId,
        position: {
          x: target.position.x,
          y: target.position.y,
          z: nextZ,
        },
      });
    },
    [activeWorkspaceId, setNodes, updateWorkspaceNodeOptimistic],
  );

  const handleRemoveNode = useCallback(
    (nodeId: string) => {
      const targetNode = nodesRef.current.find(
        (candidate) => candidate.id === nodeId,
      );
      const targetAppletId = targetNode?.data.appletId;
      if (targetAppletId) {
        setOpenApplets((current) => {
          const next = new Set(current);
          next.delete(targetAppletId);
          return next;
        });
      }

      void removeWorkspaceNodeOptimistic({
        workspaceId: activeWorkspaceId,
        nodeId,
      });
      setNodes((current) => current.filter((node) => node.id !== nodeId));
      setEdges((current) =>
        current.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId,
        ),
      );
    },
    [
      activeWorkspaceId,
      removeWorkspaceNodeOptimistic,
      setEdges,
      setNodes,
      setOpenApplets,
    ],
  );

  useEffect(() => {
    setNodes([]);
    setEdges([]);
    setOpenApplets(new Set());
  }, [activeWorkspaceId, setEdges, setNodes, setOpenApplets]);

  useEffect(() => {
    if (persistedNodes === undefined) {
      return;
    }

    setNodes((current) => {
      const byId = new Map(current.map((node) => [node.id, node]));

      return persistedNodes.map((node) => {
        const applet = getWorkspaceApplet(node.appletId);
        const label = applet?.name ?? node.label;
        const zIndex = node.position.z ?? 0;
        const position2d = {
          x: node.position.x,
          y: node.position.y,
        } as const;

        const next: Node<AppletNodeData> = {
          id: node.id,
          type: "appletNode",
          position: position2d,
          data: {
            appletId: node.appletId,
            label,
            onRemove: handleRemoveNode,
          },
          style: {
            width: node.size.width,
            height: node.size.height,
          },
          zIndex,
          width: node.size.width,
          height: node.size.height,
        };

        const existing = byId.get(node.id);
        if (!existing) {
          return next;
        }

        return {
          ...existing,
          position: next.position,
          data: next.data,
          style: next.style,
          zIndex: next.zIndex,
          width: next.width,
          height: next.height,
        };
      });
    });
  }, [persistedNodes, handleRemoveNode, setNodes]);

  useEffect(() => {
    if (persistedNodes === undefined) {
      return;
    }

    const next = new Set((persistedNodes ?? []).map((node) => node.appletId));
    setOpenApplets(next);
  }, [persistedNodes, setOpenApplets]);

  useEffect(() => {
    if (reactFlowInstance === null || !effectiveViewport) {
      return;
    }

    const session = viewportSessionRef.current;

    if (session.instance !== reactFlowInstance) {
      session.instance = reactFlowInstance;
      session.hasApplied = false;
    }

    if (session.workspaceId !== activeWorkspaceId) {
      session.workspaceId = activeWorkspaceId;
      session.hasApplied = false;
    }

    if (session.hasApplied) {
      return;
    }

    const target = effectiveViewport;

    void reactFlowInstance.setViewport({
      x: target.position.x,
      y: target.position.y,
      zoom: target.zoom,
    });

    session.hasApplied = true;

    lastAppliedViewportRef.current = {
      workspaceId: activeWorkspaceId,
      position: { x: target.position.x, y: target.position.y },
      zoom: target.zoom,
    };

    if (persistedViewport) {
      lastPersistedViewportRef.current = {
        workspaceId: persistedViewport.workspaceId,
        position: { ...persistedViewport.position },
        zoom: persistedViewport.zoom,
      };
    } else {
      lastPersistedViewportRef.current = {
        workspaceId: activeWorkspaceId,
        position: { x: target.position.x, y: target.position.y },
        zoom: target.zoom,
      };
    }
  }, [
    activeWorkspaceId,
    effectiveViewport,
    persistedViewport,
    reactFlowInstance,
  ]);

  const handleOpenApplet = useCallback(
    (appletId: string) => {
      const applet = getWorkspaceApplet(appletId);
      if (!applet) {
        return;
      }

      if (openApplets.has(applet.id)) {
        toast.info(`"${applet.name}" is already open in this workspace.`);
        return;
      }

      let persistence:
        | ReturnType<typeof buildNewAppletNode>["persistence"]
        | null = null;

      setNodes((current) => {
        const maxZ = current.reduce(
          (acc, candidate) => Math.max(acc, candidate.zIndex ?? 0),
          0,
        );
        const { node, persistence: details } = buildNewAppletNode(
          applet,
          current.length,
          maxZ + 1,
          handleRemoveNode,
        );
        persistence = details;
        return [...current, node];
      });

      if (persistence) {
        setOpenApplets((current) => {
          const next = new Set(current);
          next.add(applet.id);
          return next;
        });
        void createWorkspaceNodeOptimistic({
          workspaceId: activeWorkspaceId,
          nodeId: persistence.nodeId,
          appletId: persistence.appletId,
          label: persistence.label,
          position: persistence.position,
          size: persistence.size,
        });
      }
    },
    [
      activeWorkspaceId,
      createWorkspaceNodeOptimistic,
      handleRemoveNode,
      openApplets,
      setOpenApplets,
      setNodes,
    ],
  );

  const handleSignOut = useCallback(() => {
    void authClient.signOut();
  }, []);

  const handleNodesChange = useCallback(
    (changes: NodeChange<AppletNodeData>[]) => {
      const removedAppletIds: string[] = [];

      for (const change of changes) {
        if (change.type === "remove") {
          const removedNode = nodesRef.current.find(
            (candidate) => candidate.id === change.id,
          );
          const removedAppletId = removedNode?.data.appletId;
          if (removedAppletId) {
            removedAppletIds.push(removedAppletId);
          }
        }
      }

      applyNodeChanges(changes);

      if (removedAppletIds.length > 0) {
        setOpenApplets((current) => {
          let didChange = false;
          const next = new Set(current);
          for (const appletId of removedAppletIds) {
            if (next.delete(appletId)) {
              didChange = true;
            }
          }

          return didChange ? next : current;
        });
      }

      for (const change of changes) {
        if (change.type === "position" && change.position) {
          if (change.dragging === false || change.dragging === undefined) {
            const currentNode =
              reactFlowInstance?.getNode(change.id) ??
              nodesRef.current.find((candidate) => candidate.id === change.id);
            const zIndex = currentNode?.zIndex ?? 0;
            void updateWorkspaceNodeOptimistic({
              workspaceId: activeWorkspaceId,
              nodeId: change.id,
              position: {
                x: change.position.x,
                y: change.position.y,
                z: zIndex,
              },
            });
          }
        }

        if (change.type === "dimensions" && change.dimensions) {
          const { width, height } = change.dimensions;
          if (
            (change.resizing === false || change.resizing === undefined) &&
            typeof width === "number" &&
            typeof height === "number"
          ) {
            void updateWorkspaceNodeOptimistic({
              workspaceId: activeWorkspaceId,
              nodeId: change.id,
              size: { width, height },
            });
          }
        }

        if (change.type === "remove") {
          void removeWorkspaceNodeOptimistic({
            workspaceId: activeWorkspaceId,
            nodeId: change.id,
          });
        }
      }
    },
    [
      activeWorkspaceId,
      applyNodeChanges,
      reactFlowInstance,
      updateWorkspaceNodeOptimistic,
      removeWorkspaceNodeOptimistic,
      setOpenApplets,
    ],
  );

  const handleNodeClick = useCallback<NodeMouseHandler<Node<AppletNodeData>>>(
    (_event, node) => {
      promoteNodeZIndex(node.id);
    },
    [promoteNodeZIndex],
  );

  const handleNodeDragStart = useCallback<OnNodeDrag<Node<AppletNodeData>>>(
    (_event, node) => {
      promoteNodeZIndex(node.id);
    },
    [promoteNodeZIndex],
  );

  // Persist the latest user-controlled viewport once panning/zooming stops.
  const handleViewportCommit = useCallback(
    (
      event: MouseEvent | TouchEvent | null,
      viewport: { x: number; y: number; zoom: number },
    ) => {
      if (event === null) {
        return;
      }

      const snapshot = {
        workspaceId: activeWorkspaceId,
        position: { x: viewport.x, y: viewport.y },
        zoom: viewport.zoom,
      };

      const lastPersisted = lastPersistedViewportRef.current;

      if (
        lastPersisted &&
        lastPersisted.workspaceId === snapshot.workspaceId &&
        lastPersisted.position.x === snapshot.position.x &&
        lastPersisted.position.y === snapshot.position.y &&
        lastPersisted.zoom === snapshot.zoom
      ) {
        return;
      }

      lastAppliedViewportRef.current = snapshot;
      lastPersistedViewportRef.current = snapshot;

      void setWorkspaceViewportOptimistic({
        workspaceId: snapshot.workspaceId,
        position: snapshot.position,
        zoom: snapshot.zoom,
      });
    },
    [activeWorkspaceId, setWorkspaceViewportOptimistic],
  );

  const handleWorkspaceSelect = (workspaceId: WorkspaceId) => {
    setActiveWorkspaceId(workspaceId);
  };

  const nodeTypes = useMemo(
    () => ({
      appletNode: AppletNode,
    }),
    [],
  );

  const settingsNodeId = useMemo(() => {
    const settingsNode = nodes.find(
      (candidate) => candidate.data.appletId === settingsApplet.id,
    );
    return settingsNode?.id ?? null;
  }, [nodes]);

  if (currentUser === undefined || membership === undefined) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background text-foreground">
        <span className="text-sm">Loading workspace…</span>
      </div>
    );
  }

  if (!currentUser || !membership) {
    return null;
  }

  return (
    <div className="fixed inset-0">
      <ReactFlow
        aria-label="Workspace canvas"
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={setReactFlowInstance}
        onMoveEnd={handleViewportCommit}
        onNodeClick={handleNodeClick}
        onNodeDragStart={handleNodeDragStart}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={DEFAULT_VIEWPORT}
        proOptions={{ hideAttribution: true }}
        panOnDrag
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        nodeTypes={nodeTypes}
        className="bg-background text-foreground"
      >
        {flowBackground ? (
          <Background
            variant={flowBackground.variant}
            gap={flowBackground.gap}
            size={flowBackground.size}
          />
        ) : null}
        <Controls
          position="bottom-right"
          showFitView={false}
          showInteractive={false}
        />
        <MiniMap position="top-right" pannable zoomable />
        <Panel position="bottom-center" className="pointer-events-auto">
          <Toolbar aria-label="Workspace toolbar" className="w-full max-w-3xl">
            <ToolbarGroup className="items-center gap-3">
              <UserMenu
                currentUser={currentUser}
                membership={membership}
                onSignOut={handleSignOut}
                onOpenSettings={() => handleOpenApplet(settingsApplet.id)}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <ToolbarButton
                    type="button"
                    aria-label="Select workspace"
                    className="gap-2 px-3"
                  >
                    {activeWorkspaceLabel}
                    <ChevronsUpDown className="size-3" aria-hidden />
                  </ToolbarButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[16rem]">
                  <DropdownMenuItem
                    className="gap-2 font-medium"
                    onClick={(event) => {
                      event.preventDefault(); // 🚀 ensures Dialog open state isn't swallowed
                      handleOpenCreateWorkspace();
                    }}
                  >
                    <Plus className="size-4" aria-hidden />
                    Add Workspace
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                    {workspaces === undefined ? (
                      <DropdownMenuItem disabled>
                        Loading workspaces…
                      </DropdownMenuItem>
                    ) : sortedWorkspaces.length === 0 ? (
                      <DropdownMenuItem disabled>
                        No workspaces yet
                      </DropdownMenuItem>
                    ) : (
                      sortedWorkspaces.map((workspace) => {
                        const isActive = workspace.id === activeWorkspaceId;
                        return (
                          <DropdownMenuItem
                            key={workspace.id}
                            role="menuitemradio"
                            aria-checked={isActive}
                            className={cn(
                              "flex items-center gap-2",
                              isActive ? "text-primary" : undefined,
                            )}
                            onClick={(event) => {
                              event.preventDefault();
                              handleWorkspaceSelect(workspace.id);
                            }}
                          >
                            <span className="flex min-w-0 flex-1 items-center gap-2">
                              <span className="flex size-4 items-center justify-center">
                                {isActive ? (
                                  <Check className="size-4" aria-hidden />
                                ) : null}
                              </span>
                              <span className="truncate">{workspace.name}</span>
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="ml-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                setWorkspacePendingDelete(workspace);
                              }}
                              disabled={sortedWorkspaces.length <= 1}
                            >
                              <Trash2 className="size-4" aria-hidden />
                              <span className="sr-only">
                                Delete {workspace.name}
                              </span>
                            </Button>
                          </DropdownMenuItem>
                        );
                      })
                    )}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <ToolbarButton
                type="button"
                className="gap-2 px-3"
                variant="secondary"
                aria-label="Open the Start applet launcher"
                onClick={() => setIsStartOpen(true)}
              >
                <Grid3x3 className="size-4" aria-hidden />
                Start
              </ToolbarButton>
              <ContextMenu>
                <ContextMenuTrigger className="contents">
                  <ToolbarButton
                    type="button"
                    aria-label="Open settings"
                    onClick={() => handleOpenApplet(settingsApplet.id)}
                  >
                    <SettingsIcon className="size-4" aria-hidden />
                  </ToolbarButton>
                </ContextMenuTrigger>
                <ContextMenuContent align="end">
                  <ContextMenuItem
                    onSelect={() => {
                      handleOpenApplet(settingsApplet.id);
                    }}
                  >
                    Open Settings
                  </ContextMenuItem>
                  <ContextMenuItem
                    variant="destructive"
                    disabled={!settingsNodeId}
                    onSelect={() => {
                      if (settingsNodeId) {
                        handleRemoveNode(settingsNodeId);
                      }
                    }}
                  >
                    Close Settings
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </ToolbarGroup>
            <ToolbarGroup className="ml-auto items-center gap-3">
              <OnlineIndicator />
              <LiveTimeAndDate />
            </ToolbarGroup>
          </Toolbar>
        </Panel>
      </ReactFlow>
      <StartAppletLauncher
        isOpen={isStartOpen}
        onOpenChange={setIsStartOpen}
        onOpenApplet={handleOpenApplet}
        openApplets={openApplets}
      />
      <Dialog
        open={isCreateWorkspaceOpen}
        onOpenChange={(open) => {
          setIsCreateWorkspaceOpen(open);
          if (!open) {
            setNewWorkspaceName("");
            setIsCreatingWorkspace(false);
          }
        }}
      >
        <DialogContent>
          <form className="space-y-4" onSubmit={handleCreateWorkspaceSubmit}>
            <DialogHeader>
              <DialogTitle>Add workspace</DialogTitle>
              <DialogDescription>
                Choose a name for the new workspace. You can update it later
                from the toolbar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace name</Label>
              <Input
                id="workspace-name"
                autoFocus
                autoComplete="off"
                value={newWorkspaceName}
                onChange={handleWorkspaceNameChange}
                placeholder={getSuggestedWorkspaceName()}
                disabled={isCreatingWorkspace}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateWorkspaceOpen(false);
                  setNewWorkspaceName("");
                  setIsCreatingWorkspace(false);
                }}
                disabled={isCreatingWorkspace}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isCreateWorkspaceNameValid || isCreatingWorkspace}
              >
                {isCreatingWorkspace ? "Creating…" : "Create workspace"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={workspacePendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setWorkspacePendingDelete(null);
            setIsDeletingWorkspace(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {workspacePendingDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {workspacePendingDelete?.name} and closes
              all running applets in that workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setWorkspacePendingDelete(null);
                setIsDeletingWorkspace(false);
              }}
              disabled={isDeletingWorkspace}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDeleteWorkspace}
              disabled={isDeletingWorkspace || sortedWorkspaces.length <= 1}
            >
              {isDeletingWorkspace ? "Deleting…" : "Delete workspace"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
