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
                <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                    TURF.BADMINTON
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-6">
                    <Link href="/venue" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                        Book Slots
                    </Link>
                    {/* Only show Dashboard link if logged in */}
                    {session?.user && (
                        <Link href="/dashboard" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                            My Bookings
                        </Link>
                    )}
                    {/* Show Owner link if owner */}
                    {session?.user?.role === 'OWNER' && (
                        <Link href="/owner" className="text-sm font-medium text-brand-purple hover:text-brand-pink transition-colors">
                            Owner Dashboard
                        </Link>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {session ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-white/10 hover:bg-white/20">
                                    <User className="h-4 w-4 text-white" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-brand-dark border-white/10 text-zinc-200" align="end">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none text-white">{session.user.name}</p>
                                        <p className="text-xs leading-none text-zinc-500">{session.user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer" asChild>
                                    <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Link>
                                </DropdownMenuItem>
                                {session.user.role === 'OWNER' && (
                                    <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer" asChild>
                                        <Link href="/owner"><LayoutDashboard className="mr-2 h-4 w-4 text-brand-pink" /> Owner Panel</Link>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem
                                    className="text-red-400 focus:text-red-300 focus:bg-red-950/20 cursor-pointer"
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/login">
                                <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5">Login</Button>
                            </Link>
                            <Link href="/register">
                                <Button className="bg-brand-purple hover:bg-brand-purple/90 text-white">Sign Up</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}
