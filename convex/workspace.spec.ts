import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RegisteredMutation, RegisteredQuery } from "convex/server";

import {
  bootstrapWorkspaces,
  createNode,
  createWorkspace,
  deleteWorkspace,
  getNodes,
  getViewport,
  getWorkspaces,
  removeNode,
  setViewport,
  updateNode,
} from "./workspace";

interface WorkspaceNodeDocument {
  _id: string;
  identitySubject: string;
  workspaceId: number;
  nodeId: string;
  appletId: string;
  label: string;
  position: { x: number; y: number; z?: number };
  size: { width: number; height: number };
  createdAt: number;
  updatedAt: number;
}

interface WorkspaceViewportDocument {
  _id: string;
  identitySubject: string;
  workspaceId: number;
  position: { x: number; y: number };
  zoom: number;
  updatedAt: number;
}

interface WorkspaceDocument {
  _id: string;
  identitySubject: string;
  workspaceId: number;
  name: string;
  createdAt: number;
  updatedAt: number;
}

type Condition<TRecord extends Record<string, unknown>> = {
  field: keyof TRecord;
  value: unknown;
};

class MockQueryBuilder<TRecord extends Record<string, unknown>> {
  private readonly conditions: Array<Condition<TRecord>> = [];

  eq(field: keyof TRecord, value: unknown) {
    this.conditions.push({ field, value });
    return this;
  }

  build(records: TRecord[]) {
    return records.filter((doc) =>
      this.conditions.every(({ field, value }) => doc[field] === value),
    );
  }
}

