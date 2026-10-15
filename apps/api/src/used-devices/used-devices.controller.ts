import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '../users/dto/create-user.dto';
import { CreateUsedDeviceDto } from './dto/create-used-device.dto';
import { UpdateUsedDeviceDto } from './dto/update-used-device.dto';
import { EvaluateUsedDeviceDto } from './dto/evaluate-used-device.dto';
import { RefuseUsedDeviceDto } from './dto/refuse-used-device.dto';
import {
  ListUsedDevicesQueryDto,
  UsedDeviceQueueFilter,
} from './dto/list-used-devices-query.dto';
import { UsedDevicesService } from './used-devices.service';

// Spec 007: o lado do Vendedor (o aparelho nasce e é mantido dentro da
// Negociação) é de ADMIN e VENDEDOR; o lado do Técnico (fila e avaliação), de
// ADMIN e TECNICO. Por isso o @Roles fica em cada rota.
@ApiBearerAuth()
@Controller()
export class UsedDevicesController {
  constructor(private readonly usedDevicesService: UsedDevicesService) {}

  @Post('negotiations/:id/used-devices')
  @Roles(RoleEnum.ADMIN, RoleEnum.VENDEDOR)
  @ApiOperation({
    summary: 'Cadastrar um aparelho na troca da negociação',
    description:
      'O aparelho nasce aguardando avaliação. A série é gravada sem espaços ' +
      'nas pontas e em maiúsculas. Série repetida não bloqueia: ' +
      '"serialSeenBefore" diz quantos aparelhos não excluídos já tiveram essa ' +
      'série. Não muda o total da negociação.',
  })
  @ApiResponse({ status: 201, description: 'Aparelho cadastrado' })
  @ApiResponse({
    status: 400,
    description: 'Modelo ou série vazios, ou IMEI sem 15 dígitos',
  })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  @ApiResponse({ status: 404, description: 'Negociação não encontrada' })
  @ApiResponse({ status: 409, description: 'Negociação não está em aberto' })
  create(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateUsedDeviceDto,
    @Req() req: { user: { id: number } },
  ) {
    return this.usedDevicesService.create(id, dto, req.user.id);
  }

  @Get('negotiations/:id/used-devices')
  @Roles(RoleEnum.ADMIN, RoleEnum.VENDEDOR)
  @ApiOperation({
    summary: 'Listar os aparelhos na troca da negociação',
    description: 'Os não excluídos, na ordem do cadastro, com a avaliação.',
  })
  @ApiResponse({ status: 200, description: 'Aparelhos da negociação' })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  @ApiResponse({ status: 404, description: 'Negociação não encontrada' })
  findByNegotiation(@Param('id', ParseIntPipe) id: number) {
    return this.usedDevicesService.findByNegotiation(id);
  }

