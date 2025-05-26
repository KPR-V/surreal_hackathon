"use client"

import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { FloatingDock } from "@/components/ui/floating-dock"
import { Store, MessageSquare, User, Plus, ShoppingCart, LogOut } from "lucide-react"
import { useWallet } from "@/components/providers/wallet-provider"
import { motion, AnimatePresence } from "framer-motion"

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
	const [isVisible, setIsVisible] = useState(true)
	const [isHovered, setIsHovered] = useState(false)
	const [isInitialized, setIsInitialized] = useState(false)

	useEffect(() => {
		// Initialize with a slight delay to ensure proper mounting
		const initTimer = setTimeout(() => {
			setIsInitialized(true)
		}, 100)

		return () => clearTimeout(initTimer)
	}, [])

	useEffect(() => {
		if (!isInitialized) return

		// Show dock for 5 seconds after page load, then hide
		setIsVisible(true)
		const timer = setTimeout(() => {
			setIsVisible(false)
		}, 5000)

		return () => clearTimeout(timer)
	}, [pathname, isInitialized]) // Reset timer when pathname changes and component is initialized

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

	const showDock = isVisible || isHovered

	// Don't render until initialized
	if (!isInitialized) {
		return null
	}

	return (
		<div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
			<div
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				className="relative px-12 py-6" // Even larger hover area
			>
				<AnimatePresence mode="wait">
					{showDock ? (
						<motion.div
							key="dock"
							initial={{ opacity: 0, y: 20, scale: 0.8 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 20, scale: 0.8 }}
							transition={{ duration: 0.3, ease: "easeInOut" }}
						>
							<FloatingDock
								items={navItems}
								desktopClassName=""
								mobileClassName=""
							/>
						</motion.div>
					) : (
						<motion.div
							key="line"
							initial={{ opacity: 0, scaleX: 0 }}
							animate={{ opacity: 1, scaleX: 1 }}
							exit={{ opacity: 0, scaleX: 0 }}
							transition={{ duration: 0.3, ease: "easeInOut" }}
							className="w-64 h-2 bg-gradient-to-r from-pink-500/80 via-blue-500/80 to-pink-500/80 rounded-full cursor-pointer hover:h-2.5 hover:from-pink-500 hover:via-blue-500 hover:to-pink-500 transition-all duration-200 mx-auto"
						/>
					)}
				</AnimatePresence>
			</div>
		</div>
	)
}
