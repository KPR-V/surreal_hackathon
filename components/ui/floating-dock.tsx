"use client"

import type React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"
import { AnimatePresence, type MotionValue, motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { useRef, useState } from "react"

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: { title: string; icon: React.ReactNode; href: string; onClick?: () => void }[]
  desktopClassName?: string
  mobileClassName?: string
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  )
}

const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href: string; onClick?: () => void }[]
  className?: string
}) => {
  const mouseX = useMotionValue(Number.POSITIVE_INFINITY)
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Number.POSITIVE_INFINITY)}
      className={cn(
        "mx-auto hidden h-16 items-end gap-4 rounded-2xl px-4 pb-3 md:flex relative",
        "before:absolute before:inset-0 before:rounded-2xl before:p-[2px] before:bg-gradient-to-r before:from-pink-500 before:via-blue-500 before:to-pink-500",
        "after:absolute after:inset-[2px] after:rounded-2xl after:bg-zinc-950/90 after:backdrop-blur-sm",
        "shadow-[inset_0_0_20px_rgba(236,72,153,0.2),inset_0_0_40px_rgba(59,130,246,0.2)]",
        className,
      )}
      style={{ 
        backdropFilter: 'blur(8px)',
        boxShadow: 'inset 0 0 15px rgba(236, 72, 153, 0.3), inset 0 0 30px rgba(59, 130, 246, 0.3), 0 0 25px rgba(236, 72, 153, 0.1)'
      }}
    >
      <div className="relative z-10 flex items-end gap-4 w-full h-full">
        {items.map((item) => (
          <IconContainer mouseX={mouseX} key={item.title} {...item} />
        ))}
      </div>
    </motion.div>
  )
}

function IconContainer({
  mouseX,
  title,
  icon,
  href,
  onClick,
}: {
  mouseX: MotionValue
  title: string
  icon: React.ReactNode
  href: string
  onClick?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  const widthTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40])
  const heightTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40])

  const widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20])
  const heightTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20])

  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  })
  const height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  })

  const widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  })
  const heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  })

  const [hovered, setHovered] = useState(false)

  // Determine if this is a center item that should have blue hover
  const isCenterItem = title === "Add IPA" || title === "My Account"
  const hoverColor = isCenterItem ? "hover:bg-blue-500/20" : "hover:bg-pink-500/20"

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      onClick()
    }
    // If no onClick handler, let the Link handle navigation
  }

  const content = (
    <motion.div
      ref={ref}
      style={{ width, height }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      className={`relative flex aspect-square items-center justify-center rounded-full bg-zinc-950 ${hoverColor} transition-colors cursor-pointer`}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 2, x: "-50%" }}
            className="absolute -top-8 left-1/2 w-fit rounded-md border border-zinc-600 bg-zinc-950 px-2 py-0.5 text-xs whitespace-pre text-white"
          >
            {title}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        style={{ width: widthIcon, height: heightIcon }}
        className="flex items-center justify-center text-white"
      >
        {icon}
      </motion.div>
    </motion.div>
  )

  // If there's an onClick handler (like logout), don't use Link
  if (onClick) {
    return content
  }

  // For navigation items, use Next.js Link
  return (
    <Link href={href} passHref>
      {content}
    </Link>
  )
}

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href: string; onClick?: () => void }[]
  className?: string
}) => {
  const [open, setOpen] = useState(false)

  const handleItemClick = (item: { title: string; icon: React.ReactNode; href: string; onClick?: () => void }) => {
    if (item.onClick) {
      item.onClick()
    }
    setOpen(false) // Close the mobile menu after clicking
  }

  return (
    <div className={cn("relative block md:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div layoutId="nav" className="absolute inset-x-0 bottom-full mb-2 flex flex-col gap-2">
            {items.map((item, idx) => {
              const isCenterItem = item.title === "Add IPA" || item.title === "My Account"
              const borderGradient = isCenterItem 
                ? "before:bg-gradient-to-r before:from-blue-500 before:to-blue-600" 
                : "before:bg-gradient-to-r before:from-pink-500 before:to-blue-500"
              
              const itemContent = (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: 10,
                    transition: {
                      delay: idx * 0.05,
                    },
                  }}
                  transition={{ delay: (items.length - 1 - idx) * 0.05 }}
                >
                  <div
                    onClick={() => handleItemClick(item)}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full before:absolute before:inset-0 before:rounded-full before:p-[2px] ${borderGradient} after:absolute after:inset-[2px] after:rounded-full after:bg-zinc-950/90 cursor-pointer`}
                    style={{
                      boxShadow: isCenterItem 
                        ? 'inset 0 0 8px rgba(59, 130, 246, 0.4), 0 0 12px rgba(59, 130, 246, 0.2)'
                        : 'inset 0 0 8px rgba(236, 72, 153, 0.4), 0 0 12px rgba(236, 72, 153, 0.2)'
                    }}
                  >
                    <div className={`relative z-10 h-4 w-4 ${isCenterItem ? 'text-blue-500' : 'text-pink-500'}`}>
                      {item.icon}
                    </div>
                  </div>
                </motion.div>
              )

              // If there's an onClick handler, don't wrap with Link
              if (item.onClick) {
                return itemContent
              }

              // For navigation items, use Next.js Link
              return (
                <Link key={item.title} href={item.href} passHref>
                  {itemContent}
                </Link>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full before:absolute before:inset-0 before:rounded-full before:p-[2px] before:bg-gradient-to-r before:from-pink-500 before:to-blue-500 after:absolute after:inset-[2px] after:rounded-full after:bg-zinc-950/90"
        style={{
          boxShadow: 'inset 0 0 8px rgba(236, 72, 153, 0.4), inset 0 0 8px rgba(59, 130, 246, 0.4), 0 0 12px rgba(236, 72, 153, 0.2)'
        }}
      >
        {open ? <X className="relative z-10 h-5 w-5 text-pink-500" /> : <Menu className="relative z-10 h-5 w-5 text-pink-500" />}
      </button>
    </div>
  )
}
