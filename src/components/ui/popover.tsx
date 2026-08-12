"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "data-[side=bottom]:slide-in-from-top data-[side=top]:slide-in-from-bottom data-[side=left]:slide-in-from-right data-[side=right]:slide-in-from-left z-[var(--z-popover)] w-72 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-popover)] p-4 text-[var(--color-popover-fg)] shadow-[var(--shadow-lg)] outline-none data-[state=closed]:animate-[fade-out_var(--duration-normal)_var(--ease-out)] data-[state=open]:animate-[fade-in_var(--duration-normal)_var(--ease-out)]",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
