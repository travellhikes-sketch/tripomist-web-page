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
      {/* SVG goo filter */}
      <svg className="absolute h-0 w-0" aria-hidden="true">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 20 -5"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <TooltipProvider delayDuration={100}>
        <div className="relative flex gap-1 px-2 py-1">
          {items.map((item, i) => {
            const isHovered = hovered === i
            const isActive  = item.active ?? false

            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <motion.div
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    animate={{
                      scale: isHovered ? 1.25 : 1,
                      y: isHovered ? -4 : 0,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                    className="relative flex flex-col items-center"
                  >
                    {/* Liquid blob background with goo filter */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        filter: "url(#goo)",
                        background: isActive
                          ? "rgba(99,102,241,0.35)"
                          : "rgba(99,102,241,0.18)",
                      }}
                      animate={{
                        scale: isHovered ? 1.7 : 1,
                        opacity: isHovered ? 1 : isActive ? 0.8 : 0.5,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 25,
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
                          : "bg-white/10 text-white hover:bg-white/20",
                      )}
                      onClick={item.onClick}
                      aria-label={item.label}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <item.icon className="h-4 w-4" />
                    </Button>

                    {/* Active indicator dot */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="mt-1 h-1 w-1 rounded-full bg-primary"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      />
                    )}
                    {!isActive && <div className="mt-1 h-1 w-1" />}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>
    </div>
  )
}
