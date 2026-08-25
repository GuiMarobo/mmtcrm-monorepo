import { createTheme } from '@mui/material/styles'

export const BORDER = '#ececef'
export const BORDER_STRONG = '#e1e3e6'
export const SURFACE_HOVER = '#fafbfc'
export const SUBTLE_HOVER = '#f1f3f5'
export const HEADER_BG = '#fafbfc'
export const SHADOW_SM = '0 1px 2px rgba(15, 17, 22, 0.04)'
export const SHADOW_MD = '0 4px 12px rgba(15, 17, 22, 0.06)'
export const SHADOW_DIALOG = '0 24px 60px rgba(15, 17, 22, 0.18)'
export const SCRIM = 'rgba(15, 17, 22, 0.4)'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2f6dff', dark: '#2360ee', light: '#eaf1ff', contrastText: '#ffffff' },
    success: { main: '#16a34a' },
    warning: { main: '#b45309' },
    error: { main: '#dc2626' },
    info: { main: '#2563eb' },
    background: { default: '#f4f5f7', paper: '#ffffff' },
    text: { primary: '#0e1116', secondary: '#4b5563', disabled: '#8a8f98' },
    divider: BORDER,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'Hanken Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: 14,
    body1: { fontSize: 14 },
    body2: { fontSize: 13 },
    h5: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontSize: 16, fontWeight: 700 },
    subtitle1: { fontSize: 14, fontWeight: 600 },
    subtitle2: { fontSize: 12.5, fontWeight: 600 },
    caption: { fontSize: 12 },
    button: { fontSize: 13, fontWeight: 600, textTransform: 'none' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body, #app': { height: '100%' },
        body: { fontSize: 14, WebkitFontSmoothing: 'antialiased' },
        'button, input, select, textarea': { fontFamily: 'inherit' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { height: 38, borderRadius: 10, paddingLeft: 14, paddingRight: 14 },
        sizeSmall: {
          height: 32,
          fontSize: 12.5,
          borderRadius: 8,
          paddingLeft: 10,
          paddingRight: 10,
        },
        outlined: {
          borderColor: BORDER_STRONG,
          color: '#0e1116',
          backgroundColor: '#ffffff',
          '&:hover': { backgroundColor: SURFACE_HOVER, borderColor: BORDER_STRONG },
        },
        text: { '&:hover': { backgroundColor: SUBTLE_HOVER } },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: 7, color: '#8a8f98', '&:hover': { backgroundColor: SUBTLE_HOVER } },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 12 },
        outlined: { borderColor: BORDER },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 600 },
        sizeSmall: {
          height: 22,
          fontSize: 11.5,
          '& .MuiChip-label': { paddingLeft: 10, paddingRight: 10 },
        },
      },
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiSelect: { defaultProps: { size: 'small' } },
    MuiCheckbox: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 9, backgroundColor: '#ffffff' },
        notchedOutline: { borderColor: BORDER_STRONG },
        input: { fontSize: 13.5 },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { fontSize: 13.5 } } },
    MuiFormLabel: { styleOverrides: { root: { fontSize: 12, fontWeight: 600 } } },
    MuiFormHelperText: { styleOverrides: { root: { fontSize: 12, marginLeft: 0 } } },
    MuiBackdrop: { styleOverrides: { root: { backgroundColor: SCRIM } } },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 14, boxShadow: SHADOW_DIALOG } },
    },
    MuiPopover: {
      styleOverrides: {
        paper: { borderRadius: 10, border: `1px solid ${BORDER_STRONG}`, boxShadow: SHADOW_MD },
      },
    },
    MuiMenu: { styleOverrides: { list: { padding: 6, minWidth: 200 } } },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: 13.5,
          fontWeight: 500,
          gap: 10,
          minHeight: 0,
          paddingTop: 9,
          paddingBottom: 9,
          color: '#4b5563',
          '&:hover': { backgroundColor: '#f6f7f9', color: '#0e1116' },
        },
      },
    },
    MuiListItemIcon: { styleOverrides: { root: { minWidth: 0, color: '#8a8f98' } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 8, fontSize: 13 } } },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: BORDER, fontSize: 13.5, padding: '14px 16px' },
        head: {
          backgroundColor: HEADER_BG,
          color: '#8a8f98',
          fontSize: 11.5,
          fontWeight: 600,
          padding: '12px 16px',
        },
      },
    },
  },
})
