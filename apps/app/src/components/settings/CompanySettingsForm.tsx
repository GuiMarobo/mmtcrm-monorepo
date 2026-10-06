import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { SectionCard, SectionToolbar } from '../common/SectionCard'
import { FormRow } from '../common/FormRow'
import { validityDaysError } from '../../utils/validators'
import type { CompanySettings, ReplaceCompanySettingsPayload } from '../../types'

interface CompanySettingsFormProps {
  company: CompanySettings
  onSave: (payload: ReplaceCompanySettingsPayload) => Promise<void>
}

export function CompanySettingsForm({ company, onSave }: CompanySettingsFormProps) {
  const [name, setName] = useState(company.name)
  const [cnpj, setCnpj] = useState(company.cnpj ?? '')
  const [address, setAddress] = useState(company.address ?? '')
  const [phone, setPhone] = useState(company.phone ?? '')
  const [validity, setValidity] = useState(String(company.defaultValidityDays))
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)

  const nameError = touched && !name.trim() ? 'Informe o nome da loja.' : undefined
  const validityError = touched ? validityDaysError(validity) : undefined

  const submit = async () => {
    setTouched(true)
    if (!name.trim() || validityDaysError(validity)) return
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        cnpj: cnpj.trim() || null,
        address: address.trim() || null,
        phone: phone.trim() || null,
        defaultValidityDays: Number(validity),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard>
      <SectionToolbar>
        <Box>
          <Typography component="h2" sx={{ fontSize: 14, fontWeight: 700 }}>
            Dados da loja
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.disabled' }}>
            Saem no cabeçalho de todo Orçamento.
          </Typography>
        </Box>
      </SectionToolbar>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <TextField
          label="Nome da loja"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!!nameError}
          helperText={nameError}
          slotProps={{ htmlInput: { maxLength: 200 } }}
          fullWidth
        />
        <FormRow>
          <TextField
            label="CNPJ"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 40 } }}
            fullWidth
          />
          <TextField
            label="Telefone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 40 } }}
            fullWidth
          />
        </FormRow>
        <TextField
          label="Endereço"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 300 } }}
          fullWidth
        />
        <FormRow>
          <TextField
            label="Validade padrão do Orçamento (dias)"
            required
            type="number"
            value={validity}
            onChange={(e) => setValidity(e.target.value)}
            error={!!validityError}
            helperText={validityError ?? 'De 1 a 90 dias.'}
            slotProps={{ htmlInput: { inputMode: 'numeric', min: 1, max: 90, step: 1 } }}
            fullWidth
          />
        </FormRow>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<CheckOutlinedIcon />}
            onClick={() => void submit()}
            disabled={saving}
          >
            Salvar dados da loja
          </Button>
        </Box>
      </Box>
    </SectionCard>
  )
}
