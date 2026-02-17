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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/SearchRounded';
import VisibilityIcon from '@mui/icons-material/VisibilityRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
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

    // Dialogs
    const [viewContact, setViewContact] = useState<Contact | null>(null);
    const [editContact, setEditContact] = useState<Contact | null>(null);
    const [editStatus, setEditStatus] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);

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
        } catch {
            setError('Error al eliminar contacto');
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
                                            <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{c.email}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ maxWidth: 280 }} noWrap>
                                                {c.subject}
                                            </Typography>
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

            {/* View Dialog */}
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

            {/* Edit Dialog */}
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

            {/* Delete Dialog */}
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
        </Box>
    );
};

export default ContactsPage;