import { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';

interface WeatherData {
    temp: number;
    condition: string;
    description: string;
    icon: string;
}

const SUGGESTIONS: Record<string, { text: string; category: string }> = {
    sunny: { text: 'Día perfecto para tenis o pádel al aire libre', category: 'Deportes' },
    cloudy: { text: 'Clima ideal para ejercicio al aire libre — sin sol directo', category: 'Deportes' },
    rainy: { text: 'Día de lluvia — perfecta excusa para spa o alberca techada', category: 'Spa' },
    hot: { text: 'Refresca con natación libre o clases acuáticas', category: 'Acuáticas' },
    cold: { text: 'Clima fresco — buen momento para yoga o danza en salón', category: 'Danza' },
};

function getWeatherIcon(code: string) {
    if (code.startsWith('01') || code.startsWith('02')) return Sun;
    if (code.startsWith('03') || code.startsWith('04')) return Cloud;
    if (code.startsWith('09') || code.startsWith('10')) return CloudRain;
    if (code.startsWith('11')) return CloudLightning;
    if (code.startsWith('13')) return CloudSnow;
    if (code.startsWith('50')) return Wind;
    return Sun;
}

function getSuggestion(temp: number, iconCode: string) {
    if (temp >= 33) return SUGGESTIONS.hot;
    if (temp <= 12) return SUGGESTIONS.cold;
    if (iconCode.startsWith('09') || iconCode.startsWith('10') || iconCode.startsWith('11')) return SUGGESTIONS.rainy;
    if (iconCode.startsWith('01') || iconCode.startsWith('02')) return SUGGESTIONS.sunny;
    return SUGGESTIONS.cloudy;
}

// Mexico City (CDMX) coordinates — Centro Libanés location
const LAT = 19.4326;
const LON = -99.1332;
const CACHE_KEY = 'cl-weather-cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 min

export const WeatherCard = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const todayKey = new Date().toISOString().split('T')[0];
        if (sessionStorage.getItem(`cl-weather-dismissed-${todayKey}`)) {
            setDismissed(true);
            return;
        }

        // Check cache first
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, ts } = JSON.parse(cached);
                if (Date.now() - ts < CACHE_TTL) {
                    setWeather(data);
                    return;
                }
            }
        } catch { /* ignore */ }

        // Fetch via backend proxy to avoid CORS on Vercel
        api.get('/weather')
            .then(r => r.data)
            .then(data => {
                const current = data.current_condition?.[0];
                if (!current) return;
                const weatherData: WeatherData = {
                    temp: parseInt(current.temp_C),
                    condition: current.weatherDesc?.[0]?.value || '',
                    description: current.lang_es?.[0]?.value || current.weatherDesc?.[0]?.value || '',
                    icon: mapWttrCode(parseInt(current.weatherCode)),
                };
                setWeather(weatherData);
                localStorage.setItem(CACHE_KEY, JSON.stringify({ data: weatherData, ts: Date.now() }));
            })
            .catch(() => { /* silently fail — card just won't show */ });
    }, []);

    if (dismissed || !weather) return null;

    const Icon = getWeatherIcon(weather.icon);
    const suggestion = getSuggestion(weather.temp, weather.icon);
    const isRainy = weather.icon.startsWith('09') || weather.icon.startsWith('10');
    const accentColor = isRainy ? '#06B6D4' : weather.temp >= 30 ? '#F59E0B' : '#007A4A';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
                margin: '0 16px',
                padding: 16,
                borderRadius: 16,
                background: `rgba(${isRainy ? '6,182,212' : weather.temp >= 30 ? '245,158,11' : '0,122,74'},0.06)`,
                border: `1px solid rgba(${isRainy ? '6,182,212' : weather.temp >= 30 ? '245,158,11' : '0,122,74'},0.12)`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                position: 'relative',
            }}
        >
            <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: `rgba(${isRainy ? '6,182,212' : weather.temp >= 30 ? '245,158,11' : '0,122,74'},0.12)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                <Icon size={20} style={{ color: accentColor }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>{weather.temp}°</span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', textTransform: 'capitalize' }}>{weather.description}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{suggestion.text}</p>
            </div>
            <button
                onClick={() => {
                    setDismissed(true);
                    const todayKey = new Date().toISOString().split('T')[0];
                    sessionStorage.setItem(`cl-weather-dismissed-${todayKey}`, '1');
                }}
                style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 24, height: 24, borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: 'var(--color-text-tertiary)', touchAction: 'manipulation',
                }}
            >
                <X size={14} />
            </button>
        </motion.div>
    );
};

/** Map wttr.in weather codes to OpenWeatherMap-like icon codes */
function mapWttrCode(code: number): string {
    if (code === 113) return '01d'; // Clear
    if (code === 116) return '02d'; // Partly cloudy
    if (code === 119) return '03d'; // Cloudy
    if (code === 122) return '04d'; // Overcast
    if ([176, 263, 266, 293, 296].includes(code)) return '10d'; // Light rain
    if ([299, 302, 305, 308, 356, 359].includes(code)) return '09d'; // Heavy rain
    if ([200, 386, 389, 392, 395].includes(code)) return '11d'; // Thunder
    if ([179, 182, 185, 227, 230, 323, 326, 329, 332, 335, 338, 368, 371, 374, 377].includes(code)) return '13d'; // Snow
    if ([143, 248, 260].includes(code)) return '50d'; // Fog
    return '01d';
}
