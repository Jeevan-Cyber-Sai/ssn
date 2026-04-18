import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="text-center">
        <h1 className="text-8xl font-extrabold font-display text-gray-100 dark:text-gray-800">404</h1>
        <h2 className="text-2xl font-bold font-display -mt-4 mb-3">Page not found</h2>
        <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors">
          Go home
        </Link>
      </div>
    </div>
  )
}
