import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export function formatDate(date: string): string {
    return format(parseISO(date), 'dd MMMM yyyy', { locale: id });
}

export function formatDateTime(date: string): string {
    return format(parseISO(date), 'dd MMM yyyy HH:mm', { locale: id });
}

export function formatShortDate(date: string): string {
    return format(parseISO(date), 'dd/MM/yyyy');
}

export function formatRelative(date: string): string {
    return formatDistanceToNow(parseISO(date), { addSuffix: true, locale: id });
}
