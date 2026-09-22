import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '../users/dto/create-user.dto';
import { ReplaceCompanySettingsDto } from './dto/replace-company-settings.dto';
import { ReplaceInstallmentRatesDto } from './dto/replace-installment-rates.dto';
import { SettingsService } from './settings.service';

// RS1: a configuração é lida por ADMIN e VENDEDOR (o VENDEDOR precisa das taxas
// para simular o parcelamento) e escrita só pelo ADMIN, por @Roles na rota.
@ApiBearerAuth()
@Roles(RoleEnum.ADMIN, RoleEnum.VENDEDOR)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({
    summary: 'Consultar dados da loja, validade padrão e as 12 taxas',
    description:
      'Um único payload com a configuração da loja e a tabela de taxas de 1x a ' +
      '12x. Configuração ausente vale 7 dias de validade e 0% de taxa (RQ7).',
  })
  @ApiResponse({ status: 200, description: 'Configuração completa' })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  find() {
    return this.settingsService.find();
  }

  @Put('company')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Gravar dados da loja e validade padrão dos Orçamentos',
    description:
      'Nome, CNPJ, endereço e telefone saem no cabeçalho de toda proposta. CNPJ ' +
      'e telefone são texto, sem validação de formato. Validade padrão de 1 a ' +
      '90 dias (RS3).',
  })
  @ApiResponse({ status: 200, description: 'Configuração completa atualizada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  updateCompany(@Body() dto: ReplaceCompanySettingsDto) {
    return this.settingsService.updateCompany(dto);
  }

  @Put('installment-rates')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Gravar a tabela de taxas de parcelamento, de 1x a 12x',
    description:
      'As 12 linhas de uma vez (RS2). Recusa taxa fora de 0 a 100% ou conjunto ' +
      'que não cubra exatamente 1x a 12x.',
  })
  @ApiResponse({ status: 200, description: 'Configuração completa atualizada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  replaceInstallmentRates(@Body() dto: ReplaceInstallmentRatesDto) {
    return this.settingsService.replaceInstallmentRates(dto);
  }
}
