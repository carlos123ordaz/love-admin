import React, { useEffect, useState, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar,
    Grid,
    Card,
    CardContent,
    Tabs,
    Tab,
    Divider,
} from '@mui/material';
import SendIcon from '@mui/icons-material/SendRounded';
import CampaignIcon from '@mui/icons-material/CampaignRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import PersonIcon from '@mui/icons-material/PersonRounded';
import GroupIcon from '@mui/icons-material/GroupRounded';
import StarIcon from '@mui/icons-material/StarRounded';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActiveRounded';
import { notificationsApi, usersApi } from '../../api';
import { formatDateTime } from '../../utils/format';

const TYPES = [
    { value: 'info', label: 'Info', icon: '🔔', color: '#2196f3' },
    { value: 'success', label: 'Éxito', icon: '✅', color: '#4caf50' },
    { value: 'warning', label: 'Aviso', icon: '⚠️', color: '#ff9800' },
    { value: 'promo', label: 'Promo', icon: '🎉', color: '#9c27b0' },
    { value: 'update', label: 'Update', icon: '🚀', color: '#00bcd4' },
    { value: 'response', label: 'Respuesta', icon: '💕', color: '#e91e63' },
    { value: 'system', label: 'Sistema', icon: '⚙️', color: '#607d8b' },
];

const AUDIENCE_OPTIONS = [
    { value: 'all', label: 'Todos los usuarios', icon: <GroupIcon />, color: 'primary' },
    { value: 'pro', label: 'Solo PRO', icon: <StarIcon />, color: 'warning' },
    { value: 'free', label: 'Solo gratuitos', icon: <PersonIcon />, color: 'default' },
];

