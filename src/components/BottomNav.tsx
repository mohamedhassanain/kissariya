import { Link, useLocation } from 'react-router-dom';
import { Home, Search, User, PlusSquare } from 'lucide-react';
import { useAuth } from '@/hooks/auth-utils';
import { cn } from '@/lib/utils';

import * as React from 'react';

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = React.useMemo(() => [
    { icon: Home, label: 'Accueil', path: '/' },
    { icon: PlusSquare, label: 'PUBLIER ANNONCE', path: user ? '/products/new' : '/auth' },
    { icon: Search, label: 'Explorer', path: '/explore' },
    { icon: User, label: 'Compte', path: user ? '/dashboard' : '/auth' },
  ], [user]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 z-50 pb-safe">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={`${item.path}-${index}`}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors",
                isActive ? "text-orange-600" : "text-slate-500"
              )}
            >
              <Icon className={cn("h-6 w-6", isActive && "fill-orange-50/50")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
