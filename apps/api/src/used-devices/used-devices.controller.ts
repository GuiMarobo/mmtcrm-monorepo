import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '../users/dto/create-user.dto';
import { CreateUsedDeviceDto } from './dto/create-used-device.dto';
import { UpdateUsedDeviceDto } from './dto/update-used-device.dto';
import { UsedDevicesService } from './used-devices.service';

// Lado do Vendedor (spec 007): o aparelho nasce e é mantido dentro da
// Negociação, por ADMIN e VENDEDOR. O lado do Técnico (fila e avaliação) tem
// perfis próprios, por isso o @Roles fica em cada rota.
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
}