  @Patch('used-devices/:id')
  @Roles(RoleEnum.ADMIN, RoleEnum.VENDEDOR)
  @ApiOperation({
    summary: 'Corrigir modelo, série ou IMEI do aparelho',
    description:
      'Só com a negociação em aberto e o aparelho aguardando avaliação.',
  })
  @ApiResponse({ status: 200, description: 'Aparelho corrigido' })
  @ApiResponse({
    status: 400,
    description: 'Modelo ou série vazios, ou IMEI sem 15 dígitos',
  })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  @ApiResponse({ status: 404, description: 'Aparelho não encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Negociação não está em aberto ou aparelho já avaliado',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsedDeviceDto,
  ) {
    return this.usedDevicesService.update(id, dto);
  }

  @Delete('used-devices/:id')
  @Roles(RoleEnum.ADMIN, RoleEnum.VENDEDOR)
  @ApiOperation({
    summary: 'Remover o aparelho da troca',
    description:
      'Exclusão lógica, com a negociação em aberto, qualquer que seja o ' +
      'resultado da avaliação.',
  })
  @ApiResponse({ status: 200, description: 'Aparelho removido' })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  @ApiResponse({ status: 404, description: 'Aparelho não encontrado' })
  @ApiResponse({ status: 409, description: 'Negociação não está em aberto' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usedDevicesService.remove(id);
  }

  @Get('used-devices')
  @Roles(RoleEnum.ADMIN, RoleEnum.TECNICO)
  @ApiOperation({
    summary: 'Fila de avaliação',
    description:
      'Padrão (AGUARDANDO): aparelhos aguardando avaliação de negociações em ' +
      'aberto, do mais antigo para o mais novo. AVALIADO, RECUSADO e TODOS ' +
      'incluem negociações fechadas, o mais recente primeiro. Cada linha traz ' +
      'Cliente, Vendedor e situação da negociação, sem itens nem valores.',
  })
  @ApiQuery({ name: 'status', required: false, enum: UsedDeviceQueueFilter })
  @ApiResponse({ status: 200, description: 'Aparelhos da fila' })
  @ApiResponse({ status: 400, description: 'Filtro inválido' })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  findQueue(@Query() query: ListUsedDevicesQueryDto) {
    return this.usedDevicesService.findQueue(query);
  }

  @Get('used-devices/summary')
  @Roles(RoleEnum.ADMIN, RoleEnum.TECNICO)
  @ApiOperation({
    summary: 'Métricas da tela Dispositivos Usados',
    description:
      '"awaiting": aparelhos da fila padrão (aguardando avaliação, de ' +
      'negociações em aberto). "receivedThisMonth": quantidade e soma dos ' +
      'valores estimados dos aparelhos avaliados de negociações ganhas no mês ' +
      'corrente, no fuso da loja.',
  })
  @ApiResponse({ status: 200, description: 'Métricas' })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  summary() {
    return this.usedDevicesService.summary();
  }

  @Get('used-devices/:id')
  @Roles(RoleEnum.ADMIN, RoleEnum.TECNICO)
  @ApiOperation({
    summary: 'Detalhar o aparelho, com o histórico da série',
    description:
      '"serialHistory" lista os outros aparelhos não excluídos com a mesma ' +
      'série: data, resultado, condição e valor.',
  })
  @ApiResponse({ status: 200, description: 'Aparelho' })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  @ApiResponse({ status: 404, description: 'Aparelho não encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usedDevicesService.findOne(id);
  }

  @Post('used-devices/:id/evaluate')
  @Roles(RoleEnum.ADMIN, RoleEnum.TECNICO)
  @ApiOperation({
    summary: 'Avaliar o aparelho',
    description:
      'Exige iCloud liberado e valor estimado maior que zero. O valor ' +
      'estimado é o valor de troca. Reavaliar sobrescreve a avaliação anterior.',
  })
  @ApiResponse({ status: 201, description: 'Aparelho avaliado' })
  @ApiResponse({
    status: 400,
    description: 'Condição inválida, valor não positivo ou iCloud não liberado',
  })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  @ApiResponse({ status: 404, description: 'Aparelho não encontrado' })
  @ApiResponse({ status: 409, description: 'Negociação não está em aberto' })
  evaluate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EvaluateUsedDeviceDto,
    @Req() req: { user: { id: number } },
  ) {
    return this.usedDevicesService.evaluate(id, dto, req.user.id);
  }

  @Post('used-devices/:id/refuse')
  @Roles(RoleEnum.ADMIN, RoleEnum.TECNICO)
  @ApiOperation({
    summary: 'Recusar o aparelho',
    description:
      'O laudo é o motivo e é obrigatório. Limpa condição e valor estimado.',
  })
  @ApiResponse({ status: 201, description: 'Aparelho recusado' })
  @ApiResponse({ status: 400, description: 'Laudo vazio' })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  @ApiResponse({ status: 404, description: 'Aparelho não encontrado' })
  @ApiResponse({ status: 409, description: 'Negociação não está em aberto' })
  refuse(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RefuseUsedDeviceDto,
    @Req() req: { user: { id: number } },
  ) {
    return this.usedDevicesService.refuse(id, dto, req.user.id);
  }
}
