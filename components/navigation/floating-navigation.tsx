"use client"

import { usePathname } from "next/navigation"
import { FloatingDock } from "@/components/ui/floating-dock"
import { Store, MessageSquare, User, Plus, ShoppingCart, LogOut } from "lucide-react"
import { useWallet } from "@/components/providers/wallet-provider"

const navigation = [
  {
    title: "Marketplace",
    href: "/dashboard/marketplace",
    icon: <Store className="h-full w-full" />,
  },
  {
    title: "AI Chat",
    href: "/dashboard/ai-chat",
    icon: <MessageSquare className="h-full w-full" />,
  },
  {
    title: "My Account",
    href: "/dashboard/my-account",
    icon: <User className="h-full w-full" />,
  },
  {
    title: "Add IPA",
    href: "/dashboard/add-ipa",
    icon: <Plus className="h-full w-full" />,
  },
  {
    title: "Secondary Market",
    href: "/dashboard/secondary-market",
    icon: <ShoppingCart className="h-full w-full" />,
  },
]

export function FloatingNavigation() {
  const pathname = usePathname()
  const { disconnectWallet } = useWallet()

  const handleLogout = () => {
    disconnectWallet()
    window.location.href = "/"
  }

  const navItems = [
    ...navigation,
    {
      title: "Logout",
      href: "#",
      icon: <LogOut className="h-full w-full" onClick={handleLogout} />,
    },
  ]

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <FloatingDock
        items={navItems}
        desktopClassName="bg-gray-800/90 backdrop-blur-sm border border-orange-500/20"
        mobileClassName="bg-gray-800/90 backdrop-blur-sm border border-orange-500/20"
      />
    </div>
  )
}
