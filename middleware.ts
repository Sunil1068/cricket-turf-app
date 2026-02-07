import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Allow access to auth pages
        if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
          return true
        }

        // Require authentication for protected routes
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/owner') || pathname.startsWith('/checkout')) {
          return !!token
        }

        // Owner only routes
        if (pathname.startsWith('/owner')) {
          return token?.role === 'OWNER'
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/owner/:path*', '/checkout/:path*', '/login', '/register'],
}
