"use client";

import * as React from "react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "./utils";

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) {
  return (
    <ResizablePrimitive.PanelGroup
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

function ResizablePanel({
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) {
  return (
    <ResizablePrimitive.PanelResizeHandle
      data-slot="resizable-handle"
      className={cn(
        "group/handle relative flex items-center justify-center",
        "w-[4px] transition-all duration-150",
        "before:absolute before:inset-y-0 before:left-1/2 before:-translate-x-1/2",
        "before:w-[1px] before:bg-[var(--border-default)] before:transition-all before:duration-150",
        "hover:before:w-[2px] hover:before:bg-[var(--accent-blue)]",
        "active:before:w-[2px] active:before:bg-[var(--accent-blue)]",
        "data-[resize-handle-state=drag]:before:w-[2px] data-[resize-handle-state=drag]:before:bg-[var(--accent-blue)]",
        "focus-visible:outline-hidden focus-visible:before:bg-[var(--accent-blue)]",
        "data-[panel-group-direction=vertical]:h-[4px] data-[panel-group-direction=vertical]:w-full",
        "data-[panel-group-direction=vertical]:before:inset-x-0 data-[panel-group-direction=vertical]:before:inset-y-auto",
        "data-[panel-group-direction=vertical]:before:h-[1px] data-[panel-group-direction=vertical]:before:w-full",
        "data-[panel-group-direction=vertical]:before:translate-x-0 data-[panel-group-direction=vertical]:before:-translate-y-1/2",
        "data-[panel-group-direction=vertical]:hover:before:h-[2px]",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div
          className="z-10 flex items-center justify-center rounded-full opacity-0 group-hover/handle:opacity-100 transition-opacity duration-150"
          style={{
            width: 6,
            height: 24,
          }}
        >
          {/* Three small dots as grip indicator */}
          <div className="flex flex-col gap-[3px]">
            <div className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: "var(--text-tertiary)" }} />
            <div className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: "var(--text-tertiary)" }} />
            <div className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: "var(--text-tertiary)" }} />
          </div>
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
