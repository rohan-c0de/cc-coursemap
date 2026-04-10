"use client";

import { Fragment, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChainNode {
  course: string;
  text: string;
  children: ChainNode[];
}

// ---------------------------------------------------------------------------
// Tree utilities
// ---------------------------------------------------------------------------

function isLinear(node: ChainNode): boolean {
  if (node.children.length > 1) return false;
  if (node.children.length === 0) return true;
  return isLinear(node.children[0]);
}

function collectLinearPath(node: ChainNode): ChainNode[] {
  const result: ChainNode[] = [node];
  let cur = node;
  while (cur.children.length === 1) {
    cur = cur.children[0];
    result.push(cur);
  }
  return result.reverse();
}

function extractAllPaths(node: ChainNode): ChainNode[][] {
  if (node.children.length === 0) return [[node]];
  const paths: ChainNode[][] = [];
  for (const child of node.children) {
    for (const sub of extractAllPaths(child)) {
      paths.push([...sub, node]);
    }
  }
  return paths;
}

function maxDepth(node: ChainNode): number {
  if (node.children.length === 0) return 0;
  return 1 + Math.max(...node.children.map(maxDepth));
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type NodeVariant = "target" | "prereq" | "leaf";

function NodeCard({
  node,
  variant,
  step,
}: {
  node: ChainNode;
  variant: NodeVariant;
  step?: number;
}) {
  const [hover, setHover] = useState(false);

  const styles: Record<NodeVariant, string> = {
    target: `
      bg-gradient-to-br from-amber-50 to-amber-100
      dark:from-amber-900/60 dark:to-amber-800/40
      border-amber-300 dark:border-amber-500/70
      text-amber-900 dark:text-amber-100
      shadow-amber-200/50 dark:shadow-amber-900/30
      shadow-md
    `,
    prereq: `
      bg-white/90 dark:bg-slate-700/60
      border-slate-200 dark:border-slate-600/80
      text-slate-700 dark:text-slate-200
      shadow-sm
      backdrop-blur-sm
    `,
    leaf: `
      bg-gradient-to-br from-emerald-50 to-teal-50
      dark:from-emerald-900/40 dark:to-teal-900/30
      border-emerald-300 dark:border-emerald-600/70
      text-emerald-800 dark:text-emerald-200
      shadow-emerald-200/40 dark:shadow-emerald-900/20
      shadow-md
    `,
  };

  const stepStyles: Record<NodeVariant, string> = {
    target: "bg-amber-400/80 dark:bg-amber-500/60 text-white dark:text-amber-100",
    prereq: "bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300",
    leaf: "bg-emerald-400/70 dark:bg-emerald-500/50 text-white dark:text-emerald-100",
  };

  return (
    <div
      className="relative group"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className={`
          relative flex items-center gap-1.5
          rounded-xl border px-3 py-1.5
          text-[11px] font-bold tracking-wide whitespace-nowrap shrink-0
          transition-all duration-200
          hover:scale-[1.04] hover:-translate-y-px
          cursor-default
          ${styles[variant]}
        `}
      >
        {step !== undefined && (
          <span
            className={`
              inline-flex items-center justify-center
              w-[16px] h-[16px] rounded-full text-[8px] font-black leading-none
              ${stepStyles[variant]}
            `}
          >
            {step}
          </span>
        )}
        {node.course}
      </div>

      {/* Tooltip */}
      {hover && node.text && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5
            px-3 py-2 rounded-xl
            bg-slate-900/95 dark:bg-slate-700/95
            backdrop-blur-md
            text-white text-[10px] leading-relaxed
            max-w-[240px] whitespace-normal
            shadow-2xl shadow-black/20
            z-50 pointer-events-none
            animate-in fade-in-0 zoom-in-95 duration-150"
        >
          <span className="font-bold text-white/90">{node.course}</span>
          <br />
          <span className="text-slate-300 dark:text-slate-300">
            {node.text}
          </span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900/95 dark:border-t-slate-700/95" />
        </div>
      )}
    </div>
  );
}

/** Animated flowing connector arrow between nodes */
function Connector({ animate = true }: { animate?: boolean }) {
  return (
    <div className="flex items-center shrink-0 mx-1 relative">
      {/* Track line */}
      <div className="w-6 h-[2px] rounded-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 overflow-hidden relative">
        {/* Animated flow pulse */}
        {animate && (
          <div
            className="absolute inset-y-0 w-3 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent dark:via-amber-500/40 animate-[flow_2s_ease-in-out_infinite]"
          />
        )}
      </div>
      {/* Arrow head */}
      <svg width="6" height="10" viewBox="0 0 6 10" className="shrink-0 -ml-0.5">
        <polygon
          points="0,1 5,5 0,9"
          className="fill-slate-300 dark:fill-slate-500"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** "or" pill between alternative paths */
function OrDivider() {
  return (
    <div className="flex items-center gap-2 py-1 px-1">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />
      <span
        className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-300 dark:text-slate-600 select-none"
      >
        or
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />
    </div>
  );
}

/** Curved SVG merge bracket connecting paths to the target */
function MergeBracket({ pathCount }: { pathCount: number }) {
  // Height of each path row + or-divider spacing
  const rowH = 32;
  const orH = 24;
  const totalH = pathCount * rowH + (pathCount - 1) * orH;
  const midY = totalH / 2;
  const w = 28;

  return (
    <svg
      width={w}
      height={totalH}
      viewBox={`0 0 ${w} ${totalH}`}
      className="shrink-0 mx-0.5"
      style={{ minHeight: totalH }}
    >
      {/* Curved lines from each path center to the merge point */}
      {Array.from({ length: pathCount }, (_, i) => {
        const y = i * (rowH + orH) + rowH / 2;
        const cp1x = w * 0.5;
        return (
          <path
            key={i}
            d={`M 2,${y} C ${cp1x},${y} ${cp1x},${midY} ${w - 8},${midY}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-slate-300 dark:text-slate-600"
            strokeLinecap="round"
          />
        );
      })}
      {/* Arrow tip */}
      <polygon
        points={`${w - 8},${midY - 3} ${w - 2},${midY} ${w - 8},${midY + 3}`}
        className="fill-slate-300 dark:fill-slate-500"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Layouts
// ---------------------------------------------------------------------------

function LinearFlow({ path }: { path: ChainNode[] }) {
  return (
    <div className="flex items-center">
      {path.map((node, i) => {
        const isLast = i === path.length - 1;
        const isFirst = i === 0;
        return (
          <Fragment key={`${node.course}-${i}`}>
            <NodeCard
              node={node}
              variant={isLast ? "target" : isFirst ? "leaf" : "prereq"}
              step={i + 1}
            />
            {!isLast && <Connector />}
          </Fragment>
        );
      })}
    </div>
  );
}

function BranchingFlow({ node }: { node: ChainNode }) {
  let paths: ChainNode[][] = [];
  for (const child of node.children) {
    paths.push(...extractAllPaths(child));
  }
  const capped = paths.length > 8;
  if (capped) paths = paths.slice(0, 8);

  return (
    <div className="flex items-center">
      {/* Alternative paths */}
      <div className="flex flex-col">
        {paths.map((path, i) => (
          <Fragment key={i}>
            {i > 0 && <OrDivider />}
            <div className="flex items-center">
              {path.map((n, j) => {
                const isFirst = j === 0;
                const isLast = j === path.length - 1;
                return (
                  <Fragment key={`${n.course}-${j}`}>
                    <NodeCard
                      node={n}
                      variant={
                        isFirst && n.children.length === 0 ? "leaf" : "prereq"
                      }
                    />
                    {!isLast && <Connector />}
                  </Fragment>
                );
              })}
            </div>
          </Fragment>
        ))}
        {capped && (
          <p className="text-[9px] text-slate-400 dark:text-slate-500 pl-2 pt-1 italic">
            + {paths.length - 8} more paths&hellip;
          </p>
        )}
      </div>

      {/* Merge bracket → target */}
      {paths.length > 1 ? (
        <MergeBracket pathCount={paths.length} />
      ) : (
        <Connector />
      )}
      <NodeCard node={node} variant="target" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// CSS keyframes (injected via style tag for the flow animation)
// ---------------------------------------------------------------------------

function FlowStyles() {
  return (
    <style>{`
      @keyframes flow {
        0%   { transform: translateX(-12px); opacity: 0; }
        50%  { opacity: 1; }
        100% { transform: translateX(24px); opacity: 0; }
      }
    `}</style>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export default function PrereqFlowChart({ tree }: { tree: ChainNode }) {
  if (tree.children.length === 0) return null;

  const depth = maxDepth(tree);
  const linear = isLinear(tree);
  const path = linear ? collectLinearPath(tree) : null;

  return (
    <div className="space-y-3">
      <FlowStyles />

      {/* Header stats */}
      <div className="flex items-center gap-2.5 text-[10px] font-semibold">
        <span className="inline-flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
            />
          </svg>
          {linear
            ? `${depth + 1} courses in sequence`
            : `${depth} ${depth === 1 ? "level" : "levels"} deep`}
        </span>
        {!linear && (
          <span className="inline-flex items-center gap-1 text-slate-300 dark:text-slate-600">
            <span className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
            <span className="text-slate-400 dark:text-slate-500">
              {tree.children.length} {tree.children.length === 1 ? "path" : "paths"}
            </span>
          </span>
        )}
      </div>

      {/* Flowchart */}
      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        {linear && path ? (
          <LinearFlow path={path} />
        ) : (
          <BranchingFlow node={tree} />
        )}
      </div>
    </div>
  );
}
