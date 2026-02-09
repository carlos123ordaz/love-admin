import React from 'react';
import {
    Box,
    Button,
    Typography,
    Paper,
    CircularProgress,
    Alert,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage: React.FC = () => {
    const { signInWithGoogle, loading, error } = useAuth();

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(ellipse at 30% 20%, rgba(244,114,182,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(167,139,250,0.10) 0%, transparent 60%), #0c0a14',
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: 5,
                    maxWidth: 420,
                    width: '100%',
                    textAlign: 'center',
                    background: 'rgba(21, 18, 33, 0.85)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(248,245,255,0.08)',
                }}
            >
                <Box
                    sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #f472b6, #a78bfa)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3,
                    }}
                >
                    <FavoriteIcon sx={{ fontSize: 32, color: '#fff' }} />
                </Box>

                <Typography variant="h5" gutterBottom>
                    Love Pages Admin
                </Typography>
                <Typography variant="subtitle1" sx={{ mb: 4 }}>
                    Panel de administración
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
                    onClick={signInWithGoogle}
                    disabled={loading}
                    sx={{ py: 1.5 }}
                >
                    {loading ? 'Verificando…' : 'Ingresar con Google'}
                </Button>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 3, fontSize: 12 }}>
                    Solo usuarios con permisos de administrador pueden acceder.
                </Typography>
            </Paper>
        </Box>
    );
};

export default LoginPage;