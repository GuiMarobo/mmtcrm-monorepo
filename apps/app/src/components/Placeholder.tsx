import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { PageHeader } from './common/PageHeader'

interface PlaceholderProps {
  title: string
  hint: string
}

export function Placeholder({ title, hint }: PlaceholderProps) {
  return (
    <Box>
      <PageHeader title={title} subtitle={hint} />

      <Paper
        variant="outlined"
        sx={{
          p: 7.5,
          borderStyle: 'dashed',
          textAlign: 'center',
          color: 'text.disabled',
          boxShadow: 'none',
        }}
      >
        <ExtensionOutlinedIcon sx={{ fontSize: 32, mb: 1 }} />
        <Typography sx={{ fontSize: 18, color: 'text.primary', fontWeight: 700, mb: 0.75 }}>
          Tela em construção
        </Typography>
        <Typography sx={{ maxWidth: 420, margin: '4px auto 0', lineHeight: 1.55 }}>
          Este módulo será desenhado na próxima iteração. Comece pelas telas de <b>Login</b>,{' '}
          <b>Clientes &amp; Leads</b> e <b>Usuários</b>.
        </Typography>
      </Paper>
    </Box>
  )
}