const AdminNotificationsPage: React.FC = () => {
    const [tab, setTab] = useState(0); // 0 = Enviar, 1 = Historial
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false, message: '', severity: 'success',
    });

    // === Send form state ===
    const [sendMode, setSendMode] = useState<'individual' | 'broadcast'>('broadcast');
    const [userId, setUserId] = useState('');
    const [audience, setAudience] = useState('all');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('info');
    const [icon, setIcon] = useState('🔔');
    const [actionUrl, setActionUrl] = useState('');
    const [actionText, setActionText] = useState('');
    const [sending, setSending] = useState(false);

    // === History state ===
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 0 });
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // === Stats ===
    const [stats, setStats] = useState<any>(null);

    const fetchNotifications = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const { data } = await notificationsApi.getAll({ page, limit: 20 });
            if (data.success) {
                setNotifications(data.data.notifications);
                setPagination({
                    total: data.data.total,
                    page: data.data.page,
                    totalPages: data.data.totalPages,
                });
            }
        } catch {
            // silenciar
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStats = async () => {
        try {
            const { data } = await notificationsApi.getStats();
            if (data.success) setStats(data.data);
        } catch { /* silenciar */ }
    };

    useEffect(() => {
        if (tab === 1) fetchNotifications();
        fetchStats();
    }, [tab, fetchNotifications]);

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            setSnackbar({ open: true, message: 'Título y mensaje son requeridos', severity: 'error' });
            return;
        }

        if (sendMode === 'individual' && !userId.trim()) {
            setSnackbar({ open: true, message: 'ID del usuario es requerido', severity: 'error' });
            return;
        }

        setSending(true);
        try {
            let response;
            const payload = {
                title: title.trim(),
                message: message.trim(),
                type,
                icon,
                actionUrl: actionUrl.trim() || undefined,
                actionText: actionText.trim() || undefined,
            };

            if (sendMode === 'individual') {
                response = await notificationsApi.sendToUser({ ...payload, userId: userId.trim() });
            } else {
                response = await notificationsApi.broadcast({ ...payload, audience: audience as any });
            }

            if (response.data.success) {
                setSnackbar({ open: true, message: response.data.message, severity: 'success' });
                // Reset form
                setTitle('');
                setMessage('');
                setActionUrl('');
                setActionText('');
                setUserId('');
                fetchStats();
            }
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.message || 'Error al enviar',
                severity: 'error',
            });
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await notificationsApi.delete(deleteId);
            setNotifications((prev) => prev.filter((n) => n._id !== deleteId));
            setDeleteId(null);
            setSnackbar({ open: true, message: 'Notificación eliminada', severity: 'success' });
        } catch {
            setSnackbar({ open: true, message: 'Error al eliminar', severity: 'error' });
        }
    };

    // Auto-update icon when type changes
    const handleTypeChange = (newType: string) => {
        setType(newType);
        const found = TYPES.find((t) => t.value === newType);
        if (found) setIcon(found.icon);
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>
                <NotificationsActiveIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Notificaciones
            </Typography>
            <Typography variant="subtitle1" sx={{ mb: 3 }}>
                Envía notificaciones a usuarios individuales o a todos
            </Typography>

            {/* Stats cards */}
            {stats && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <Card variant="outlined">
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="h5" fontWeight={700}>{stats.total}</Typography>
                                <Typography variant="caption" color="text.secondary">Total</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <Card variant="outlined">
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="h5" fontWeight={700}>{stats.active}</Typography>
                                <Typography variant="caption" color="text.secondary">Activas</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <Card variant="outlined">
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="h5" fontWeight={700}>
                                    {stats.byAudience?.all || 0}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Broadcasts</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                        <Card variant="outlined">
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="h5" fontWeight={700}>
                                    {stats.byAudience?.individual || 0}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Individuales</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                    <Tab label="Enviar notificación" icon={<SendIcon />} iconPosition="start" />
                    <Tab label="Historial" icon={<CampaignIcon />} iconPosition="start" />
                </Tabs>
            </Paper>

            {/* TAB 0: Send */}
            {tab === 0 && (
                <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                        <Button
                            variant={sendMode === 'broadcast' ? 'contained' : 'outlined'}
                            startIcon={<CampaignIcon />}
                            onClick={() => setSendMode('broadcast')}
                            size="small"
                        >
                            Broadcast
                        </Button>
                        <Button
                            variant={sendMode === 'individual' ? 'contained' : 'outlined'}
                            startIcon={<PersonIcon />}
                            onClick={() => setSendMode('individual')}
                            size="small"
                        >
                            Individual
                        </Button>
                    </Box>

                    <Grid container spacing={2.5}>
                        {/* Destinatario */}
                        {sendMode === 'individual' ? (
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    label="User ID (ObjectId de MongoDB)"
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    fullWidth
                                    placeholder="Ej: 507f1f77bcf86cd799439011"
                                    helperText="Puedes copiar el ID desde la sección Usuarios"
                                />
                            </Grid>
                        ) : (
                            <Grid size={{ xs: 12 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Audiencia</InputLabel>
                                    <Select value={audience} label="Audiencia" onChange={(e) => setAudience(e.target.value)}>
                                        {AUDIENCE_OPTIONS.map((opt) => (
                                            <MenuItem key={opt.value} value={opt.value}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {opt.icon}
                                                    {opt.label}
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {/* Tipo y emoji */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Tipo</InputLabel>
                                <Select value={type} label="Tipo" onChange={(e) => handleTypeChange(e.target.value)}>
                                    {TYPES.map((t) => (
                                        <MenuItem key={t.value} value={t.value}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <span>{t.icon}</span>
                                                {t.label}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Emoji / Ícono"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                fullWidth
                                inputProps={{ maxLength: 10 }}
                            />
                        </Grid>

                        {/* Título */}
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Título"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                fullWidth
                                required
                                inputProps={{ maxLength: 120 }}
                                placeholder="Ej: 🚀 Nueva actualización disponible"
                            />
                        </Grid>

                        {/* Mensaje */}
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Mensaje"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                fullWidth
                                required
                                multiline
                                rows={3}
                                inputProps={{ maxLength: 500 }}
                                helperText={`${message.length}/500`}
                                placeholder="El contenido de la notificación..."
                            />
                        </Grid>

                        {/* Action URL y texto */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="URL de acción (opcional)"
                                value={actionUrl}
                                onChange={(e) => setActionUrl(e.target.value)}
                                fullWidth
                                placeholder="Ej: /templates o /upgrade"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Texto del botón (opcional)"
                                value={actionText}
                                onChange={(e) => setActionText(e.target.value)}
                                fullWidth
                                placeholder="Ej: Ver plantillas"
                                inputProps={{ maxLength: 50 }}
                            />
                        </Grid>

                        {/* Preview */}
                        <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                Vista previa
                            </Typography>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    display: 'flex',
                                    gap: 1.5,
                                    alignItems: 'flex-start',
                                    bgcolor: 'grey.50',
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 20,
                                        bgcolor: 'background.paper',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                    }}
                                >
                                    {icon || '🔔'}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" fontWeight={700}>
                                        {title || 'Título de la notificación'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, whiteSpace: 'pre-wrap' }}>
                                        {message || 'El mensaje aparecerá aquí...'}
                                    </Typography>
                                    {actionText && (
                                        <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block' }}>
                                            {actionText} →
                                        </Typography>
                                    )}
                                </Box>
                            </Paper>
                        </Grid>

                        {/* Send button */}
                        <Grid size={{ xs: 12 }}>
                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                onClick={handleSend}
                                disabled={sending || !title.trim() || !message.trim()}
                                sx={{ py: 1.5 }}
                            >
                                {sending
                                    ? 'Enviando...'
                                    : sendMode === 'individual'
                                        ? 'Enviar a usuario'
                                        : `Enviar a ${AUDIENCE_OPTIONS.find((a) => a.value === audience)?.label}`}
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {/* TAB 1: History */}
            {tab === 1 && (
                <Paper>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell width={50}></TableCell>
                                    <TableCell>Título</TableCell>
                                    <TableCell align="center">Tipo</TableCell>
                                    <TableCell align="center">Audiencia</TableCell>
                                    <TableCell align="center">Leídas</TableCell>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell align="center">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                            <CircularProgress size={28} />
                                        </TableCell>
                                    </TableRow>
                                ) : notifications.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                            No hay notificaciones
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    notifications.map((n) => (
                                        <TableRow key={n._id} hover>
                                            <TableCell sx={{ fontSize: 20 }}>{n.icon}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>{n.title}</Typography>
                                                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 300, display: 'block' }}>
                                                    {n.message}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={TYPES.find((t) => t.value === n.type)?.label || n.type}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={
                                                        n.audience === 'individual'
                                                            ? 'Individual'
                                                            : n.audience === 'pro'
                                                                ? 'Solo PRO'
                                                                : n.audience === 'free'
                                                                    ? 'Solo Free'
                                                                    : 'Todos'
                                                    }
                                                    size="small"
                                                    color={
                                                        n.audience === 'individual'
                                                            ? 'default'
                                                            : n.audience === 'pro'
                                                                ? 'warning'
                                                                : 'primary'
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography variant="body2">{n.readCount || 0}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption">{formatDateTime(n.createdAt)}</Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="Eliminar">
                                                    <IconButton size="small" color="error" onClick={() => setDeleteId(n._id)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {pagination.totalPages > 1 && (
                        <TablePagination
                            component="div"
                            count={pagination.total}
                            page={pagination.page - 1}
                            rowsPerPage={20}
                            onPageChange={(_, p) => fetchNotifications(p + 1)}
                            rowsPerPageOptions={[20]}
                            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                        />
                    )}
                </Paper>
            )}

            {/* Delete dialog */}
            <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <Typography>¿Eliminar esta notificación? Los usuarios que no la hayan leído ya no la verán.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
                    <Button color="error" variant="contained" onClick={handleDelete}>Eliminar</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminNotificationsPage;