import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Avatar,
    Chip,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Divider,
    IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackRounded';
import StarIcon from '@mui/icons-material/Star';
import VisibilityIcon from '@mui/icons-material/VisibilityRounded';
import { usersApi } from '../../api';
import { formatDate, formatDateTime } from '../../utils/format';
import type { User, PageItem } from '../../types';

const UserDetailPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [pages, setPages] = useState<PageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!userId) return;
        const fetch = async () => {
            try {
                const { data } = await usersApi.getById(userId);
                if (data.success) {
                    setUser(data.data.user);
                    setPages(data.data.pages);
                }
            } catch {
                setError('Error al cargar usuario');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [userId]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !user) {
        return (
            <Box>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/users')} sx={{ mb: 2 }}>
                    Volver
                </Button>
                <Alert severity="error">{error || 'Usuario no encontrado'}</Alert>
            </Box>
        );
    }

    return (
        <Box>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/users')} sx={{ mb: 3 }}>
                Volver a usuarios
            </Button>

            {/* User Info Card */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 3 }}>
                    <Avatar src={user.photoURL || undefined} sx={{ width: 64, height: 64, fontSize: 24 }}>
                        {user.displayName?.charAt(0)}
                    </Avatar>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                            <Typography variant="h5">{user.displayName}</Typography>
                            {user.isPro && (
                                <Chip icon={<StarIcon sx={{ fontSize: 14 }} />} label="PRO" size="small" color="warning" />
                            )}
                            {user.isAdmin && (
                                <Chip label="ADMIN" size="small" color="error" />
                            )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={3}>
                    {[
                        { label: 'ID MongoDB', value: user._id },
                        { label: 'Firebase UID', value: user.firebaseUid },
                        { label: 'Páginas creadas', value: user.pagesCreated },
                        { label: 'Plan', value: user.isPro ? 'PRO' : 'Free' },
                        { label: 'PRO expira', value: user.proExpiresAt ? formatDate(user.proExpiresAt) : 'Permanente / N/A' },
                        { label: 'Último login', value: formatDateTime(user.lastLogin) },
                        { label: 'Fecha de registro', value: formatDateTime(user.createdAt) },
                        { label: 'Pagos realizados', value: user.payments?.length || 0 },
                    ].map((item) => (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.label}>
                            <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                            <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-all' }}>
                                {String(item.value)}
                            </Typography>
                        </Grid>
                    ))}
                </Grid>
            </Paper>

            {/* Payments */}
            {user.payments && user.payments.length > 0 && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Historial de pagos</Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Monto</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell>Fecha</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {user.payments.map((p, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                                                {p.mercadoPagoId || p.paymentId}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{p.amount} {p.currency}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={p.status}
                                                size="small"
                                                color={p.status === 'approved' ? 'success' : 'default'}
                                            />
                                        </TableCell>
                                        <TableCell>{formatDate(p.date)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* User's Pages */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Páginas del usuario ({pages.length})
                </Typography>
                {pages.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">Sin páginas creadas</Typography>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Título</TableCell>
                                    <TableCell>Tipo</TableCell>
                                    <TableCell align="center">Vistas</TableCell>
                                    <TableCell align="center">Sí / No</TableCell>
                                    <TableCell align="center">Estado</TableCell>
                                    <TableCell>Creada</TableCell>
                                    <TableCell align="center" />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {pages.map((p) => (
                                    <TableRow key={p._id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>{p.title}</Typography>
                                            <Typography variant="caption" color="text.secondary">{p.shortId}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={p.pageType.toUpperCase()}
                                                size="small"
                                                color={p.pageType === 'pro' ? 'secondary' : 'default'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="center">{p.views}</TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2">
                                                <span style={{ color: '#34d399' }}>{p.yesCount}</span>
                                                {' / '}
                                                <span style={{ color: '#f87171' }}>{p.noCount}</span>
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={p.isActive ? 'Activa' : 'Inactiva'}
                                                size="small"
                                                color={p.isActive ? 'success' : 'default'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>{formatDate(p.createdAt)}</TableCell>
                                        <TableCell align="center">
                                            <IconButton size="small" onClick={() => navigate(`/pages/${p._id}`)}>
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </Box>
    );
};

export default UserDetailPage;