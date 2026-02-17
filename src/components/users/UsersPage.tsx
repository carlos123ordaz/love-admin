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
    Avatar,
    IconButton,
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/SearchRounded';
import VisibilityIcon from '@mui/icons-material/VisibilityRounded';
import StarIcon from '@mui/icons-material/Star';
import { usersApi } from '../../api';
import { formatDate } from '../../utils/format';
import type { User, Pagination } from '../../types';

const UsersPage: React.FC = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 100, pages: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [proFilter, setProFilter] = useState<string>('');
    const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

    const fetchUsers = useCallback(async (page = 1, searchTerm = search, isPro = proFilter) => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, limit: 100 };
            if (searchTerm) params.search = searchTerm;
            if (isPro) params.isPro = isPro;

            const { data } = await usersApi.getAll(params);
            if (data.success) {
                setUsers(data.data);
                setPagination(data.pagination);
            }
        } catch {
            setError('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    }, [search, proFilter]);

    useEffect(() => {
        fetchUsers(1, '', '');
    }, []);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        if (searchTimeout) clearTimeout(searchTimeout);
        const timeout = setTimeout(() => fetchUsers(1, value, proFilter), 400);
        setSearchTimeout(timeout);
    };

    const handleProFilterChange = (value: string) => {
        setProFilter(value);
        fetchUsers(1, search, value);
    };

    const handlePageChange = (_: unknown, newPage: number) => {
        fetchUsers(newPage + 1, search, proFilter);
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>Usuarios</Typography>
            <Typography variant="subtitle1" sx={{ mb: 3 }}>
                Gestión de usuarios (solo lectura) — {pagination.total} registros
            </Typography>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                    size="small"
                    placeholder="Buscar por nombre o email…"
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
                    <InputLabel>Plan</InputLabel>
                    <Select value={proFilter} label="Plan" onChange={(e) => handleProFilterChange(e.target.value)}>
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="true">PRO</MenuItem>
                        <MenuItem value="false">Free</MenuItem>
                    </Select>
                </FormControl>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Table */}
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Usuario</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell align="center">Plan</TableCell>
                                <TableCell align="center">Páginas</TableCell>
                                <TableCell>Último login</TableCell>
                                <TableCell>Registro</TableCell>
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
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        No se encontraron usuarios
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow
                                        key={user._id}
                                        hover
                                        sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                                        onClick={() => navigate(`/users/${user._id}`)}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar src={user.photoURL || undefined} sx={{ width: 32, height: 32, fontSize: 13 }}>
                                                    {user.displayName?.charAt(0)}
                                                </Avatar>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {user.displayName}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {user.email}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            {user.isPro ? (
                                                <Chip
                                                    icon={<StarIcon sx={{ fontSize: 14 }} />}
                                                    label="PRO"
                                                    size="small"
                                                    color="warning"
                                                    variant="outlined"
                                                />
                                            ) : (
                                                <Chip label="Free" size="small" variant="outlined" />
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2">{user.actualPageCount ?? user.pagesCreated}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(user.lastLogin)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(user.createdAt)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Ver detalle">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/users/${user._id}`);
                                                    }}
                                                >
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
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
                    onPageChange={handlePageChange}
                    rowsPerPageOptions={[20]}
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
            </Paper>
        </Box>
    );
};

export default UsersPage;