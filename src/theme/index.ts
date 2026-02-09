import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#f472b6',
            light: '#f9a8d4',
            dark: '#db2777',
        },
        secondary: {
            main: '#a78bfa',
            light: '#c4b5fd',
            dark: '#7c3aed',
        },
        background: {
            default: '#0c0a14',
            paper: '#151221',
        },
        error: {
            main: '#f87171',
        },
        warning: {
            main: '#fbbf24',
        },
        success: {
            main: '#34d399',
        },
        info: {
            main: '#60a5fa',
        },
        text: {
            primary: '#f1f0f5',
            secondary: '#9892a6',
        },
        divider: 'rgba(248, 245, 255, 0.08)',
    },
    typography: {
        fontFamily: '"DM Sans", sans-serif',
        h4: { fontWeight: 700, letterSpacing: '-0.02em' },
        h5: { fontWeight: 700, letterSpacing: '-0.01em' },
        h6: { fontWeight: 600 },
        subtitle1: { fontWeight: 500, color: '#9892a6' },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
        borderRadius: 14,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#2d2845 transparent',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    border: '1px solid rgba(248, 245, 255, 0.06)',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    padding: '8px 20px',
                },
                containedPrimary: {
                    background: 'linear-gradient(135deg, #f472b6, #a78bfa)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #f9a8d4, #c4b5fd)',
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                    borderRadius: 8,
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottomColor: 'rgba(248, 245, 255, 0.06)',
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 18,
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 10,
                    },
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    border: 'none',
                },
            },
        },
    },
});

export default theme;