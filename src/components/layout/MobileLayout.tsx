import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { BottomNav } from './BottomNav';

export const MobileLayout = () => {
    const location = useLocation();
    const mainRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        mainRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }, [location.pathname]);

    return (
        <div className="app-container flex flex-col h-screen">
            <main ref={mainRef} className="flex-1 overflow-y-auto" style={{ paddingBottom: '80px' }}>
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
};
