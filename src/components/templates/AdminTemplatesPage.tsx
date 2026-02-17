import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormControlLabel,
    Switch,
    Grid,
    Alert,
    CircularProgress,
    Tooltip,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import AddIcon from '@mui/icons-material/AddRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import VisibilityIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOffRounded';
import CodeIcon from '@mui/icons-material/CodeRounded';
import PreviewIcon from '@mui/icons-material/PreviewRounded';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircleOutlineRounded';
import { adminApi } from '../../api';


// ============================================================
// TYPES
// ============================================================

interface EditableField {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'color' | 'image_url';
    defaultValue: string;
    placeholder: string;
    maxLength: number;
    required: boolean;
    order: number;
}

interface Template {
    _id: string;
    name: string;
    description: string;
    previewImageUrl: string;
    category: string;
    html: string;
    css: string;
    editableFields: EditableField[];
    isPro: boolean;
    isActive: boolean;
    sortOrder: number;
    tags: string[];
    usageCount: number;
    createdAt: string;
    updatedAt: string;
}

const CATEGORIES = [
    { id: 'san-valentin', label: 'San Valentín' },
    { id: 'cumpleanos', label: 'Cumpleaños' },
    { id: 'aniversario', label: 'Aniversario' },
    { id: 'declaracion', label: 'Declaración' },
    { id: 'amistad', label: 'Amistad' },
    { id: 'navidad', label: 'Navidad' },
    { id: 'otro', label: 'Otro' },
];

const FIELD_TYPES = [
    { id: 'text', label: 'Texto corto' },
    { id: 'textarea', label: 'Texto largo' },
    { id: 'color', label: 'Color' },
    { id: 'image_url', label: 'URL de imagen' },
];

const emptyField: EditableField = {
    key: '',
    label: '',
    type: 'text',
    defaultValue: '',
    placeholder: '',
    maxLength: 200,
    required: false,
    order: 0,
};

const emptyTemplate = {
    name: '',
    description: '',
    previewImageUrl: '',
    category: 'otro',
    html: '',
    css: '',
    editableFields: [] as EditableField[],
    isPro: false,
    isActive: true,
    sortOrder: 0,
    tags: [] as string[],
};

// ============================================================
// COMPONENT
// ============================================================

