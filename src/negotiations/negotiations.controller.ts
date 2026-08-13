import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NegotiationsService } from './negotiations.service';
import { CreateNegotiationDto } from './dto/create-negotiation.dto';
import { UpdateNegotiationDto } from './dto/update-negotiation.dto';
import { ReplaceNegotiationDto } from './dto/replace-negotiation.dto';
import { ConvertNegotiationDto } from './dto/convert-negotiation.dto';
import { RoleEnum } from 'src/users/dto/create-user.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiBearerAuth()
@Roles(RoleEnum.ADMIN, RoleEnum.VENDEDOR)
@Controller('negotiations')
export class NegotiationsController {
  constructor(private readonly negotiationsService: NegotiationsService) {}

  @Post()
  @ApiOperation({
    summary: 'Abrir uma negociação para um cliente',
    description:
      'A negociação nasce ABERTA. O vendedor responsável é sempre o usuário ' +
      'autenticado — mandar vendedorId no corpo não tem efeito.',
  })
  @ApiResponse({ status: 201, description: 'Negociação aberta' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  @ApiResponse({ status: 409, description: 'Cliente anonimizado (LGPD)' })
  create(
    @Body() dto: CreateNegotiationDto,
    @Req() req: { user: { id: number } },
  ) {
    return this.negotiationsService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar as negociações não excluídas' })
  findAll() {
    return this.negotiationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar uma negociação' })
  @ApiResponse({ status: 404, description: 'Negociação não encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.negotiationsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Substituir os dados da negociação' })
  @ApiResponse({
    status: 404,
    description: 'Negociação ou cliente não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Negociação fechada ou cliente anonimizado',
  })
  replace(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplaceNegotiationDto,
  ) {
    return this.negotiationsService.replace(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Alterar parcialmente a negociação' })
  @ApiResponse({ status: 400, description: 'PATCH sem nenhum campo' })
  @ApiResponse({
    status: 404,
    description: 'Negociação ou cliente não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Negociação fechada ou cliente anonimizado',
  })
  updatePartial(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNegotiationDto,
  ) {
    return this.negotiationsService.updatePartial(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir a negociação',
    description:
      'Exclusão lógica: a negociação e o pedido derivado recebem deleted_at e ' +
      'somem das consultas, preservando o histórico comercial e fiscal.',
  })
  @ApiResponse({ status: 404, description: 'Negociação não encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.negotiationsService.remove(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancelar a negociação (PERDIDA)',
    description: 'Só a partir de ABERTA. Não altera a situação do cliente.',
  })
  @ApiResponse({ status: 404, description: 'Negociação não encontrada' })
  @ApiResponse({ status: 409, description: 'Transição não permitida' })
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.negotiationsService.cancel(id);
  }

  @Post(':id/convert')
  @ApiOperation({
    summary: 'Converter a negociação em pedido (GANHA)',
    description:
      'A conversão é o que torna a negociação GANHA: gera o pedido, grava a data ' +
      'de fechamento e ativa o cliente. Reconverter após reabrir reaproveita o ' +
      'mesmo pedido, e não cria um segundo.',
  })
  @ApiResponse({ status: 201, description: 'Negociação ganha e pedido gerado' })
  @ApiResponse({ status: 404, description: 'Negociação não encontrada' })
  @ApiResponse({ status: 409, description: 'Transição não permitida' })
  convert(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConvertNegotiationDto,
  ) {
    return this.negotiationsService.convert(id, dto.paymentMethod);
  }

  @Patch(':id/reopen')
  @ApiOperation({
    summary: 'Reabrir a negociação (ABERTA)',
    description:
      'Limpa a data de fechamento. Vindo de GANHA, o pedido gerado passa a ' +
      'DESISTENCIA, preservando o registro da operação.',
  })
  @ApiResponse({ status: 404, description: 'Negociação não encontrada' })
  @ApiResponse({ status: 409, description: 'Negociação já está aberta' })
  reopen(@Param('id', ParseIntPipe) id: number) {
    return this.negotiationsService.reopen(id);
  }
}
