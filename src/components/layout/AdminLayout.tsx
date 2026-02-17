import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    Typography,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Avatar,
    IconButton,
    Divider,
    Tooltip,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/DashboardRounded';
import PeopleIcon from '@mui/icons-material/PeopleRounded';
import ArticleIcon from '@mui/icons-material/ArticleRounded';
import MailIcon from '@mui/icons-material/MailRounded';
import NotificationsIcon from '@mui/icons-material/NotificationsRounded';
import LogoutIcon from '@mui/icons-material/LogoutRounded';
import MenuIcon from '@mui/icons-material/MenuRounded';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useAuth } from '../../contexts/AuthContext';
import { TempleBuddhist } from '@mui/icons-material';

const DRAWER_WIDTH = 260;

const navItems = [
    { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { label: 'Usuarios', path: '/users', icon: <PeopleIcon /> },
    { label: 'Páginas', path: '/pages', icon: <ArticleIcon /> },
    { label: 'Contactos', path: '/contacts', icon: <MailIcon /> },
    { label: 'Plantillas', path: '/templates', icon: <TempleBuddhist /> },
    { label: 'Notificaciones', path: '/notifications', icon: <NotificationsIcon /> },
];

const AdminLayout: React.FC = () => {
    const { dbUser, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const drawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', py: 2 }}>
            {/* Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, mb: 3 }}>
                <Box
                    sx={{
                        width: 38,
                        height: 38,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #f472b6, #a78bfa)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <FavoriteIcon sx={{ fontSize: 20, color: '#fff' }} />
                </Box>
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2, color: 'text.primary' }}>
                        Love Pages
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
                        Admin Panel
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mx: 2, mb: 1 }} />

            {/* Nav */}
            <List sx={{ flex: 1, px: 1.5 }}>
                {navItems.map((item) => (
                    <ListItemButton
                        key={item.path}
                        onClick={() => {
                            navigate(item.path);
                            if (isMobile) setMobileOpen(false);
                        }}
                        sx={{
                            borderRadius: 2.5,
                            mb: 0.5,
                            px: 2,
                            py: 1.2,
                            color: isActive(item.path) ? 'primary.main' : 'text.secondary',
                            bgcolor: isActive(item.path) ? 'rgba(244,114,182,0.08)' : 'transparent',
                            '&:hover': {
                                bgcolor: isActive(item.path)
                                    ? 'rgba(244,114,182,0.12)'
                                    : 'rgba(248,245,255,0.04)',
                            },
                        }}
                    >
                        <ListItemIcon
                            sx={{
                                minWidth: 38,
                                color: isActive(item.path) ? 'primary.main' : 'text.secondary',
                            }}
                        >
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{ fontSize: 14, fontWeight: isActive(item.path) ? 600 : 500 }}
                        />
                    </ListItemButton>
                ))}
            </List>

            {/* User */}
            <Divider sx={{ mx: 2, mb: 1.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, gap: 1.5 }}>
                <Avatar
                    src={dbUser?.photoURL || undefined}
                    sx={{ width: 34, height: 34, fontSize: 14 }}
                >
                    {dbUser?.displayName?.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 600, fontSize: 13 }}>
                        {dbUser?.displayName}
                    </Typography>
                    <Typography variant="caption" noWrap sx={{ color: 'text.secondary', fontSize: 11 }}>
                        {dbUser?.email}
                    </Typography>
                </Box>
                <Tooltip title="Cerrar sesión">
                    <IconButton size="small" onClick={signOut} sx={{ color: 'text.secondary' }}>
                        <LogoutIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Sidebar */}
            {isMobile ? (
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: DRAWER_WIDTH,
                            bgcolor: 'background.paper',
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
            ) : (
                <Drawer
                    variant="permanent"
                    sx={{
                        width: DRAWER_WIDTH,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: DRAWER_WIDTH,
                            bgcolor: 'background.paper',
                            borderRight: '1px solid',
                            borderColor: 'divider',
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
            )}

            {/* Main content */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {isMobile && (
                    <AppBar
                        position="sticky"
                        elevation={0}
                        sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}
                    >
                        <Toolbar>
                            <IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
                                <MenuIcon />
                            </IconButton>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                Admin
                            </Typography>
                        </Toolbar>
                    </AppBar>
                )}

                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        p: { xs: 2, sm: 3, md: 4 },
                        maxWidth: 1400,
                        width: '100%',
                        mx: 'auto',
                    }}
                >
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default AdminLayout;