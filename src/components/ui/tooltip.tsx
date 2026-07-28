"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-[var(--z-tooltip)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-popover)] px-3 py-1.5 text-sm text-[var(--color-popover-fg)] shadow-[var(--shadow-md)] data-[state=delayed-open]:animate-[fade-in_var(--duration-normal)_var(--ease-out)] data-[state=closed]:animate-[fade-out_var(--duration-normal)_var(--ease-out)] data-[side=bottom]:slide-in-from-top data-[side=top]:slide-in-from-bottom",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
