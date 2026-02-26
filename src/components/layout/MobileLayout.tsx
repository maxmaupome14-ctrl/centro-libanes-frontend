import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export const MobileLayout = () => {

    return (
        <div className="app-container flex flex-col min-h-screen">
            {/* Header — logo next to club name, compact */}
            <header className="sticky top-0 z-50 glass px-5 h-11 flex items-center gap-2.5">
                <img src="/logo.png" alt="Centro Libanés" className="h-5 w-auto object-contain" />
                <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] tracking-wider uppercase">
                    Centro Libanés
                </span>
            </header>

            {/* Main scrollable content */}
            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>

            {/* Tab bar */}
            <BottomNav />
        </div>
    );
};
