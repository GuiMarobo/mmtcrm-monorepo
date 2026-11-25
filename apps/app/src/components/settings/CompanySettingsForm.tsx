import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { SectionCard, SectionToolbar } from '../common/SectionCard'
import { FormRow } from '../common/FormRow'
import { maskCnpj, maskPhone, sanitizeInteger } from '../../utils/format'
import { isValidCnpj, isValidPhone, validityDaysError } from '../../utils/validators'
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
  const cnpjProblem = cnpj && !isValidCnpj(cnpj) ? 'CNPJ inválido.' : undefined
  const phoneProblem = phone && !isValidPhone(phone) ? 'Telefone inválido - informe DDD + número.' : undefined
  const cnpjError = touched ? cnpjProblem : undefined
  const phoneError = touched ? phoneProblem : undefined

  const submit = async () => {
    setTouched(true)
    if (!name.trim() || validityDaysError(validity) || cnpjProblem || phoneProblem) return
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
            value={maskCnpj(cnpj)}
            onChange={(e) => setCnpj(maskCnpj(e.target.value))}
            placeholder="00.000.000/0000-00"
            error={!!cnpjError}
            helperText={cnpjError}
            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            fullWidth
          />
          <TextField
            label="Telefone"
            value={maskPhone(phone)}
            onChange={(e) => setPhone(maskPhone(e.target.value))}
            placeholder="(00) 00000-0000"
            error={!!phoneError}
            helperText={phoneError}
            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
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
            value={validity}
            onChange={(e) => setValidity(sanitizeInteger(e.target.value))}
            error={!!validityError}
            helperText={validityError ?? 'De 1 a 90 dias.'}
            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
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
