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
    TextField,
    InputAdornment,
    Chip,
    IconButton,
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Snackbar,
    Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/SearchRounded';
import VisibilityIcon from '@mui/icons-material/VisibilityRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import ReplyIcon from '@mui/icons-material/ReplyRounded';
import SendIcon from '@mui/icons-material/SendRounded';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActiveRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircleRounded';
import PersonIcon from '@mui/icons-material/PersonRounded';
import { contactsApi } from '../../api';
import {
    formatDate,
    formatDateTime,
    contactTypeLabels,
    contactStatusLabels,
    contactStatusColors,
} from '../../utils/format';
import type { Contact, Pagination } from '../../types';

const ContactsPage: React.FC = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, pages: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

    // Snackbar
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Dialogs
    const [viewContact, setViewContact] = useState<Contact | null>(null);
    const [editContact, setEditContact] = useState<Contact | null>(null);
    const [editStatus, setEditStatus] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // 🆕 Reply dialog
    const [replyContact, setReplyContact] = useState<Contact | null>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [replySending, setReplySending] = useState(false);

    const fetchContacts = useCallback(
        async (page = 1, s = search, status = statusFilter, type = typeFilter) => {
            setLoading(true);
            try {
                const params: Record<string, string | number> = { page, limit: 100 };
                if (s) params.search = s;
                if (status) params.status = status;
                if (type) params.type = type;

                const { data } = await contactsApi.getAll(params);
                if (data.success) {
                    setContacts(data.data);
                    setPagination(data.pagination);
                }
            } catch {
                setError('Error al cargar contactos');
            } finally {
                setLoading(false);
            }
        },
        [search, statusFilter, typeFilter]
    );

    useEffect(() => {
        fetchContacts(1, '', '', '');
    }, []);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        if (searchTimeout) clearTimeout(searchTimeout);
        const t = setTimeout(() => fetchContacts(1, value, statusFilter, typeFilter), 400);
        setSearchTimeout(t);
    };

    const handleEdit = (contact: Contact) => {
        setEditContact(contact);
        setEditStatus(contact.status);
        setEditNotes(contact.adminNotes || '');
    };

    const handleSaveEdit = async () => {
        if (!editContact) return;
        try {
            const { data } = await contactsApi.update(editContact._id, {
                status: editStatus,
                adminNotes: editNotes,
            });
            if (data.success) {
                setContacts((prev) =>
                    prev.map((c) =>
                        c._id === editContact._id ? { ...c, status: editStatus as Contact['status'], adminNotes: editNotes } : c
                    )
                );
                setEditContact(null);
                setSnackbar({ open: true, message: 'Contacto actualizado', severity: 'success' });
            }
        } catch {
            setError('Error al actualizar contacto');
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await contactsApi.delete(deleteId);
            setContacts((prev) => prev.filter((c) => c._id !== deleteId));
            setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
            setDeleteId(null);
            setSnackbar({ open: true, message: 'Contacto eliminado', severity: 'success' });
        } catch {
            setError('Error al eliminar contacto');
        }
    };

    // 🆕 Abrir diálogo de respuesta
    const handleOpenReply = (contact: Contact) => {
        setReplyContact(contact);
        setReplyMessage('');
    };

    // 🆕 Enviar respuesta
    const handleSendReply = async () => {
        if (!replyContact || !replyMessage.trim()) return;

        setReplySending(true);
        try {
            const { data } = await contactsApi.reply(replyContact._id, {
                replyMessage: replyMessage.trim(),
            });

            if (data.success) {
                // Actualizar el contacto en la lista local
                setContacts((prev) =>
                    prev.map((c) =>
                        c._id === replyContact._id
                            ? {
                                ...c,
                                status: 'resolved' as Contact['status'],
                                adminReply: replyMessage.trim(),
                                adminRepliedAt: new Date().toISOString(),
                            }
                            : c
                    )
                );

                setReplyContact(null);
                setReplyMessage('');

                const msg = data.data?.notificationSent
                    ? '✅ Respuesta enviada y notificación entregada al usuario'
                    : '✅ Respuesta guardada (usuario sin cuenta, no se envió notificación)';

                setSnackbar({ open: true, message: msg, severity: 'success' });
            }
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.response?.data?.message || 'Error al enviar respuesta',
                severity: 'error',
            });
        } finally {
            setReplySending(false);
        }
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Contactos</Typography>
            <Typography variant="subtitle1" sx={{ mb: 3 }}>
                Gestión de mensajes de contacto — {pagination.total} registros
            </Typography>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                    size="small"
                    placeholder="Buscar por nombre, email o asunto…"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    sx={{ minWidth: 280 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" color="disabled" />
                            </InputAdornment>
                        ),
                    }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Estado</InputLabel>
                    <Select
                        value={statusFilter}
                        label="Estado"
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            fetchContacts(1, search, e.target.value, typeFilter);
                        }}
                    >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="pending">Pendiente</MenuItem>
                        <MenuItem value="in_progress">En progreso</MenuItem>
                        <MenuItem value="resolved">Resuelto</MenuItem>
                        <MenuItem value="closed">Cerrado</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                        value={typeFilter}
                        label="Tipo"
                        onChange={(e) => {
                            setTypeFilter(e.target.value);
                            fetchContacts(1, search, statusFilter, e.target.value);
                        }}
                    >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="comment">Comentario</MenuItem>
                        <MenuItem value="custom_page">Página personalizada</MenuItem>
                        <MenuItem value="support">Soporte</MenuItem>
                        <MenuItem value="other">Otro</MenuItem>
                    </Select>
                </FormControl>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            {/* Table */}
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Remitente</TableCell>
                                <TableCell>Asunto</TableCell>
                                <TableCell align="center">Tipo</TableCell>
                                <TableCell align="center">Estado</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={28} />
                                    </TableCell>
                                </TableRow>
                            ) : contacts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        No se encontraron contactos
                                    </TableCell>
                                </TableRow>
                            ) : (
                                contacts.map((c) => (
                                    <TableRow key={c._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{c.email}</Typography>
                                                </Box>
                                                {/* Indicador si tiene userId (puede recibir notificación) */}
                                                {(c as any).userId && (
                                                    <Tooltip title="Usuario registrado — puede recibir notificaciones">
                                                        <PersonIcon sx={{ fontSize: 14, color: 'primary.main', ml: 0.5 }} />
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ maxWidth: 280 }} noWrap>
                                                {c.subject}
                                            </Typography>
                                            {/* Indicador de que ya fue respondido */}
                                            {(c as any).adminReply && (
                                                <Chip
                                                    icon={<CheckCircleIcon />}
                                                    label="Respondido"
                                                    size="small"
                                                    color="success"
                                                    variant="outlined"
                                                    sx={{ mt: 0.5, height: 20, fontSize: 11 }}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip label={contactTypeLabels[c.type] || c.type} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={contactStatusLabels[c.status] || c.status}
                                                size="small"
                                                color={contactStatusColors[c.status] || 'default'}
                                            />
                                        </TableCell>
                                        <TableCell>{formatDate(c.createdAt)}</TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                <Tooltip title="Ver">
                                                    <IconButton size="small" onClick={() => setViewContact(c)}>
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                {/* 🆕 Botón de responder */}
                                                <Tooltip title="Responder">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleOpenReply(c)}
                                                    >
                                                        <ReplyIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Editar estado">
                                                    <IconButton size="small" onClick={() => handleEdit(c)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Eliminar">
                                                    <IconButton size="small" color="error" onClick={() => setDeleteId(c._id)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={pagination.total}
                    page={pagination.page - 1}
                    rowsPerPage={pagination.limit}
                    onPageChange={(_, p) => fetchContacts(p + 1, search, statusFilter, typeFilter)}
                    rowsPerPageOptions={[100]}
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
            </Paper>

            {/* ============================================ */}
            {/* VIEW Dialog */}
            {/* ============================================ */}
            <Dialog open={!!viewContact} onClose={() => setViewContact(null)} maxWidth="sm" fullWidth>
                {viewContact && (
                    <>
                        <DialogTitle>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                Mensaje de contacto
                                <Chip
                                    label={contactStatusLabels[viewContact.status]}
                                    size="small"
                                    color={contactStatusColors[viewContact.status]}
                                />
                            </Box>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">De</Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {viewContact.name} ({viewContact.email})
                                        {(viewContact as any).userId && (
                                            <Chip
                                                icon={<PersonIcon />}
                                                label="Registrado"
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                                sx={{ ml: 1, height: 22, fontSize: 11 }}
                                            />
                                        )}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Tipo</Typography>
                                    <Typography variant="body2">{contactTypeLabels[viewContact.type]}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Asunto</Typography>
                                    <Typography variant="body2" fontWeight={600}>{viewContact.subject}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Mensaje</Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                        {viewContact.message}
                                    </Typography>
                                </Box>

                                {/* 🆕 Mostrar respuesta si existe */}
                                {(viewContact as any).adminReply && (
                                    <>
                                        <Divider />
                                        <Box
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                bgcolor: 'success.50',
                                                border: '1px solid',
                                                borderColor: 'success.200',
                                            }}
                                        >
                                            <Typography variant="caption" color="success.main" fontWeight={600}>
                                                💬 Respuesta del admin
                                            </Typography>
                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>
                                                {(viewContact as any).adminReply}
                                            </Typography>
                                            {(viewContact as any).adminRepliedAt && (
                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                    Respondido: {formatDateTime((viewContact as any).adminRepliedAt)}
                                                </Typography>
                                            )}
                                        </Box>
                                    </>
                                )}

                                {viewContact.adminNotes && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Notas admin</Typography>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'warning.main' }}>
                                            {viewContact.adminNotes}
                                        </Typography>
                                    </Box>
                                )}
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Fecha</Typography>
                                    <Typography variant="body2">{formatDateTime(viewContact.createdAt)}</Typography>
                                </Box>
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setViewContact(null)}>Cerrar</Button>
                            {/* 🆕 Botón responder desde el dialog de ver */}
                            {!(viewContact as any).adminReply && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<ReplyIcon />}
                                    onClick={() => {
                                        const contact = viewContact;
                                        setViewContact(null);
                                        handleOpenReply(contact);
                                    }}
                                >
                                    Responder
                                </Button>
                            )}
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    handleEdit(viewContact);
                                    setViewContact(null);
                                }}
                            >
                                Editar estado
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* ============================================ */}
            {/* 🆕 REPLY Dialog */}
            {/* ============================================ */}
            <Dialog
                open={!!replyContact}
                onClose={() => !replySending && setReplyContact(null)}
                maxWidth="sm"
                fullWidth
            >
                {replyContact && (
                    <>
                        <DialogTitle>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ReplyIcon color="primary" />
                                Responder a {replyContact.name}
                            </Box>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                {/* Contexto del mensaje original */}
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        bgcolor: 'grey.50',
                                        borderLeft: '4px solid',
                                        borderLeftColor: 'primary.main',
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        Mensaje original
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                                        {replyContact.subject}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mt: 0.5, whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto' }}
                                    >
                                        {replyContact.message}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                        De: {replyContact.name} ({replyContact.email}) · {formatDate(replyContact.createdAt)}
                                    </Typography>
                                </Paper>

                                {/* Indicador si recibirá notificación */}
                                {(replyContact as any).userId ? (
                                    <Alert
                                        severity="info"
                                        icon={<NotificationsActiveIcon />}
                                        sx={{ py: 0.5 }}
                                    >
                                        <Typography variant="body2" fontSize={13}>
                                            El usuario recibirá una <strong>notificación in-app</strong> con tu respuesta
                                        </Typography>
                                    </Alert>
                                ) : (
                                    <Alert severity="warning" sx={{ py: 0.5 }}>
                                        <Typography variant="body2" fontSize={13}>
                                            Este contacto <strong>no tiene cuenta registrada</strong>. La respuesta se guardará pero no se enviará notificación.
                                        </Typography>
                                    </Alert>
                                )}

                                {/* Ya fue respondido anteriormente? */}
                                {(replyContact as any).adminReply && (
                                    <Alert severity="success" sx={{ py: 0.5 }}>
                                        <Typography variant="body2" fontSize={13}>
                                            Este contacto ya fue respondido. Enviar otra respuesta reemplazará la anterior.
                                        </Typography>
                                    </Alert>
                                )}

                                {/* Campo de respuesta */}
                                <TextField
                                    label="Tu respuesta"
                                    placeholder="Escribe tu respuesta al usuario..."
                                    multiline
                                    rows={5}
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    fullWidth
                                    autoFocus
                                    inputProps={{ maxLength: 500 }}
                                    helperText={`${replyMessage.length}/500 caracteres`}
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, py: 2 }}>
                            <Button
                                onClick={() => setReplyContact(null)}
                                disabled={replySending}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={replySending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                                onClick={handleSendReply}
                                disabled={!replyMessage.trim() || replySending}
                            >
                                {replySending ? 'Enviando...' : 'Enviar respuesta'}
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* ============================================ */}
            {/* EDIT Dialog */}
            {/* ============================================ */}
            <Dialog open={!!editContact} onClose={() => setEditContact(null)} maxWidth="sm" fullWidth>
                {editContact && (
                    <>
                        <DialogTitle>Actualizar contacto</DialogTitle>
                        <DialogContent dividers>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Estado</InputLabel>
                                    <Select value={editStatus} label="Estado" onChange={(e) => setEditStatus(e.target.value)}>
                                        <MenuItem value="pending">Pendiente</MenuItem>
                                        <MenuItem value="in_progress">En progreso</MenuItem>
                                        <MenuItem value="resolved">Resuelto</MenuItem>
                                        <MenuItem value="closed">Cerrado</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Notas del administrador"
                                    multiline
                                    rows={4}
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    fullWidth
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setEditContact(null)}>Cancelar</Button>
                            <Button variant="contained" onClick={handleSaveEdit}>Guardar</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* ============================================ */}
            {/* DELETE Dialog */}
            {/* ============================================ */}
            <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <Typography>¿Estás seguro de que deseas eliminar este contacto?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
                    <Button color="error" variant="contained" onClick={handleDelete}>Eliminar</Button>
                </DialogActions>
            </Dialog>

            {/* ============================================ */}
            {/* Snackbar (feedback) */}
            {/* ============================================ */}
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
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ContactsPage;