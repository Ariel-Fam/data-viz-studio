"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  addEdge,
  Background,
  Connection,
  ConnectionMode,
  Controls,
  Edge,
  Handle,
  MiniMap,
  Node,
  NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { toPng } from "html-to-image";
import { useMutation, useQuery } from "convex/react";
import {
  Atom,
  Brain,
  Briefcase,
  Bolt,
  Calendar,
  Cloud,
  Cpu,
  FlaskConical,
  Trash2,
  Flag,
  Gem,
  Globe2,
  Heart,
  Landmark,
  Lightbulb,
  Maximize2,
  Menu,
  Palette,
  Puzzle,
  Minimize2,
  Plus,
  Save,
  FolderOpen,
  Shield,
  Rocket,
  Settings2,
  Star,
  Target,
  Telescope,
  type LucideIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";
import { useAppStore } from "../store/AppContext";
import { api } from "../../convex/_generated/api";
import "@xyflow/react/dist/style.css";

type IconName =
  | "lightbulb"
  | "brain"
  | "rocket"
  | "target"
  | "briefcase"
  | "star"
  | "atom"
  | "flag"
  | "bolt"
  | "cloud"
  | "heart"
  | "shield"
  | "globe"
  | "cpu"
  | "flask"
  | "gem"
  | "calendar"
  | "landmark"
  | "puzzle"
  | "palette"
  | "telescope";

type IdeaNodeData = {
  label: string;
  color: string;
  icon: IconName;
  subIdeas: string[];
};

type IdeaNodeRenderData = IdeaNodeData & {
  onAddSubIdea?: (nodeId: string, value: string) => void;
};

const ICONS: Record<IconName, LucideIcon> = {
  lightbulb: Lightbulb,
  brain: Brain,
  rocket: Rocket,
  target: Target,
  briefcase: Briefcase,
  star: Star,
  atom: Atom,
  flag: Flag,
  bolt: Bolt,
  cloud: Cloud,
  heart: Heart,
  shield: Shield,
  globe: Globe2,
  cpu: Cpu,
  flask: FlaskConical,
  gem: Gem,
  calendar: Calendar,
  landmark: Landmark,
  puzzle: Puzzle,
  palette: Palette,
  telescope: Telescope,
};

const ICON_OPTIONS: Array<{ value: IconName; label: string }> = [
  { value: "lightbulb", label: "Lightbulb" },
  { value: "brain", label: "Brain" },
  { value: "rocket", label: "Rocket" },
  { value: "target", label: "Target" },
  { value: "briefcase", label: "Briefcase" },
  { value: "star", label: "Star" },
  { value: "atom", label: "Atom" },
  { value: "flag", label: "Flag" },
  { value: "bolt", label: "Bolt" },
  { value: "cloud", label: "Cloud" },
  { value: "heart", label: "Heart" },
  { value: "shield", label: "Shield" },
  { value: "globe", label: "Globe" },
  { value: "cpu", label: "CPU" },
  { value: "flask", label: "Flask" },
  { value: "gem", label: "Gem" },
  { value: "calendar", label: "Calendar" },
  { value: "landmark", label: "Landmark" },
  { value: "puzzle", label: "Puzzle" },
  { value: "palette", label: "Palette" },
  { value: "telescope", label: "Telescope" },
];

const COLOR_OPTIONS = [
  "#6d28d9",
  "#0f766e",
  "#1d4ed8",
  "#be123c",
  "#b45309",
  "#15803d",
  "#334155",
  "#7c2d12",
  "#7e22ce",
  "#0e7490",
  "#2563eb",
  "#059669",
  "#ea580c",
  "#dc2626",
  "#4f46e5",
  "#16a34a",
  "#a21caf",
  "#0c4a6e",
  "#4338ca",
  "#be185d",
  "#854d0e",
  "#166534",
  "#475569",
  "#9a3412",
  "#000000",
];
const CONNECTION_ORANGE = "#f97316";

const defaultNodes: Array<Node<IdeaNodeData>> = [
  {
    id: "idea-1",
    type: "ideaNode",
    position: { x: 240, y: 120 },
    data: {
      label: "Main Idea",
      color: "#6d28d9",
      icon: "lightbulb",
      subIdeas: [],
    },
  },
];

const defaultEdges: Edge[] = [];

type FlowCssVariables = CSSProperties & Record<`--${string}`, string>;

function IdeaNode({ id, data, selected }: NodeProps<Node<IdeaNodeRenderData>>) {
  const Icon = ICONS[data.icon] ?? Lightbulb;
  const [menuOpen, setMenuOpen] = useState(false);
  const [subIdeaDraft, setSubIdeaDraft] = useState("");

  return (
    <div
      className="relative min-h-[68px] min-w-[200px] rounded-xl border bg-card px-3 py-3 shadow-sm transition-shadow"
      style={{
        borderColor: data.color,
        boxShadow: selected ? `0 0 0 3px ${data.color}33` : undefined,
      }}
    >
      <button
        type="button"
        className="nodrag nopan absolute right-2 top-2 rounded-md border border-border bg-background p-1 text-muted-foreground transition-colors hover:text-foreground"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          setMenuOpen((prev) => !prev);
        }}
        aria-label="Toggle node menu"
      >
        <Menu className="size-3.5" />
      </button>
      {menuOpen && (
        <div
          className="nodrag nopan absolute right-2 top-10 z-30 w-56 rounded-lg border border-border bg-card p-2 shadow-lg"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <p className="mb-2 text-xs font-medium text-muted-foreground">Add sub idea</p>
          <div className="flex items-center gap-2">
            <input
              value={subIdeaDraft}
              onChange={(event) => setSubIdeaDraft(event.target.value)}
              placeholder="Related idea..."
              className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs"
            />
            <button
              type="button"
              className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => {
                const next = subIdeaDraft.trim();
                if (!next) return;
                data.onAddSubIdea?.(id, next);
                setSubIdeaDraft("");
              }}
              aria-label="Add sub idea"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          {data.subIdeas.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {data.subIdeas.slice(-4).map((item, index) => (
                <span key={`${item}-${index}`} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        className="!h-[18px] !w-[18px] !border-0"
        style={{ background: CONNECTION_ORANGE }}
      />
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="!h-[18px] !w-[18px] !border-0"
        style={{ background: CONNECTION_ORANGE }}
      />
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-muted/40 p-1">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-white"
            style={{ backgroundColor: data.color }}
          >
            <Icon className="size-4" />
          </div>
        </div>
        <span className="line-clamp-2 text-sm font-medium leading-snug">{data.label}</span>
      </div>
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="!h-[18px] !w-[18px] !border-0"
        style={{ background: CONNECTION_ORANGE }}
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="!h-[18px] !w-[18px] !border-0"
        style={{ background: CONNECTION_ORANGE }}
      />
    </div>
  );
}

export default function MindMap() {
  const flowContainerRef = useRef<HTMLDivElement | null>(null);
  const fullscreenRef = useRef<HTMLDivElement | null>(null);
  const { theme } = useAppStore();
  const savedMindMaps = useQuery(api.mindMaps.listMyMindMaps);
  const saveMindMapMutation = useMutation(api.mindMaps.saveMindMap);
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(defaultNodes[0]?.id ?? null);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFullscreenPanelOpen, setIsFullscreenPanelOpen] = useState(false);
  const [currentMapId, setCurrentMapId] = useState<string | null>(null);
  const [currentMapName, setCurrentMapName] = useState("Unsaved map");
  const [saveMapDialogOpen, setSaveMapDialogOpen] = useState(false);
  const [saveMapName, setSaveMapName] = useState("");
  const [savedMapsOpen, setSavedMapsOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const hydratedFromServerRef = useRef(false);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hydrateNodes = useCallback(
    (incoming: Array<Node<IdeaNodeData>>) =>
      incoming.map((node) => ({
        ...node,
        data: {
          ...node.data,
          subIdeas: node.data.subIdeas ?? [],
        },
      })),
    [],
  );

  const loadMap = useCallback(
    (map: {
      id: string;
      name: string;
      nodes: Array<Node<IdeaNodeData>>;
      edges: Edge[];
    }) => {
      const hydratedNodes = hydrateNodes(map.nodes);
      setNodes(hydratedNodes.length > 0 ? hydratedNodes : defaultNodes);
      setEdges(
        map.edges.map((edge) => ({
          ...edge,
          style: { ...edge.style, strokeWidth: 2, stroke: CONNECTION_ORANGE },
        })),
      );
      setCurrentMapId(map.id);
      setCurrentMapName(map.name);
      setSelectedNodeId((hydratedNodes.length > 0 ? hydratedNodes : defaultNodes)[0]?.id ?? null);
    },
    [hydrateNodes, setEdges, setNodes],
  );

  useEffect(() => {
    if (savedMindMaps === undefined || hydratedFromServerRef.current) return;

    hydratedFromServerRef.current = true;
    if (savedMindMaps.length === 0) {
      setCurrentMapId(null);
      setCurrentMapName("Unsaved map");
      return;
    }

    const mostRecent = savedMindMaps[0] as {
      id: string;
      name: string;
      nodes: Array<Node<IdeaNodeData>>;
      edges: Edge[];
    };
    loadMap(mostRecent);
  }, [savedMindMaps, loadMap]);

  useEffect(() => {
    if (!hydratedFromServerRef.current || !currentMapId) return;
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }
    saveDebounceRef.current = setTimeout(() => {
      void saveMindMapMutation({
        mapId: currentMapId,
        name: currentMapName,
        nodes,
        edges,
      });
    }, 700);
    return () => {
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
      }
    };
  }, [currentMapId, currentMapName, edges, nodes, saveMindMapMutation]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const active = document.fullscreenElement === fullscreenRef.current;
      setIsFullscreen(active);
      if (!active) {
        setIsFullscreenPanelOpen(false);
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const nodeTypes = useMemo(() => ({ ideaNode: IdeaNode }), []);
  const controlsStyle = useMemo<FlowCssVariables | undefined>(
    () =>
      theme === "dark"
        ? {
            "--xy-controls-button-background-color": "#020617",
            "--xy-controls-button-background-color-hover": "#0f172a",
            "--xy-controls-button-color": "#f8fafc",
            "--xy-controls-button-color-hover": "#ffffff",
            "--xy-controls-button-border-color": "#64748b",
            boxShadow: "0 6px 18px rgba(2, 6, 23, 0.6)",
          }
        : undefined,
    [theme],
  );
  const addSubIdeaToNode = useCallback(
    (nodeId: string, value: string) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  subIdeas: [...(node.data.subIdeas ?? []), value],
                },
              }
            : node,
        ),
      );
    },
    [setNodes],
  );
  const displayNodes = useMemo<Array<Node<IdeaNodeRenderData>>>(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          subIdeas: node.data.subIdeas ?? [],
          onAddSubIdea: addSubIdeaToNode,
        },
      })),
    [nodes, addSubIdeaToNode],
  );

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );
  const connectedNodeLabels = useMemo(() => {
    if (!selectedNodeId) return [];
    const linkedNodeIds = new Set<string>();
    edges.forEach((edge) => {
      if (edge.source === selectedNodeId) linkedNodeIds.add(edge.target);
      if (edge.target === selectedNodeId) linkedNodeIds.add(edge.source);
    });
    return nodes
      .filter((node) => linkedNodeIds.has(node.id))
      .map((node) => node.data.label);
  }, [edges, nodes, selectedNodeId]);

  const addIdeaNode = useCallback(() => {
    const id = `idea-${Date.now()}`;
    const newNode: Node<IdeaNodeData> = {
      id,
      type: "ideaNode",
      position: { x: 120 + (nodes.length % 4) * 180, y: 120 + Math.floor(nodes.length / 4) * 120 },
      data: {
        label: `Idea ${nodes.length + 1}`,
        color: COLOR_OPTIONS[nodes.length % COLOR_OPTIONS.length],
        icon: "lightbulb",
        subIdeas: [],
      },
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(id);
    setMobileSettingsOpen(true);
  }, [nodes.length, setNodes]);

  const onConnect = useCallback(
    (params: Edge | Connection) =>
      setEdges((currentEdges) =>
        addEdge(
          {
            ...params,
            id: `edge-${Date.now()}`,
            animated: false,
            type: "smoothstep",
            style: { strokeWidth: 2, stroke: CONNECTION_ORANGE },
          } as Edge,
          currentEdges,
        ),
      ),
    [setEdges],
  );
  const disconnectSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    setEdges((currentEdges) =>
      currentEdges.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId),
    );
  }, [selectedNodeId, setEdges]);
  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((currentNodes) => {
      const remainingNodes = currentNodes.filter((node) => node.id !== selectedNodeId);
      setSelectedNodeId(remainingNodes[0]?.id ?? null);
      return remainingNodes;
    });
    setEdges((currentEdges) =>
      currentEdges.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId),
    );
  }, [selectedNodeId, setEdges, setNodes]);

  const updateSelectedNode = useCallback(
    (patch: Partial<IdeaNodeData>) => {
      if (!selectedNodeId) return;
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...patch,
                },
              }
            : node,
        ),
      );
    },
    [selectedNodeId, setNodes],
  );

  const exportAsPng = useCallback(async () => {
    const target = flowContainerRef.current?.querySelector(".react-flow__viewport") as HTMLElement | null;
    if (!target) return;

    const dataUrl = await toPng(target, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });

    const link = document.createElement("a");
    link.download = `mind-map-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = dataUrl;
    link.click();
  }, []);
  const resetCanvasState = useCallback(() => {
    setNodes(defaultNodes);
    setEdges(defaultEdges);
    setSelectedNodeId(defaultNodes[0]?.id ?? null);
  }, [setEdges, setNodes]);

  const resetCanvasOnly = useCallback(() => {
    // Detach from saved map so autosave does not overwrite stored version.
    setCurrentMapId(null);
    setCurrentMapName("Unsaved map");
    resetCanvasState();
    setResetDialogOpen(false);
  }, [resetCanvasState]);

  const resetSavedMapToo = useCallback(async () => {
    if (!currentMapId) return;
    resetCanvasState();
    await saveMindMapMutation({
      mapId: currentMapId,
      name: currentMapName,
      nodes: defaultNodes,
      edges: defaultEdges,
    });
    setResetDialogOpen(false);
  }, [currentMapId, currentMapName, resetCanvasState, saveMindMapMutation]);

  const handleResetMapClick = useCallback(() => {
    if (currentMapId) {
      setResetDialogOpen(true);
      return;
    }
    resetCanvasState();
  }, [currentMapId, resetCanvasState]);

  const saveCurrentMap = useCallback(async () => {
    const finalName = saveMapName.trim() || "Untitled map";
    const savedId = await saveMindMapMutation({
      mapId: currentMapId ?? undefined,
      name: finalName,
      nodes,
      edges,
    });
    setCurrentMapId(savedId);
    setCurrentMapName(finalName);
    setSaveMapDialogOpen(false);
  }, [currentMapId, edges, nodes, saveMapName, saveMindMapMutation]);

  const openSavedMap = useCallback(
    (map: {
      id: string;
      name: string;
      nodes: Array<Node<IdeaNodeData>>;
      edges: Edge[];
    }) => {
      loadMap(map);
      setSavedMapsOpen(false);
    },
    [loadMap],
  );

  const toggleFullscreen = useCallback(async () => {
    if (!fullscreenRef.current) return;
    if (document.fullscreenElement === fullscreenRef.current) {
      await document.exitFullscreen();
      return;
    }
    setIsFullscreenPanelOpen(false);
    await fullscreenRef.current.requestFullscreen();
  }, []);

  const renderSettingsContent = (idPrefix: "desktop" | "mobile") => (
    <>
      <h2 className="text-sm font-semibold">Idea settings</h2>
      <div className="mt-3 rounded-xl border border-border bg-background/50 p-2">
        <MiniMap
          pannable
          zoomable
          nodeColor={(node) => (node.data as IdeaNodeData).color}
          nodeStrokeWidth={3}
          nodeStrokeColor={theme === "dark" ? "#f8fafc" : "#1e293b"}
          bgColor={theme === "dark" ? "#0f172a" : "#eef2ff"}
          maskColor={theme === "dark" ? "rgb(15 23 42 / 0.35)" : "rgb(148 163 184 / 0.2)"}
          className="!relative !left-0 !top-0 !h-40 !w-full !rounded-lg !border !border-slate-700/70 dark:!shadow-[inset_0_0_0_1px_rgba(248,250,252,0.08)]"
        />
      </div>
      {!selectedNode && <p className="mt-2 text-sm text-muted-foreground">Select a node to edit its content, color, and icon.</p>}

      {selectedNode && (
        <div className="mt-3 space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Connected ideas</span>
            {connectedNodeLabels.length > 0 ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {connectedNodeLabels.map((label, index) => (
                    <Badge key={`${label}-${index}`} variant="secondary" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                </div>
                <Button type="button" size="sm" variant="outline" onClick={disconnectSelectedNode}>
                  Disconnect all from this node
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">This node is not connected to any other ideas yet.</p>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Sub ideas</span>
            {selectedNode.data.subIdeas.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedNode.data.subIdeas.map((subIdea, index) => (
                  <Badge key={`${subIdea}-${index}`} variant="outline" className="text-xs">
                    {subIdea}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No sub ideas yet. Use the node menu (+) to add one.</p>
            )}
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-medium text-muted-foreground">Danger zone</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-1 gap-1.5 text-destructive hover:text-destructive"
              onClick={deleteSelectedNode}
            >
              <Trash2 className="size-3.5" />
              Delete idea
            </Button>
          </div>

          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-idea-label`} className="text-xs font-medium text-muted-foreground">
              Label
            </label>
            <Input
              id={`${idPrefix}-idea-label`}
              value={selectedNode.data.label}
              onChange={(event) => updateSelectedNode({ label: event.target.value })}
              placeholder="Idea title"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor={`${idPrefix}-idea-icon`} className="text-xs font-medium text-muted-foreground">
              Icon
            </label>
            <select
              id={`${idPrefix}-idea-icon`}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={selectedNode.data.icon}
              onChange={(event) => updateSelectedNode({ icon: event.target.value as IconName })}
            >
              {ICON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Color</span>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Set node color to ${color}`}
                  onClick={() => updateSelectedNode({ color })}
                  className="h-8 rounded-md border border-border transition-transform hover:scale-105"
                  style={{
                    backgroundColor: color,
                    outline: selectedNode.data.color === color ? "2px solid #0f172a" : undefined,
                    outlineOffset: selectedNode.data.color === color ? "1px" : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div
      ref={fullscreenRef}
      className={
        isFullscreen
          ? "space-y-3 bg-background p-3 md:p-4"
          : "space-y-3"
      }
    >
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
        <Button size="sm" onClick={addIdeaNode}>
          Add idea
        </Button>
        <Button size="sm" variant="outline" onClick={exportAsPng}>
          Export PNG
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => {
            const suggested =
              currentMapName === "Unsaved map" ? `Mind Map ${new Date().toLocaleDateString()}` : currentMapName;
            setSaveMapName(suggested);
            setSaveMapDialogOpen(true);
          }}
        >
          <Save className="size-3.5" />
          Save map
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setSavedMapsOpen(true)}>
          <FolderOpen className="size-3.5" />
          Saved maps
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          {isFullscreen ? "Exit full screen" : "Full screen"}
        </Button>
        {isFullscreen && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setIsFullscreenPanelOpen((prev) => !prev)}
          >
            <Settings2 className="size-3.5" />
            {isFullscreenPanelOpen ? "Hide settings" : "Show settings"}
          </Button>
        )}
        <Button size="sm" variant="outline" className="gap-1.5 lg:hidden" onClick={() => setMobileSettingsOpen(true)}>
          <Settings2 className="size-3.5" />
          Idea settings
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleResetMapClick}
        >
          Reset map
        </Button>
        <Badge
          variant="secondary"
          className="max-w-full !shrink !whitespace-normal text-left leading-snug sm:w-auto"
        >
          Drag to move, connect from any handle, click line to disconnect
        </Badge>
        <Badge variant="outline">{currentMapName}</Badge>
      </div>

      <ReactFlowProvider>
        <div
          className={`grid gap-3 ${
            isFullscreen
              ? isFullscreenPanelOpen
                ? "grid-cols-1 lg:grid-cols-[1fr_320px]"
                : "grid-cols-1"
              : "lg:grid-cols-[1fr_290px]"
          }`}
        >
          <div
            ref={flowContainerRef}
            className={`overflow-hidden rounded-2xl border border-border bg-card ${
              isFullscreen ? "h-[calc(100vh-6.5rem)] min-h-0" : "h-[calc(100vh-14rem)] min-h-[560px]"
            }`}
          >
            <ReactFlow
              nodes={displayNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onEdgeClick={(_, edge) => {
                setEdges((currentEdges) => currentEdges.filter((item) => item.id !== edge.id));
              }}
              onConnect={onConnect}
              connectionMode={ConnectionMode.Loose}
              nodeTypes={nodeTypes}
              fitView
              onNodeClick={(_, node) => {
                setSelectedNodeId(node.id);
                if (isFullscreen) {
                  setIsFullscreenPanelOpen(true);
                }
                setMobileSettingsOpen(true);
              }}
              onPaneClick={() => setSelectedNodeId(null)}
            >
              <Background gap={20} size={1.2} />
              <Controls
                style={controlsStyle}
                className={theme === "dark" ? "[&_.react-flow__controls-button]:!border-slate-500/90" : undefined}
              />
            </ReactFlow>
          </div>

          <div
            className={`hidden overflow-y-auto rounded-2xl border border-border bg-card p-4 lg:block ${
              isFullscreen ? "h-[calc(100vh-6.5rem)]" : "max-h-[calc(100vh-14rem)]"
            } ${
              isFullscreen && !isFullscreenPanelOpen ? "!hidden" : ""
            }`}
          >
            {renderSettingsContent("desktop")}
          </div>
        </div>

        <Sheet open={mobileSettingsOpen} onOpenChange={setMobileSettingsOpen}>
          <SheetContent side="bottom" className="h-[82vh] overflow-y-auto rounded-t-2xl p-0 lg:hidden">
            <SheetHeader>
              <SheetTitle>Idea settings</SheetTitle>
              <SheetDescription>Edit node text, icon, and color from this panel.</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-6">{renderSettingsContent("mobile")}</div>
          </SheetContent>
        </Sheet>

        <Dialog open={savedMapsOpen} onOpenChange={setSavedMapsOpen}>
          <DialogContent className="sm:max-w-2xl" container={isFullscreen ? fullscreenRef.current : undefined}>
            <DialogHeader>
              <DialogTitle>Saved mind maps</DialogTitle>
              <DialogDescription>Select a saved map to open it in the canvas.</DialogDescription>
            </DialogHeader>

            <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {(savedMindMaps ?? []).length === 0 && (
                <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                  No saved maps yet. Click <span className="font-medium text-foreground">Save map</span> to create your first one.
                </div>
              )}

              {(savedMindMaps ?? []).map((map) => {
                const typedMap = map as {
                  id: string;
                  name: string;
                  nodes: Array<Node<IdeaNodeData>>;
                  edges: Edge[];
                  updatedAt: string;
                };
                const isActive = currentMapId === typedMap.id;
                return (
                  <button
                    key={typedMap.id}
                    type="button"
                    onClick={() => openSavedMap(typedMap)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      isActive
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{typedMap.name}</span>
                      {isActive && <Badge variant="secondary">Current</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {typedMap.nodes.length} ideas • {typedMap.edges.length} connections • Updated{" "}
                      {new Date(typedMap.updatedAt).toLocaleString()}
                    </p>
                  </button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={saveMapDialogOpen} onOpenChange={setSaveMapDialogOpen}>
          <DialogContent className="sm:max-w-md" container={isFullscreen ? fullscreenRef.current : undefined}>
            <DialogHeader>
              <DialogTitle>Save map as</DialogTitle>
              <DialogDescription>Choose a name for this mind map.</DialogDescription>
            </DialogHeader>
            <Input value={saveMapName} onChange={(event) => setSaveMapName(event.target.value)} placeholder="Untitled map" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveMapDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => void saveCurrentMap()}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <DialogContent className="sm:max-w-lg" container={isFullscreen ? fullscreenRef.current : undefined}>
            <DialogHeader>
              <DialogTitle>Reset map</DialogTitle>
              <DialogDescription>
                This map is currently linked to a saved file. Choose how you want to reset.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3 text-sm">
              <p>
                <span className="font-medium">Current saved map:</span> {currentMapName}
              </p>
              <p className="text-muted-foreground">
                Resetting canvas only keeps the saved version intact. Resetting saved file also updates the saved map to an empty canvas.
              </p>
            </div>
            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={resetCanvasOnly}>
                Reset canvas only
              </Button>
              <Button variant="destructive" onClick={() => void resetSavedMapToo()}>
                Reset saved file too
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ReactFlowProvider>
    </div>
  );
}
