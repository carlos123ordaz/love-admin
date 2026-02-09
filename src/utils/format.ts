export const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

export const formatDateTime = (date: string) =>
    new Date(date).toLocaleString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

export const contactTypeLabels: Record<string, string> = {
    comment: 'Comentario',
    custom_page: 'Página personalizada',
    support: 'Soporte',
    other: 'Otro',
};

export const contactStatusLabels: Record<string, string> = {
    pending: 'Pendiente',
    in_progress: 'En progreso',
    resolved: 'Resuelto',
    closed: 'Cerrado',
};

export const contactStatusColors: Record<string, 'warning' | 'info' | 'success' | 'default'> = {
    pending: 'warning',
    in_progress: 'info',
    resolved: 'success',
    closed: 'default',
};