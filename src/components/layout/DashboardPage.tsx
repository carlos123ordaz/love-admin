import React, { useEffect, useState } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    CircularProgress,
    Alert,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/PeopleRounded';
import ArticleIcon from '@mui/icons-material/ArticleRounded';
import MailIcon from '@mui/icons-material/MailRounded';
import StarIcon from '@mui/icons-material/StarRounded';
import TrendingUpIcon from '@mui/icons-material/TrendingUpRounded';
import WarningIcon from '@mui/icons-material/WarningAmberRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircleRounded';
import PersonAddIcon from '@mui/icons-material/PersonAddRounded';
import { dashboardApi } from '../../api';
import type { DashboardStats } from '../../types';

interface StatCardProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    gradient: string;
    subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, gradient, subtitle }) => (
    <Paper
        sx={{
            p: 3,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: gradient,
            },
        }}
    >
        <Box
            sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                opacity: 0.9,
            }}
        >
            {icon}
        </Box>
        <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {label}
            </Typography>
            <Typography variant="h4" sx={{ lineHeight: 1 }}>
                {value.toLocaleString()}
            </Typography>
            {subtitle && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {subtitle}
                </Typography>
            )}
        </Box>
    </Paper>
);

const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await dashboardApi.getStats();
                if (data.success) setStats(data.data);
            } catch {
                setError('Error al cargar estadísticas');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !stats) {
        return <Alert severity="error">{error || 'Error desconocido'}</Alert>;
    }

    const cards: StatCardProps[] = [
        {
            label: 'Total Usuarios',
            value: stats.totalUsers,
            icon: <PeopleIcon sx={{ color: '#fff' }} />,
            gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
        },
        {
            label: 'Usuarios PRO',
            value: stats.proUsers,
            icon: <StarIcon sx={{ color: '#fff' }} />,
            gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        },
        {
            label: 'Total Páginas',
            value: stats.totalPages,
            icon: <ArticleIcon sx={{ color: '#fff' }} />,
            gradient: 'linear-gradient(135deg, #f472b6, #ec4899)',
        },
        {
            label: 'Páginas Activas',
            value: stats.activePages,
            icon: <CheckCircleIcon sx={{ color: '#fff' }} />,
            gradient: 'linear-gradient(135deg, #34d399, #10b981)',
        },
        {
            label: 'Total Contactos',
            value: stats.totalContacts,
            icon: <MailIcon sx={{ color: '#fff' }} />,
            gradient: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
        },
        {
            label: 'Contactos Pendientes',
            value: stats.pendingContacts,
            icon: <WarningIcon sx={{ color: '#fff' }} />,
            gradient: 'linear-gradient(135deg, #fb923c, #f97316)',
        },
        {
            label: 'Nuevos Usuarios (7d)',
            value: stats.newUsersLast7Days,
            icon: <PersonAddIcon sx={{ color: '#fff' }} />,
            gradient: 'linear-gradient(135deg, #67e8f9, #06b6d4)',
        },
        {
            label: 'Nuevas Páginas (7d)',
            value: stats.newPagesLast7Days,
            icon: <TrendingUpIcon sx={{ color: '#fff' }} />,
            gradient: 'linear-gradient(135deg, #c084fc, #a855f7)',
        },
    ];

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 0.5 }}>
                Dashboard
            </Typography>
            <Typography variant="subtitle1" sx={{ mb: 4 }}>
                Resumen general del sistema
            </Typography>

            <Grid container spacing={3}>
                {cards.map((card) => (
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={card.label}>
                        <StatCard {...card} />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default DashboardPage;