const createMockDb = () => {
  let nodes: WorkspaceNodeDocument[] = [];
  let viewports: WorkspaceViewportDocument[] = [];
  let workspaces: WorkspaceDocument[] = [];
  let nodeIdCounter = 0;
  let viewportIdCounter = 0;
  let workspaceDocIdCounter = 0;

  return {
    query: (table: "workspaceNodes" | "workspaceViewports" | "workspaces") => {
      if (table === "workspaceNodes") {
        return {
          withIndex: (
            _index: string,
            callback: (
              builder: MockQueryBuilder<WorkspaceNodeDocument>,
            ) => MockQueryBuilder<WorkspaceNodeDocument>,
          ) => {
            const builder = new MockQueryBuilder<WorkspaceNodeDocument>();
            callback(builder);
            const result = builder.build(nodes);
            return {
              collect: async () => result,
              unique: async () => result[0] ?? null,
            };
          },
        };
      }

      if (table === "workspaceViewports") {
        return {
          withIndex: (
            _index: string,
            callback: (
              builder: MockQueryBuilder<WorkspaceViewportDocument>,
            ) => MockQueryBuilder<WorkspaceViewportDocument>,
          ) => {
            const builder = new MockQueryBuilder<WorkspaceViewportDocument>();
            callback(builder);
            const result = builder.build(viewports);
            return {
              collect: async () => result,
              unique: async () => result[0] ?? null,
            };
          },
        };
      }

      if (table === "workspaces") {
        return {
          withIndex: (
            _index: string,
            callback: (
              builder: MockQueryBuilder<WorkspaceDocument>,
            ) => MockQueryBuilder<WorkspaceDocument>,
          ) => {
            const builder = new MockQueryBuilder<WorkspaceDocument>();
            callback(builder);
            const result = builder.build(workspaces);
            return {
              collect: async () => result,
              unique: async () => result[0] ?? null,
            };
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
    insert: async (
      table: "workspaceNodes" | "workspaceViewports" | "workspaces",
      doc:
        | Omit<WorkspaceNodeDocument, "_id">
        | Omit<WorkspaceViewportDocument, "_id">
        | Omit<WorkspaceDocument, "_id">,
    ) => {
      if (table === "workspaceNodes") {
        const record: WorkspaceNodeDocument = {
          _id: `node_${nodeIdCounter++}`,
          ...(doc as Omit<WorkspaceNodeDocument, "_id">),
        };
        nodes = [...nodes, record];
        return record._id;
      }

      if (table === "workspaceViewports") {
        const record: WorkspaceViewportDocument = {
          _id: `viewport_${viewportIdCounter++}`,
          ...(doc as Omit<WorkspaceViewportDocument, "_id">),
        };
        viewports = [...viewports, record];
        return record._id;
      }

      if (table === "workspaces") {
        const record: WorkspaceDocument = {
          _id: `workspace_${workspaceDocIdCounter++}`,
          ...(doc as Omit<WorkspaceDocument, "_id">),
        };
        workspaces = [...workspaces, record];
        return record._id;
      }

      throw new Error(`Unexpected table: ${table}`);
    },
    patch: async (
      id: string,
      update:
        | Partial<WorkspaceNodeDocument>
        | Partial<WorkspaceViewportDocument>
        | Partial<WorkspaceDocument>,
    ) => {
      nodes = nodes.map((doc) =>
        doc._id === id
          ? { ...doc, ...(update as Partial<WorkspaceNodeDocument>) }
          : doc,
      );
      viewports = viewports.map((doc) =>
        doc._id === id
          ? { ...doc, ...(update as Partial<WorkspaceViewportDocument>) }
          : doc,
      );
      workspaces = workspaces.map((doc) =>
        doc._id === id
          ? { ...doc, ...(update as Partial<WorkspaceDocument>) }
          : doc,
      );
    },
    delete: async (id: string) => {
      nodes = nodes.filter((doc) => doc._id !== id);
      viewports = viewports.filter((doc) => doc._id !== id);
      workspaces = workspaces.filter((doc) => doc._id !== id);
    },
    dump: () => nodes.map((doc) => ({ ...doc })),
    dumpViewports: () => viewports.map((doc) => ({ ...doc })),
    dumpWorkspaces: () => workspaces.map((doc) => ({ ...doc })),
    seed: (
      seedNodes: WorkspaceNodeDocument[],
      seedViewports: WorkspaceViewportDocument[] = [],
      seedWorkspaces: WorkspaceDocument[] = [],
    ) => {
      nodes = seedNodes.map((doc) => ({ ...doc }));
      nodeIdCounter = seedNodes.length;
      viewports = seedViewports.map((doc) => ({ ...doc }));
      viewportIdCounter = seedViewports.length;
      workspaces = seedWorkspaces.map((doc) => ({ ...doc }));
      workspaceDocIdCounter = seedWorkspaces.length;
    },
  } as const;
};

type MutationArgs<M> =
  M extends RegisteredMutation<unknown, infer Args, unknown> ? Args : never;
type MutationResult<M> =
  M extends RegisteredMutation<unknown, unknown, infer Result> ? Result : never;
type TestableMutation<M> = M & {
  _handler: (
    ctx: { auth: MockAuth; db: ReturnType<typeof createMockDb> },
    args: MutationArgs<M>,
  ) => Promise<MutationResult<M>>;
};

type QueryArgs<Q> =
  Q extends RegisteredQuery<infer Args, unknown> ? Args : never;
type QueryResult<Q> =
  Q extends RegisteredQuery<unknown, infer Result> ? Result : never;
type TestableQuery<Q> = Q & {
  _handler: (
    ctx: { auth: MockAuth; db: ReturnType<typeof createMockDb> },
    args: QueryArgs<Q>,
  ) => Promise<QueryResult<Q>>;
};

interface MockAuth {
  getUserIdentity: () => Promise<{ subject: string } | null>;
}

const createNodeMutation = createNode as TestableMutation<typeof createNode>;
const updateNodeMutation = updateNode as TestableMutation<typeof updateNode>;
const removeNodeMutation = removeNode as TestableMutation<typeof removeNode>;
const getNodesQuery = getNodes as TestableQuery<typeof getNodes>;
const setViewportMutation = setViewport as TestableMutation<typeof setViewport>;
const getViewportQuery = getViewport as TestableQuery<typeof getViewport>;
const bootstrapWorkspacesMutation = bootstrapWorkspaces as TestableMutation<
  typeof bootstrapWorkspaces
>;
const createWorkspaceMutation = createWorkspace as TestableMutation<
  typeof createWorkspace
>;
const deleteWorkspaceMutation = deleteWorkspace as TestableMutation<
  typeof deleteWorkspace
>;
const getWorkspacesQuery = getWorkspaces as TestableQuery<typeof getWorkspaces>;

describe("workspace management", () => {
  const getUserIdentity = vi.fn<MockAuth["getUserIdentity"]>();
  const auth: MockAuth = {
    getUserIdentity,
  };
  const db = createMockDb();

  const ctx = { auth, db } as const;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-02-01T12:00:00Z"));
    getUserIdentity.mockReset();
    getUserIdentity.mockResolvedValue({ subject: "user_1" });
    db.seed([], [], []);
  });

  it("bootstraps a default workspace when none exist", async () => {
    const result = await bootstrapWorkspacesMutation._handler(ctx, {});

    expect(result).toEqual([{ id: 1, name: "Workspace 1" }]);

    const stored = db.dumpWorkspaces();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      identitySubject: "user_1",
      workspaceId: 1,
      name: "Workspace 1",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  it("derives workspace entries from existing nodes and viewports", async () => {
    db.seed(
      [
        {
          _id: "node_0",
          identitySubject: "user_1",
          workspaceId: 3,
          nodeId: "node_a",
          appletId: "alpha",
          label: "Alpha",
          position: { x: 0, y: 0, z: 0 },
          size: { width: 200, height: 120 },
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      [
        {
          _id: "viewport_0",
          identitySubject: "user_1",
          workspaceId: 5,
          position: { x: 5, y: 5 },
          zoom: 1,
          updatedAt: 2,
        },
      ],
      [],
    );

    const result = await bootstrapWorkspacesMutation._handler(ctx, {});

    expect(result).toEqual([
      { id: 3, name: "Workspace 3" },
      { id: 5, name: "Workspace 5" },
    ]);

    const stored = db.dumpWorkspaces();
    expect(stored.map((entry) => entry.workspaceId).sort()).toEqual([3, 5]);
  });

  it("returns sorted workspace metadata", async () => {
    db.seed(
      [],
      [],
      [
        {
          _id: "workspace_0",
          identitySubject: "user_1",
          workspaceId: 2,
          name: " beta ",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          _id: "workspace_1",
          identitySubject: "user_1",
          workspaceId: 1,
          name: "Alpha",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
    );

    const result = await getWorkspacesQuery._handler(ctx, {});

    expect(result).toEqual([
      { id: 1, name: "Alpha" },
      { id: 2, name: "beta" },
    ]);
  });

  it("creates the next available workspace id with sanitized name", async () => {
    db.seed(
      [],
      [],
      [
        {
          _id: "workspace_0",
          identitySubject: "user_1",
          workspaceId: 1,
          name: "Workspace 1",
          createdAt: 0,
          updatedAt: 0,
        },
        {
          _id: "workspace_1",
          identitySubject: "user_1",
          workspaceId: 3,
          name: "Workspace 3",
          createdAt: 0,
          updatedAt: 0,
        },
      ],
    );

    const created = await createWorkspaceMutation._handler(ctx, {
      name: "   My Workspace   ",
    });

    expect(created).toEqual({ id: 2, name: "My Workspace" });

    const stored = db.dumpWorkspaces();
    const newlyStored = stored.find((entry) => entry.workspaceId === 2);
    expect(newlyStored).toMatchObject({
      identitySubject: "user_1",
      workspaceId: 2,
      name: "My Workspace",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  it("removes workspace data and dependencies on delete", async () => {
    db.seed(
      [
        {
          _id: "node_0",
          identitySubject: "user_1",
          workspaceId: 1,
          nodeId: "node_a",
          appletId: "alpha",
          label: "Alpha",
          position: { x: 0, y: 0, z: 0 },
          size: { width: 160, height: 90 },
          createdAt: 0,
          updatedAt: 0,
        },
        {
          _id: "node_1",
          identitySubject: "user_1",
          workspaceId: 2,
          nodeId: "node_b",
          appletId: "beta",
          label: "Beta",
          position: { x: 10, y: 10, z: 1 },
          size: { width: 200, height: 120 },
          createdAt: 0,
          updatedAt: 0,
        },
      ],
      [
        {
          _id: "viewport_0",
          identitySubject: "user_1",
          workspaceId: 2,
          position: { x: 10, y: 10 },
          zoom: 1.2,
          updatedAt: 0,
        },
      ],
      [
        {
          _id: "workspace_0",
          identitySubject: "user_1",
          workspaceId: 1,
          name: "Workspace 1",
          createdAt: 0,
          updatedAt: 0,
        },
        {
          _id: "workspace_1",
          identitySubject: "user_1",
          workspaceId: 2,
          name: "Workspace 2",
          createdAt: 0,
          updatedAt: 0,
        },
      ],
    );

    const deleted = await deleteWorkspaceMutation._handler(ctx, {
      workspaceId: 2,
    });

    expect(deleted).toEqual({ id: 2, name: "Workspace 2" });

    expect(db.dumpWorkspaces().map((entry) => entry.workspaceId)).toEqual([1]);
    expect(db.dump().map((node) => node.workspaceId)).toEqual([1]);
    expect(db.dumpViewports()).toHaveLength(0);

    await expect(
      deleteWorkspaceMutation._handler(ctx, { workspaceId: 1 }),
    ).rejects.toThrow("Cannot delete the last workspace");
  });
});

describe("workspace nodes", () => {
  const getUserIdentity = vi.fn<MockAuth["getUserIdentity"]>();
  const auth: MockAuth = {
    getUserIdentity,
  };
  const db = createMockDb();

  const ctx = { auth, db } as const;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-02-01T12:00:00Z"));
    getUserIdentity.mockReset();
    getUserIdentity.mockResolvedValue({ subject: "user_1" });
    db.seed([]);
  });

  it("persists nodes with owner identity on creation", async () => {
    const result = await createNodeMutation._handler(ctx, {
      workspaceId: 1,
      nodeId: "node_a",
      appletId: "applet_hello",
      label: "Testnode",
      position: { x: 10, y: 20, z: 0 },
      size: { width: 200, height: 120 },
    });

    expect(result).toEqual({
      workspaceId: 1,
      appletId: "applet_hello",
      id: "node_a",
      label: "Testnode",
      position: { x: 10, y: 20, z: 0 },
      size: { width: 200, height: 120 },
    });

    const stored = db.dump();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      identitySubject: "user_1",
      workspaceId: 1,
      nodeId: "node_a",
      appletId: "applet_hello",
      label: "Testnode",
      position: { x: 10, y: 20, z: 0 },
      size: { width: 200, height: 120 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  it("returns only the requesting user's nodes", async () => {
    db.seed([
      {
        _id: "node_0",
        identitySubject: "user_1",
        workspaceId: 1,
        nodeId: "node_a",
        appletId: "applet_hello",
        label: "First",
        position: { x: 0, y: 0, z: 2 },
        size: { width: 100, height: 80 },
        createdAt: Date.now() - 50,
        updatedAt: Date.now() - 50,
      },
      {
        _id: "node_1",
        identitySubject: "user_2",
        workspaceId: 1,
        nodeId: "node_b",
        appletId: "applet_counter",
        label: "Other",
        position: { x: 20, y: 20, z: 0 },
        size: { width: 120, height: 90 },
        createdAt: Date.now() - 25,
        updatedAt: Date.now() - 25,
      },
      {
        _id: "node_2",
        identitySubject: "user_1",
        workspaceId: 1,
        nodeId: "node_c",
        appletId: "applet_hello",
        label: "Second",
        position: { x: 5, y: 15, z: 7 },
        size: { width: 140, height: 110 },
        createdAt: Date.now() - 10,
        updatedAt: Date.now() - 10,
      },
    ]);

    const nodes = await getNodesQuery._handler(ctx, { workspaceId: 1 });

    expect(nodes).toEqual([
      {
        workspaceId: 1,
        appletId: "applet_hello",
        id: "node_a",
        label: "First",
        position: { x: 0, y: 0, z: 2 },
        size: { width: 100, height: 80 },
      },
      {
        workspaceId: 1,
        appletId: "applet_hello",
        id: "node_c",
        label: "Second",
        position: { x: 5, y: 15, z: 7 },
        size: { width: 140, height: 110 },
      },
    ]);
  });

  it("defaults missing z-depth to zero for legacy records", async () => {
    db.seed([
      {
        _id: "legacy_node_0",
        identitySubject: "user_1",
        workspaceId: 1,
        nodeId: "legacy_node",
        appletId: "applet_legacy",
        label: "Legacy",
        position: { x: 12, y: 34 },
        size: { width: 120, height: 90 },
        createdAt: Date.now() - 100,
        updatedAt: Date.now() - 100,
      },
    ]);

    const nodes = await getNodesQuery._handler(ctx, { workspaceId: 1 });

    expect(nodes).toEqual([
      {
        workspaceId: 1,
        appletId: "applet_legacy",
        id: "legacy_node",
        label: "Legacy",
        position: { x: 12, y: 34, z: 0 },
        size: { width: 120, height: 90 },
      },
    ]);
  });

  it("scopes workspace nodes by workspace id", async () => {
    db.seed([
      {
        _id: "node_0",
        identitySubject: "user_1",
        workspaceId: 1,
        nodeId: "node_a",
        appletId: "applet_hello",
        label: "Workspace 1",
        position: { x: 0, y: 0, z: 0 },
        size: { width: 100, height: 80 },
        createdAt: Date.now() - 50,
        updatedAt: Date.now() - 50,
      },
      {
        _id: "node_1",
        identitySubject: "user_1",
        workspaceId: 2,
        nodeId: "node_b",
        appletId: "applet_counter",
        label: "Workspace 2",
        position: { x: 20, y: 20, z: 0 },
        size: { width: 120, height: 90 },
        createdAt: Date.now() - 25,
        updatedAt: Date.now() - 25,
      },
      {
        _id: "node_2",
        identitySubject: "user_1",
        workspaceId: 2,
        nodeId: "node_c",
        appletId: "applet_hello",
        label: "Workspace 2 again",
        position: { x: 5, y: 15, z: 0 },
        size: { width: 140, height: 110 },
        createdAt: Date.now() - 10,
        updatedAt: Date.now() - 10,
      },
    ]);

    const workspaceOne = await getNodesQuery._handler(ctx, { workspaceId: 1 });
    expect(workspaceOne).toEqual([
      {
        workspaceId: 1,
        appletId: "applet_hello",
        id: "node_a",
        label: "Workspace 1",
        position: { x: 0, y: 0, z: 0 },
        size: { width: 100, height: 80 },
      },
    ]);

    const workspaceTwo = await getNodesQuery._handler(ctx, { workspaceId: 2 });
    expect(workspaceTwo).toEqual([
      {
        workspaceId: 2,
        appletId: "applet_counter",
        id: "node_b",
        label: "Workspace 2",
        position: { x: 20, y: 20, z: 0 },
        size: { width: 120, height: 90 },
      },
      {
        workspaceId: 2,
        appletId: "applet_hello",
        id: "node_c",
        label: "Workspace 2 again",
        position: { x: 5, y: 15, z: 0 },
        size: { width: 140, height: 110 },
      },
    ]);
  });

  it("updates node position and size for the owner", async () => {
    const created = await createNodeMutation._handler(ctx, {
      workspaceId: 1,
      nodeId: "node_a",
      appletId: "applet_hello",
      label: "Testnode",
      position: { x: 0, y: 0, z: 0 },
      size: { width: 200, height: 120 },
    });
    expect(created.id).toBe("node_a");

    vi.advanceTimersByTime(1_000);

    const updated = await updateNodeMutation._handler(ctx, {
      workspaceId: 1,
      nodeId: "node_a",
      position: { x: 42, y: 64, z: 0 },
      size: { width: 180, height: 140 },
    });

    expect(updated).toEqual({
      workspaceId: 1,
      appletId: "applet_hello",
      id: "node_a",
      label: "Testnode",
      position: { x: 42, y: 64, z: 0 },
      size: { width: 180, height: 140 },
    });

    const stored = db.dump();
    expect(stored[0]).toMatchObject({
      workspaceId: 1,
      position: { x: 42, y: 64, z: 0 },
      size: { width: 180, height: 140 },
      updatedAt: Date.now(),
    });
  });

  it("preserves z-depth when updating size only", async () => {
    await createNodeMutation._handler(ctx, {
      workspaceId: 2,
      nodeId: "node_size_only",
      appletId: "applet_canvas",
      label: "Canvas",
      position: { x: 5, y: 15, z: 4 },
      size: { width: 160, height: 120 },
    });

    vi.advanceTimersByTime(1_000);

    const updated = await updateNodeMutation._handler(ctx, {
      workspaceId: 2,
      nodeId: "node_size_only",
      size: { width: 200, height: 180 },
    });

    expect(updated).toEqual({
      workspaceId: 2,
      appletId: "applet_canvas",
      id: "node_size_only",
      label: "Canvas",
      position: { x: 5, y: 15, z: 4 },
      size: { width: 200, height: 180 },
    });

    const stored = db.dump().find((doc) => doc.nodeId === "node_size_only");
    expect(stored).toMatchObject({
      position: { x: 5, y: 15, z: 4 },
      size: { width: 200, height: 180 },
    });
  });

  it("removes nodes owned by the current subject", async () => {
    await createNodeMutation._handler(ctx, {
      workspaceId: 1,
      nodeId: "node_a",
      appletId: "applet_hello",
      label: "Testnode",
      position: { x: 0, y: 0, z: 0 },
      size: { width: 200, height: 120 },
    });

    const result = await removeNodeMutation._handler(ctx, {
      workspaceId: 1,
      nodeId: "node_a",
    });
    expect(result).toEqual({ ok: true });
    expect(db.dump()).toHaveLength(0);
  });

  it("throws when unauthenticated", async () => {
    getUserIdentity.mockResolvedValueOnce(null);

    await expect(
      createNodeMutation._handler(ctx, {
        workspaceId: 1,
        nodeId: "node_x",
        appletId: "applet_hello",
        label: "Testnode",
        position: { x: 0, y: 0, z: 0 },
        size: { width: 200, height: 120 },
      }),
    ).rejects.toThrowError("Not authenticated");
  });
});

describe("workspace viewports", () => {
  const getUserIdentity = vi.fn<MockAuth["getUserIdentity"]>();
  const auth: MockAuth = {
    getUserIdentity,
  };
  const db = createMockDb();

  const ctx = { auth, db } as const;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-02-01T12:00:00Z"));
    getUserIdentity.mockReset();
    getUserIdentity.mockResolvedValue({ subject: "user_viewport" });
    db.seed([], []);
  });

  it("returns null when no viewport is stored", async () => {
    const result = await getViewportQuery._handler(ctx, {
      workspaceId: 1,
    });

    expect(result).toBeNull();
  });

  it("persists the viewport for the active user", async () => {
    const payload = {
      workspaceId: 2,
      position: { x: 120, y: -45 },
      zoom: 0.75,
    } as const;

    const result = await setViewportMutation._handler(ctx, payload);

    expect(result).toEqual(payload);

    const stored = db.dumpViewports();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      identitySubject: "user_viewport",
      workspaceId: 2,
      position: { x: 120, y: -45 },
      zoom: 0.75,
      updatedAt: Date.now(),
    });
  });

  it("updates the existing viewport instead of inserting a new record", async () => {
    const existingUpdatedAt = Date.now() - 5_000;
    db.seed(
      [],
      [
        {
          _id: "viewport_0",
          identitySubject: "user_viewport",
          workspaceId: 3,
          position: { x: 0, y: 0 },
          zoom: 1,
          updatedAt: existingUpdatedAt,
        },
      ],
    );

    const result = await setViewportMutation._handler(ctx, {
      workspaceId: 3,
      position: { x: 50, y: 75 },
      zoom: 1.25,
    });

    expect(result).toEqual({
      workspaceId: 3,
      position: { x: 50, y: 75 },
      zoom: 1.25,
    });

    const stored = db.dumpViewports();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      identitySubject: "user_viewport",
      workspaceId: 3,
      position: { x: 50, y: 75 },
      zoom: 1.25,
      updatedAt: Date.now(),
    });
  });

  it("only returns the calling user's viewport", async () => {
    db.seed(
      [],
      [
        {
          _id: "viewport_0",
          identitySubject: "user_viewport",
          workspaceId: 1,
          position: { x: 10, y: 20 },
          zoom: 1,
          updatedAt: Date.now(),
        },
        {
          _id: "viewport_1",
          identitySubject: "other_user",
          workspaceId: 1,
          position: { x: 5, y: 5 },
          zoom: 0.5,
          updatedAt: Date.now(),
        },
      ],
    );

    const result = await getViewportQuery._handler(ctx, {
      workspaceId: 1,
    });

    expect(result).toEqual({
      workspaceId: 1,
      position: { x: 10, y: 20 },
      zoom: 1,
    });
  });
});
