"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { motion } from "framer-motion"

interface DockItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick?: () => void
  active?: boolean
  badge?: number
}

interface GooeyDockProps {
  className?: string
  items: DockItem[]
}

export default function GooeyDock({ items, className }: GooeyDockProps) {
  const [hovered, setHovered] = React.useState<number | null>(null)

  return (
    <div
      className={cn("flex items-center justify-center w-full py-2", className)}
    >
        <div className="relative flex gap-1 px-2 py-1">
          {items.map((item, i) => {
            const isHovered = hovered === i
            const isActive  = item.active ?? false

            return (

                  <motion.div
                    key={item.label}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    animate={{
                      y: isHovered ? -4 : 0,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                    className="relative flex flex-col items-center"
                  >
                    {/* Background hover/active indicator without the huge blur/scale */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: isActive
                          ? "rgba(99,102,241,0.15)"
                          : "rgba(99,102,241,0)",
                      }}
                      animate={{
                        opacity: isHovered ? 1 : isActive ? 1 : 0,
                        background: isHovered ? "rgba(99,102,241,0.1)" : isActive ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0)"
                      }}
                      transition={{
                        duration: 0.2
                      }}
                    />

                    {/* Icon button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "relative rounded-full backdrop-blur-xl h-9 w-9",
                        isActive
                          ? "bg-primary/20 text-primary"
                          : "bg-black/5 text-gray-800 hover:bg-black/10 hover:text-black",
                      )}
                      onClick={item.onClick}
                      aria-label={item.label}
                      aria-current={isActive ? "page" : undefined}
                    >
                                            <item.icon className="h-4 w-4" />
                      {item.badge ? (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white">
                          {item.badge}
                        </div>
                      ) : null}
                    </Button>

                    {/* Label below icon */}
                    <span className={cn("text-[7.5px] tracking-tight font-medium leading-none mt-1 text-center truncate w-full max-w-[44px]", isActive ? "text-primary" : "text-gray-600 font-normal")}>
                      {item.label}
                    </span>

                    {/* Active indicator dot */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="mt-0.5 h-1 w-1 rounded-full bg-primary"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      />
                    )}
                    {!isActive && <div className="mt-0.5 h-1 w-1" />}
                  </motion.div>
            )
          })}
        </div>
    </div>
  )
}
