import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, User, LogIn, LayoutDashboard, ShieldCheck, Zap, Trophy } from "lucide-react"

export default function Home() {
    return (
        <div className="min-h-screen relative overflow-hidden bg-brand-dark text-white selection:bg-brand-purple selection:text-white">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-purple/20 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-pink/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="container mx-auto px-4 py-16 relative z-10">
                {/* Header Section */}
                <div className="text-center mb-20 space-y-6">
                    <div className="inline-block animate-accordion-down">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/20 text-brand-pink backdrop-blur-sm">
                            PREMIUM CRICKET EXPERIENCE
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 leading-tight">
                        Book Your <br />
                        <span className="circana-gradient-text">Winning Moment</span>
                    </h1>

                    <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                        Experience cricket like never before. Professional-grade turf, night-vision lighting, and premium amenities driven by data-backed excellence.
                    </p>

                    <div className="flex justify-center gap-4 pt-4">
                        <Link href="/venue">
                            <Button size="lg" className="bg-gradient-to-r from-brand-purple to-brand-pink hover:opacity-90 transition-opacity border-0 h-12 px-8 text-base">
                                Book Slots Now
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {/* Venue Booking Card */}
                    <Card className="glass-card hover:bg-white/5 transition-all duration-300 group border-white/5">
                        <CardHeader>
                            <div className="mb-4 w-12 h-12 rounded-lg bg-brand-purple/20 flex items-center justify-center group-hover:bg-brand-purple/30 transition-colors">
                                <CalendarDays className="h-6 w-6 text-brand-purple" />
                            </div>
                            <CardTitle className="text-xl text-white">Instant Booking</CardTitle>
                            <CardDescription className="text-zinc-400">
                                Real-time availability for our premium turf. Book slotes instantly.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/venue">
                                <Button variant="ghost" className="w-full justify-between text-white hover:text-brand-pink hover:bg-white/5 group-hover:pl-4 transition-all">
                                    Check Availability <span className="text-xl">→</span>
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* User Features Card */}
                    <Card className="glass-card hover:bg-white/5 transition-all duration-300 group border-white/5">
                        <CardHeader>
                            <div className="mb-4 w-12 h-12 rounded-lg bg-brand-pink/20 flex items-center justify-center group-hover:bg-brand-pink/30 transition-colors">
                                <User className="h-6 w-6 text-brand-pink" />
                            </div>
                            <CardTitle className="text-xl text-white">Player Profile</CardTitle>
                            <CardDescription className="text-zinc-400">
                                Track your games, manage bookings, and join the community.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/register">
                                <Button variant="ghost" className="w-full justify-between text-white hover:text-brand-pink hover:bg-white/5 group-hover:pl-4 transition-all">
                                    Join Now <span className="text-xl">→</span>
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Owner Dashboard Card */}
                    <Card className="glass-card hover:bg-white/5 transition-all duration-300 group border-white/5">
                        <CardHeader>
                            <div className="mb-4 w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
                                <LayoutDashboard className="h-6 w-6 text-indigo-400" />
                            </div>
                            <CardTitle className="text-xl text-white">Turf Management</CardTitle>
                            <CardDescription className="text-zinc-400">
                                Comprehensive analytics and booking control for owners.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/owner">
                                <Button variant="ghost" className="w-full justify-between text-white hover:text-brand-pink hover:bg-white/5 group-hover:pl-4 transition-all">
                                    Owner Access <span className="text-xl">→</span>
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Badges/Trust Section */}
                <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 text-center opacity-60">
                    <div className="flex flex-col items-center gap-2">
                        <ShieldCheck className="h-8 w-8 text-zinc-500" />
                        <span className="text-sm font-medium tracking-wider text-zinc-400">SECURE PAYMENTS</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Zap className="h-8 w-8 text-zinc-500" />
                        <span className="text-sm font-medium tracking-wider text-zinc-400">INSTANT CONFIRMATION</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Trophy className="h-8 w-8 text-zinc-500" />
                        <span className="text-sm font-medium tracking-wider text-zinc-400">PREMIUM AMENITIES</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <CalendarDays className="h-8 w-8 text-zinc-500" />
                        <span className="text-sm font-medium tracking-wider text-zinc-400">24/7 AVAILABILITY</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