const AdminTemplatesPage: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [formData, setFormData] = useState(emptyTemplate);
    const [saving, setSaving] = useState(false);
    const [tagsInput, setTagsInput] = useState('');

    // Preview
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewHtml, setPreviewHtml] = useState('');

    // ============================================================
    // DATA LOADING
    // ============================================================

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const { data } = await adminApi.getTemplates();
            if (data.success) setTemplates(data.data);
        } catch {
            setError('Error al cargar plantillas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    // ============================================================
    // MODAL HANDLERS
    // ============================================================

    const openCreateModal = () => {
        setEditingTemplate(null);
        setFormData({ ...emptyTemplate, editableFields: [] });
        setTagsInput('');
        setModalOpen(true);
    };

    const openEditModal = (template: Template) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            description: template.description,
            previewImageUrl: template.previewImageUrl,
            category: template.category,
            html: template.html,
            css: template.css,
            editableFields: [...template.editableFields],
            isPro: template.isPro,
            isActive: template.isActive,
            sortOrder: template.sortOrder,
            tags: [...template.tags],
        });
        setTagsInput(template.tags.join(', '));
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingTemplate(null);
    };

    // ============================================================
    // EDITABLE FIELDS MANAGEMENT
    // ============================================================

    const addField = () => {
        setFormData((prev) => ({
            ...prev,
            editableFields: [
                ...prev.editableFields,
                { ...emptyField, order: prev.editableFields.length },
            ],
        }));
    };

    const updateField = (index: number, updates: Partial<EditableField>) => {
        setFormData((prev) => {
            const fields = [...prev.editableFields];
            fields[index] = { ...fields[index], ...updates };

            // Auto-generar key a partir del label
            if (updates.label && !fields[index].key) {
                fields[index].key = updates.label
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, '_')
                    .replace(/_+/g, '_')
                    .replace(/^_|_$/g, '');
            }

            return { ...prev, editableFields: fields };
        });
    };

    const removeField = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            editableFields: prev.editableFields.filter((_, i) => i !== index),
        }));
    };

    // ============================================================
    // SAVE / DELETE
    // ============================================================

    const handleSave = async () => {
        if (!formData.name || !formData.html || !formData.css) {
            setError('Nombre, HTML y CSS son requeridos');
            return;
        }

        if (!formData.previewImageUrl) {
            setError('La URL de imagen de preview es requerida');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const payload = {
                ...formData,
                tags: tagsInput
                    .split(',')
                    .map((t) => t.trim().toLowerCase())
                    .filter(Boolean),
            };

            if (editingTemplate) {
                await adminApi.updateTemplate(editingTemplate._id, payload);
            } else {
                await adminApi.createTemplate(payload);
            }

            closeModal();
            loadTemplates();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar esta plantilla?')) return;

        try {
            await adminApi.deleteTemplate(id);
            loadTemplates();
        } catch {
            setError('Error al eliminar');
        }
    };

    const handleToggle = async (id: string) => {
        try {
            await adminApi.toggleTemplate(id);
            loadTemplates();
        } catch {
            setError('Error al cambiar estado');
        }
    };

    // ============================================================
    // PREVIEW
    // ============================================================

    const showPreview = (template?: typeof formData) => {
        const src = template || formData;
        let html = src.html;
        let css = src.css;

        // Replace placeholders with default values
        for (const field of src.editableFields) {
            const placeholder = `{{${field.key}}}`;
            const value = field.defaultValue || `[${field.label}]`;
            html = html.replaceAll(placeholder, value);
            css = css.replaceAll(placeholder, value);
        }

        const fullHtml = `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box;}body{overflow-x:hidden;}${css}</style>
</head><body>${html}</body></html>`;

        setPreviewHtml(fullHtml);
        setPreviewOpen(true);
    };

    // ============================================================
    // RENDER
    // ============================================================

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <div>
                    <Typography variant="h4" sx={{ mb: 0.5 }}>
                        Plantillas
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {templates.length} plantilla{templates.length !== 1 ? 's' : ''} creada{templates.length !== 1 ? 's' : ''}
                    </Typography>
                </div>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openCreateModal}
                    sx={{
                        background: 'linear-gradient(135deg, #f472b6, #ec4899)',
                        '&:hover': { background: 'linear-gradient(135deg, #ec4899, #db2777)' },
                    }}
                >
                    Nueva Plantilla
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Templates Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Preview</TableCell>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Categoría</TableCell>
                            <TableCell>Campos</TableCell>
                            <TableCell>PRO</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Usos</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {templates.map((tmpl) => (
                            <TableRow key={tmpl._id} hover>
                                <TableCell>
                                    <Box
                                        component="img"
                                        src={tmpl.previewImageUrl}
                                        alt={tmpl.name}
                                        sx={{
                                            width: 80,
                                            height: 60,
                                            objectFit: 'cover',
                                            borderRadius: 1,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={600}>
                                        {tmpl.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                                        {tmpl.description}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={CATEGORIES.find((c) => c.id === tmpl.category)?.label || tmpl.category}
                                        size="small"
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>{tmpl.editableFields.length}</TableCell>
                                <TableCell>
                                    {tmpl.isPro ? (
                                        <Chip label="PRO" size="small" sx={{ bgcolor: '#fbbf24', color: '#fff', fontWeight: 700 }} />
                                    ) : (
                                        <Chip label="Free" size="small" variant="outlined" />
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={tmpl.isActive ? 'Activa' : 'Inactiva'}
                                        size="small"
                                        color={tmpl.isActive ? 'success' : 'default'}
                                        variant={tmpl.isActive ? 'filled' : 'outlined'}
                                    />
                                </TableCell>
                                <TableCell>{tmpl.usageCount}</TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Preview">
                                        <IconButton size="small" onClick={() => showPreview(tmpl)}>
                                            <PreviewIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={tmpl.isActive ? 'Desactivar' : 'Activar'}>
                                        <IconButton size="small" onClick={() => handleToggle(tmpl._id)}>
                                            {tmpl.isActive ? (
                                                <VisibilityIcon fontSize="small" color="success" />
                                            ) : (
                                                <VisibilityOffIcon fontSize="small" />
                                            )}
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Editar">
                                        <IconButton size="small" onClick={() => openEditModal(tmpl)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Eliminar">
                                        <IconButton size="small" color="error" onClick={() => handleDelete(tmpl._id)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                        {templates.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6 }}>
                                    <Typography color="text.secondary">
                                        No hay plantillas creadas. Haz click en "Nueva Plantilla" para comenzar.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* ============================================================ */}
            {/* CREATE/EDIT MODAL */}
            {/* ============================================================ */}
            <Dialog open={modalOpen} onClose={closeModal} maxWidth="lg" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                        {/* Basic info */}
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Nombre *"
                                    fullWidth
                                    value={formData.name}
                                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                                    placeholder="Carta de San Valentín"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Categoría</InputLabel>
                                    <Select
                                        value={formData.category}
                                        label="Categoría"
                                        onChange={(e) =>
                                            setFormData((p) => ({ ...p, category: e.target.value }))
                                        }
                                    >
                                        {CATEGORIES.map((c) => (
                                            <MenuItem key={c.id} value={c.id}>
                                                {c.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    label="Descripción *"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData((p) => ({ ...p, description: e.target.value }))
                                    }
                                    placeholder="Una carta romántica con fondo de pétalos..."
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 8 }}>
                                <TextField
                                    label="URL imagen de preview *"
                                    fullWidth
                                    value={formData.previewImageUrl}
                                    onChange={(e) =>
                                        setFormData((p) => ({ ...p, previewImageUrl: e.target.value }))
                                    }
                                    placeholder="https://storage.googleapis.com/..."
                                    helperText="Captura de pantalla del diseño (recomendado 800x600)"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    label="Orden"
                                    type="number"
                                    fullWidth
                                    value={formData.sortOrder}
                                    onChange={(e) =>
                                        setFormData((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))
                                    }
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Tags (separados por coma)"
                                    fullWidth
                                    value={tagsInput}
                                    onChange={(e) => setTagsInput(e.target.value)}
                                    placeholder="amor, romántico, carta"
                                />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.isPro}
                                            onChange={(e) =>
                                                setFormData((p) => ({ ...p, isPro: e.target.checked }))
                                            }
                                        />
                                    }
                                    label="Solo PRO"
                                />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.isActive}
                                            onChange={(e) =>
                                                setFormData((p) => ({ ...p, isActive: e.target.checked }))
                                            }
                                        />
                                    }
                                    label="Activa"
                                />
                            </Grid>
                        </Grid>

                        <Divider />

                        {/* HTML/CSS Code */}
                        <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CodeIcon /> Código HTML/CSS
                        </Typography>
                        <Alert severity="info" sx={{ fontSize: 13 }}>
                            Usa <code>{`{{NOMBRE_DEL_CAMPO}}`}</code> como placeholder en el HTML y CSS.
                            Estos se reemplazarán con los valores que el usuario ingrese.
                            Ejemplo: <code>{`{{TITULO}}`}</code>, <code>{`{{MENSAJE}}`}</code>, <code>{`{{COLOR_FONDO}}`}</code>
                        </Alert>

                        <TextField
                            label="HTML"
                            fullWidth
                            multiline
                            rows={12}
                            value={formData.html}
                            onChange={(e) => setFormData((p) => ({ ...p, html: e.target.value }))}
                            placeholder='<div class="container">&#10;  <h1>{{TITULO}}</h1>&#10;  <p>{{MENSAJE}}</p>&#10;</div>'
                            InputProps={{
                                sx: { fontFamily: 'monospace', fontSize: 13 },
                            }}
                        />

                        <TextField
                            label="CSS"
                            fullWidth
                            multiline
                            rows={10}
                            value={formData.css}
                            onChange={(e) => setFormData((p) => ({ ...p, css: e.target.value }))}
                            placeholder='.container {&#10;  background: {{COLOR_FONDO}};&#10;  text-align: center;&#10;}'
                            InputProps={{
                                sx: { fontFamily: 'monospace', fontSize: 13 },
                            }}
                        />

                        <Button
                            variant="outlined"
                            startIcon={<PreviewIcon />}
                            onClick={() => showPreview()}
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            Vista Previa
                        </Button>

                        <Divider />

                        {/* Editable Fields */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" fontWeight={700}>
                                Campos Editables ({formData.editableFields.length})
                            </Typography>
                            <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addField}>
                                Agregar Campo
                            </Button>
                        </Box>

                        {formData.editableFields.length === 0 && (
                            <Alert severity="warning">
                                No hay campos editables. Agrega campos para que los usuarios puedan personalizar la plantilla.
                            </Alert>
                        )}

                        {formData.editableFields.map((field, index) => (
                            <Paper key={index} sx={{ p: 2, bgcolor: 'grey.50' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                                    <Typography variant="body2" fontWeight={600} color="text.secondary">
                                        Campo #{index + 1}
                                        {field.key && (
                                            <Chip
                                                label={`{{${field.key}}}`}
                                                size="small"
                                                sx={{ ml: 1, fontFamily: 'monospace', fontSize: 11 }}
                                            />
                                        )}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => removeField(index)}
                                    >
                                        <RemoveCircleIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <TextField
                                            label="Etiqueta"
                                            fullWidth
                                            size="small"
                                            value={field.label}
                                            onChange={(e) => updateField(index, { label: e.target.value })}
                                            placeholder="Título principal"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <TextField
                                            label="Key (placeholder)"
                                            fullWidth
                                            size="small"
                                            value={field.key}
                                            onChange={(e) =>
                                                updateField(index, {
                                                    key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''),
                                                })
                                            }
                                            placeholder="TITULO"
                                            helperText={field.key ? `Usa {{${field.key}}} en el código` : ''}
                                            InputProps={{ sx: { fontFamily: 'monospace' } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Tipo</InputLabel>
                                            <Select
                                                value={field.type}
                                                label="Tipo"
                                                onChange={(e) =>
                                                    updateField(index, { type: e.target.value as EditableField['type'] })
                                                }
                                            >
                                                {FIELD_TYPES.map((ft) => (
                                                    <MenuItem key={ft.id} value={ft.id}>
                                                        {ft.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <TextField
                                            label="Valor por defecto"
                                            fullWidth
                                            size="small"
                                            value={field.defaultValue}
                                            onChange={(e) => updateField(index, { defaultValue: e.target.value })}
                                            placeholder="¿Quieres ser mi valentín?"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <TextField
                                            label="Placeholder"
                                            fullWidth
                                            size="small"
                                            value={field.placeholder}
                                            onChange={(e) => updateField(index, { placeholder: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 6, sm: 2 }}>
                                        <TextField
                                            label="Max length"
                                            type="number"
                                            fullWidth
                                            size="small"
                                            value={field.maxLength}
                                            onChange={(e) =>
                                                updateField(index, { maxLength: parseInt(e.target.value) || 200 })
                                            }
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 6, sm: 2 }}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={field.required}
                                                    onChange={(e) => updateField(index, { required: e.target.checked })}
                                                    size="small"
                                                />
                                            }
                                            label={<Typography variant="caption">Requerido</Typography>}
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    {error && (
                        <Alert severity="error" sx={{ mr: 'auto', py: 0 }}>
                            {error}
                        </Alert>
                    )}
                    <Button onClick={closeModal}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving}
                        sx={{
                            background: 'linear-gradient(135deg, #f472b6, #ec4899)',
                            '&:hover': { background: 'linear-gradient(135deg, #ec4899, #db2777)' },
                        }}
                    >
                        {saving ? <CircularProgress size={20} /> : editingTemplate ? 'Guardar Cambios' : 'Crear Plantilla'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ============================================================ */}
            {/* PREVIEW MODAL */}
            {/* ============================================================ */}
            <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Vista Previa</DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <iframe
                        title="Template Preview"
                        srcDoc={previewHtml}
                        style={{
                            width: '100%',
                            height: '600px',
                            border: 'none',
                        }}
                        sandbox="allow-same-origin"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminTemplatesPage;