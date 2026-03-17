import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';
import { usePlatform } from '../../hooks/usePlatform';

export const MobileLayout = () => {
    const location = useLocation();
    const mainRef = useRef<HTMLDivElement>(null);
    const { isAndroid } = usePlatform();

    useEffect(() => {
        mainRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }, [location.pathname]);

    return (
        <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {isAndroid && <TopBar />}
            <main ref={mainRef} style={{ flex: 1, overflowY: 'auto', paddingBottom: 96 }}>
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
};
