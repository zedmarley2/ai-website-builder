import Link from 'next/link';

export default function SiteNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-lg text-gray-600">This page could not be found.</p>
        <Link href="/" className="mt-6 inline-block text-sm text-blue-600 hover:text-blue-700">
          Go to homepage
        </Link>
      </div>
    </div>
  );
}
