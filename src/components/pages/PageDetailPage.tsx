import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Grid,
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
    Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackRounded';
import OpenInNewIcon from '@mui/icons-material/OpenInNewRounded';
import ToggleOnIcon from '@mui/icons-material/ToggleOnRounded';
import ToggleOffIcon from '@mui/icons-material/ToggleOffRounded';
import ThumbUpIcon from '@mui/icons-material/ThumbUpRounded';
import ThumbDownIcon from '@mui/icons-material/ThumbDownRounded';
import { pagesApi } from '../../api';
import { formatDate, formatDateTime } from '../../utils/format';
import type { PageDetail } from '../../types';

const PageDetailPage: React.FC = () => {
    const { pageId } = useParams<{ pageId: string }>();
    const navigate = useNavigate();
    const [page, setPage] = useState<PageDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!pageId) return;
        const fetch = async () => {
            try {
                const { data } = await pagesApi.getById(pageId);
                if (data.success) setPage(data.data);
            } catch {
                setError('Error al cargar página');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [pageId]);

    const handleToggle = async () => {
        if (!pageId || !page) return;
        try {
            await pagesApi.toggle(pageId);
            setPage({ ...page, isActive: !page.isActive });
        } catch {
            setError('Error al cambiar estado');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !page) {
        return (
            <Box>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/pages')} sx={{ mb: 2 }}>
                    Volver
                </Button>
                <Alert severity="error">{error || 'Página no encontrada'}</Alert>
            </Box>
        );
    }

    const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000';

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/pages')}>
                    Volver a páginas
                </Button>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<OpenInNewIcon />}
                        href={`${frontendUrl}/p/${page.shortId}`}
                        target="_blank"
                    >
                        Ver página
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={page.isActive ? <ToggleOffIcon /> : <ToggleOnIcon />}
                        color={page.isActive ? 'warning' : 'success'}
                        onClick={handleToggle}
                    >
                        {page.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                </Box>
            </Box>

            {/* Page Info */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Typography variant="h5">{page.title}</Typography>
                    <Chip
                        label={page.pageType.toUpperCase()}
                        size="small"
                        color={page.pageType === 'pro' ? 'secondary' : 'default'}
                    />
                    <Chip
                        label={page.isActive ? 'Activa' : 'Inactiva'}
                        size="small"
                        color={page.isActive ? 'success' : 'default'}
                        variant="outlined"
                    />
                </Box>
                {page.message && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 600 }}>
                        {page.message}
                    </Typography>
                )}

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={3}>
                    {[
                        { label: 'Short ID', value: page.shortId },
                        { label: 'Destinatario', value: page.recipientName },
                        { label: 'Botón Sí', value: page.yesButtonText },
                        { label: 'Botón No', value: page.noButtonText },
                        { label: 'Botón No escapa', value: page.noButtonEscapes ? 'Sí' : 'No' },
                        { label: 'Tema', value: page.theme },
                        { label: 'Fuente título', value: page.titleFont },
                        { label: 'Fuente cuerpo', value: page.bodyFont },
                        { label: 'Animación', value: page.animation },
                        { label: 'Música', value: page.backgroundMusic },
                        { label: 'Watermark', value: page.showWatermark ? 'Sí' : 'No' },
                        { label: 'Creada', value: formatDateTime(page.createdAt) },
                    ].map((item) => (
                        <Grid size={{ xs: 6, sm: 4, md: 3 }} key={item.label}>
                            <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                            <Typography variant="body2" fontWeight={600}>{item.value}</Typography>
                        </Grid>
                    ))}
                </Grid>

                {/* Colors preview */}
                <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Colores:</Typography>
                    {[
                        { label: 'Fondo', color: page.backgroundColor },
                        { label: 'Texto', color: page.textColor },
                        { label: 'Acento', color: page.accentColor },
                    ].map((c) => (
                        <Tooltip key={c.label} title={`${c.label}: ${c.color}`}>
                            <Box
                                sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '6px',
                                    bgcolor: c.color,
                                    border: '2px solid rgba(255,255,255,0.1)',
                                }}
                            />
                        </Tooltip>
                    ))}
                </Box>

                {/* Owner */}
                {page.userId && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="caption" color="text.secondary">Propietario</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Typography variant="body2" fontWeight={600}>
                                {page.userId.displayName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                ({page.userId.email})
                            </Typography>
                            <Button size="small" onClick={() => navigate(`/users/${page.userId!._id}`)}>
                                Ver usuario
                            </Button>
                        </Box>
                    </Box>
                )}
            </Paper>

            {/* Stats */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Estadísticas</Typography>
                <Grid container spacing={3}>
                    {[
                        { label: 'Vistas totales', value: page.stats.views, color: '#60a5fa' },
                        { label: 'Vistas únicas', value: page.stats.uniqueViews, color: '#a78bfa' },
                        { label: 'Total respuestas', value: page.stats.totalResponses, color: '#f472b6' },
                        { label: 'Sí', value: `${page.stats.yesCount} (${page.stats.yesPercentage}%)`, color: '#34d399' },
                        { label: 'No', value: `${page.stats.noCount} (${page.stats.noPercentage}%)`, color: '#f87171' },
                    ].map((s) => (
                        <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={s.label}>
                            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)' }}>
                                <Typography variant="h5" sx={{ color: s.color, mb: 0.5 }}>{s.value}</Typography>
                                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Paper>

            {/* Responses */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Respuestas ({page.responses?.length || 0})
                </Typography>
                {!page.responses || page.responses.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">Sin respuestas aún</Typography>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Respuesta</TableCell>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell>Ubicación</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {page.responses.map((r) => (
                                    <TableRow key={r._id}>
                                        <TableCell>
                                            <Chip
                                                icon={r.answer === 'yes' ? <ThumbUpIcon sx={{ fontSize: 14 }} /> : <ThumbDownIcon sx={{ fontSize: 14 }} />}
                                                label={r.answer === 'yes' ? 'Sí' : 'No'}
                                                size="small"
                                                color={r.answer === 'yes' ? 'success' : 'error'}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>{formatDateTime(r.respondedAt)}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {r.location?.city && r.location?.country
                                                    ? `${r.location.city}, ${r.location.country}`
                                                    : '—'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
            <br />
            {
                page.backgroundImageUrl && (
                    <img width='100%' src={page.backgroundImageUrl} alt="" />
                )
            }
        </Box>
    );
};

export default PageDetailPage;