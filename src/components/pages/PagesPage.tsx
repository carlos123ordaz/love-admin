import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import ToggleOnIcon from '@mui/icons-material/ToggleOnRounded';
import ToggleOffIcon from '@mui/icons-material/ToggleOffRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import OpenInNewIcon from '@mui/icons-material/OpenInNewRounded';
import { pagesApi } from '../../api';
import { formatDate } from '../../utils/format';
import type { PageItem, Pagination } from '../../types';

const PagesPage: React.FC = () => {
    const navigate = useNavigate();
    const [pages, setPages] = useState<PageItem[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 100, pages: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [activeFilter, setActiveFilter] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

    const fetchPages = useCallback(
        async (page = 1, s = search, type = typeFilter, active = activeFilter) => {
            setLoading(true);
            try {
                const params: Record<string, string | number> = { page, limit: 100 };
                if (s) params.search = s;
                if (type) params.pageType = type;
                if (active) params.isActive = active;

                const { data } = await pagesApi.getAll(params);
                if (data.success) {
                    setPages(data.data);
                    setPagination(data.pagination);
                }
            } catch {
                setError('Error al cargar páginas');
            } finally {
                setLoading(false);
            }
        },
        [search, typeFilter, activeFilter]
    );

    useEffect(() => {
        fetchPages(1, '', '', '');
    }, []);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        if (searchTimeout) clearTimeout(searchTimeout);
        const t = setTimeout(() => fetchPages(1, value, typeFilter, activeFilter), 400);
        setSearchTimeout(t);
    };

    const handleToggle = async (pageId: string) => {
        try {
            await pagesApi.toggle(pageId);
            setPages((prev) =>
                prev.map((p) => (p._id === pageId ? { ...p, isActive: !p.isActive } : p))
            );
        } catch {
            setError('Error al cambiar estado');
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await pagesApi.delete(deleteId);
            setPages((prev) => prev.filter((p) => p._id !== deleteId));
            setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
            setDeleteId(null);
        } catch {
            setError('Error al eliminar página');
        }
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Páginas</Typography>
            <Typography variant="subtitle1" sx={{ mb: 3 }}>
                Gestión de páginas — {pagination.total} registros
            </Typography>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                    size="small"
                    placeholder="Buscar por título, destinatario o shortId…"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    sx={{ minWidth: 300 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" color="disabled" />
                            </InputAdornment>
                        ),
                    }}
                />
                <FormControl size="small" sx={{ minWidth: 130 }}>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                        value={typeFilter}
                        label="Tipo"
                        onChange={(e) => {
                            setTypeFilter(e.target.value);
                            fetchPages(1, search, e.target.value, activeFilter);
                        }}
                    >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="free">Free</MenuItem>
                        <MenuItem value="pro">PRO</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                    <InputLabel>Estado</InputLabel>
                    <Select
                        value={activeFilter}
                        label="Estado"
                        onChange={(e) => {
                            setActiveFilter(e.target.value);
                            fetchPages(1, search, typeFilter, e.target.value);
                        }}
                    >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="true">Activa</MenuItem>
                        <MenuItem value="false">Inactiva</MenuItem>
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
                                <TableCell>Página</TableCell>
                                <TableCell>Propietario</TableCell>
                                <TableCell align="center">Tipo</TableCell>
                                <TableCell align="center">Vistas</TableCell>
                                <TableCell align="center">Sí / No</TableCell>
                                <TableCell align="center">Estado</TableCell>
                                <TableCell align="center">Photo</TableCell>
                                <TableCell>Creada</TableCell>
                                <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={28} />
                                    </TableCell>
                                </TableRow>
                            ) : pages.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        No se encontraron páginas
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pages.map((p) => (
                                    <TableRow key={p._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>{p.title}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Para: {p.recipientName} · {p.shortId}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {p.owner ? (
                                                <Box>
                                                    <Typography variant="body2" fontSize={13}>{p.owner.displayName}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{p.owner.email}</Typography>
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">—</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={p.pageType.toUpperCase()}
                                                size="small"
                                                color={p.pageType === 'pro' ? 'secondary' : 'default'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="center">{p.views}</TableCell>
                                        <TableCell align="center">
                                            <span style={{ color: '#34d399' }}>{p.yesCount}</span>
                                            {' / '}
                                            <span style={{ color: '#f87171' }}>{p.noCount}</span>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={p.isActive ? 'Activa' : 'Inactiva'}
                                                size="small"
                                                color={p.isActive ? 'success' : 'default'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <img style={{ width: '50px' }} src={p.backgroundImageUrl || ''} alt="Background" width="100px" height="60px" />
                                        </TableCell>
                                        <TableCell>{formatDate(p.createdAt)}</TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                <Tooltip title="Ver detalle">
                                                    <IconButton size="small" onClick={() => navigate(`/pages/${p._id}`)}>
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={p.isActive ? 'Desactivar' : 'Activar'}>
                                                    <IconButton size="small" onClick={() => handleToggle(p._id)}>
                                                        {p.isActive ? (
                                                            <ToggleOnIcon fontSize="small" color="success" />
                                                        ) : (
                                                            <ToggleOffIcon fontSize="small" />
                                                        )}
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Eliminar">
                                                    <IconButton size="small" color="error" onClick={() => setDeleteId(p._id)}>
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
                    onPageChange={(_, p) => fetchPages(p + 1, search, typeFilter, activeFilter)}
                    rowsPerPageOptions={[20]}
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
            </Paper>

            {/* Delete Dialog */}
            <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <Typography>¿Estás seguro de que deseas eliminar esta página? Esta acción no se puede deshacer.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
                    <Button color="error" variant="contained" onClick={handleDelete}>Eliminar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PagesPage;