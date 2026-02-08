'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, LogOut, User, Menu } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'

export function Navbar() {
    const { data: session } = useSession()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <nav className="border-b border-white/10 bg-brand-dark/50 backdrop-blur-xl sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo Section */}
                <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 hover:opacity-80 transition-opacity">
                    TURF CRICKET
                </Link>

                <div className="flex items-center gap-4 md:gap-6">
                    {session ? (
                        <>
                            {/* Navigation Links - Moved to Right next to Profile */}
                            <div className="hidden md:flex items-center gap-6 mr-2">
                                <Link
                                    href="/dashboard"
                                    className="text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all"
                                >
                                    My Bookings
                                </Link>
                                {session?.user?.role === 'OWNER' && (
                                    <Link
                                        href="/owner"
                                        className="text-sm font-semibold text-brand-purple hover:text-brand-pink border border-brand-purple/30 hover:border-brand-purple px-3 py-1.5 rounded-lg transition-all"
                                    >
                                        Owner Panel
                                    </Link>
                                )}
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden ring-2 ring-white/10 hover:ring-brand-purple/50 transition-all">
                                        <div className="h-full w-full bg-gradient-to-br from-brand-purple to-indigo-600 flex items-center justify-center text-white font-bold text-lg select-none uppercase">
                                            {session.user.name?.[0] || 'U'}
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 bg-brand-dark border-white/10 text-zinc-200 shadow-2xl" align="end">
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-semibold leading-none text-white">{session.user.name}</p>
                                            <p className="text-xs leading-none text-zinc-500">{session.user.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer py-2.5" asChild>
                                        <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> My Bookings</Link>
                                    </DropdownMenuItem>
                                    {session.user.role === 'OWNER' && (
                                        <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer py-2.5" asChild>
                                            <Link href="/owner"><LayoutDashboard className="mr-2 h-4 w-4 text-brand-pink" /> Owner Dashboard</Link>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <DropdownMenuItem
                                        className="text-red-400 focus:text-red-300 focus:bg-red-950/20 cursor-pointer py-2.5"
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/login">
                                <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5 px-4 h-10">Login</Button>
                            </Link>
                            <Link href="/register">
                                <Button className="bg-brand-purple hover:bg-brand-purple/90 text-white px-6 h-10 font-semibold shadow-lg shadow-brand-purple/20">Sign Up</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}
