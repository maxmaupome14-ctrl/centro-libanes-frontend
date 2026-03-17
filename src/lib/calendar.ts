/**
 * Generate .ics calendar file content and trigger download.
 * No external dependencies — uses the iCalendar RFC 5545 spec directly.
 */

interface CalendarEvent {
    title: string;
    date: string;       // YYYY-MM-DD
    startTime: string;  // HH:MM
    endTime: string;    // HH:MM
    location?: string;
    description?: string;
}

function toICSDate(date: string, time: string): string {
    // Convert "2026-03-15" + "10:00" → "20260315T100000"
    const d = date.replace(/-/g, '');
    const t = time.replace(':', '') + '00';
    return `${d}T${t}`;
}

function generateUID(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}@centrolibanes.com`;
}

export function generateICS(event: CalendarEvent): string {
    const now = new Date();
    const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Centro Libanés//App//ES',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${generateUID()}`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${toICSDate(event.date, event.startTime)}`,
        `DTEND:${toICSDate(event.date, event.endTime)}`,
        `SUMMARY:${event.title}`,
    ];

    if (event.location) lines.push(`LOCATION:${event.location}`);
    if (event.description) lines.push(`DESCRIPTION:${event.description}`);

    lines.push('BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:Recordatorio', 'END:VALARM');
    lines.push('END:VEVENT', 'END:VCALENDAR');

    return lines.join('\r\n');
}

export function downloadICS(event: CalendarEvent): void {
    const content = generateICS(event);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
