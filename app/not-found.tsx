import Link from 'next/link';
import AppLayout from '@/components/AppLayout';

export default function NotFound() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <h1 className="text-6xl font-bold text-zinc-900">404</h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-zinc-800">Page Not Found</h2>
          <p className="text-zinc-500 max-w-md">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
          </p>
        </div>
        <Link 
          href="/"
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
        >
          Back to Home
        </Link>
      </div>
    </AppLayout>
  );
}
