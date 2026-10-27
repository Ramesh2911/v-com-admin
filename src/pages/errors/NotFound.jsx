import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shadow-glow mb-6">
        <Compass className="w-10 h-10 text-white" />
      </div>
      <p className="text-7xl font-display font-black text-slate-900">404</p>
      <h1 className="text-xl font-display font-bold text-slate-800 mt-3">Page not found</h1>
      <p className="text-slate-500 mt-2 max-w-md">The page you are looking for doesn't exist or has been moved. Head back to the dashboard to continue.</p>
      <Link to="/dashboard" className="mt-6">
        <Button icon={ArrowLeft}>Back to dashboard</Button>
      </Link>
    </div>
  );
}
