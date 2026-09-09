"use client";

import { useState, useRef, useCallback } from "react";
import { Archive, Trash2, CheckCircle, Reply, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
  action: () => void;
}

interface SwipeableEmailItemProps {
  children: React.ReactNode;
  onArchive?: () => void;
  onDelete?: () => void;
  onMarkRead?: () => void;
  onReply?: () => void;
  onOpen?: () => void;
}

const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 72;

export function SwipeableEmailItem({
  children,
  onArchive,
  onDelete,
  onMarkRead,
  onReply,
  onOpen,
}: SwipeableEmailItemProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const leftActions: SwipeAction[] = [
    {
      id: "archive",
      icon: <Archive className="h-5 w-5" />,
      label: "Archiver",
      color: "text-white",
      bgColor: "bg-[#C49B66]",
      action: () => {
        onArchive?.();
        setIsOpen(false);
        setSwipeX(0);
      },
    },
    {
      id: "delete",
      icon: <Trash2 className="h-5 w-5" />,
      label: "Supprimer",
      color: "text-white",
      bgColor: "bg-rose-500",
      action: () => {
        onDelete?.();
        setIsOpen(false);
        setSwipeX(0);
      },
    },
    {
      id: "read",
      icon: <CheckCircle className="h-5 w-5" />,
      label: "Marquer lu",
      color: "text-white",
      bgColor: "bg-emerald-500",
      action: () => {
        onMarkRead?.();
        setIsOpen(false);
        setSwipeX(0);
      },
    },
  ];

  const rightActions: SwipeAction[] = [
    {
      id: "reply",
      icon: <Reply className="h-5 w-5" />,
      label: "Répondre",
      color: "text-white",
      bgColor: "bg-blue-500",
      action: () => {
        onReply?.();
        setIsOpen(false);
        setSwipeX(0);
      },
    },
  ];

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX.current;
    const diffY = currentY - startY.current;

    // If scrolling vertically, don't swipe
    if (Math.abs(diffY) > Math.abs(diffX)) {
      return;
    }

    // Prevent swipe if already open in opposite direction
    if (isOpen && swipeX > 0 && diffX < 0) return;
    if (isOpen && swipeX < 0 && diffX > 0) return;

    setSwipeX(diffX);
  }, [isOpen, swipeX]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;

    if (Math.abs(swipeX) < SWIPE_THRESHOLD) {
      setSwipeX(0);
      setIsOpen(false);
      return;
    }

    if (swipeX > 0) {
      // Swiped right - show left actions
      const numActions = Math.min(leftActions.length, Math.floor(swipeX / ACTION_WIDTH));
      setSwipeX(numActions * ACTION_WIDTH);
      setIsOpen(true);
    } else {
      // Swiped left - show right actions
      const numActions = Math.min(rightActions.length, Math.floor(Math.abs(swipeX) / ACTION_WIDTH));
      setSwipeX(-numActions * ACTION_WIDTH);
      setIsOpen(true);
    }
  }, [swipeX, leftActions.length, rightActions.length]);

  const handleClick = useCallback(() => {
    if (isOpen) {
      setSwipeX(0);
      setIsOpen(false);
      return;
    }
    onOpen?.();
  }, [isOpen, onOpen]);

  const closeSwipe = useCallback(() => {
    setSwipeX(0);
    setIsOpen(false);
  }, []);

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Left actions (revealed on swipe right) */}
      <div className="absolute inset-y-0 left-0 flex items-stretch">
        {leftActions.map((action, index) => (
          <button
            key={action.id}
            onClick={action.action}
            className={cn(
              "flex flex-col items-center justify-center transition-all",
              action.bgColor,
              action.color,
            )}
            style={{
              width: ACTION_WIDTH,
              transform: swipeX > index * ACTION_WIDTH ? "translateX(0)" : "translateX(-100%)",
            }}
          >
            {action.icon}
            <span className="text-[10px] mt-1">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Right actions (revealed on swipe left) */}
      <div className="absolute inset-y-0 right-0 flex items-stretch">
        {rightActions.map((action, idx) => (
          <button
            key={action.id}
            onClick={action.action}
            className={cn(
              "flex flex-col items-center justify-center transition-all",
              action.bgColor,
              action.color,
            )}
            style={{
              width: ACTION_WIDTH,
              transform: swipeX < -idx * ACTION_WIDTH ? "translateX(0)" : "translateX(100%)",
            }}
          >
            {action.icon}
            <span className="text-[10px] mt-1">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Main content */}
      <div
        className="relative bg-[#09090B] transition-transform"
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        {children}
      </div>

      {/* Swipe indicator */}
      {isOpen && (
        <button
          onClick={closeSwipe}
          className="absolute top-1/2 -translate-y-1/2 left-2 p-2 rounded-full bg-black/60 text-white z-10"
          aria-label="Fermir les actions"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default SwipeableEmailItem;
