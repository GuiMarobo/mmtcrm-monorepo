import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleEnum } from '../users/dto/create-user.dto';
import { IssueQuotationDto } from './dto/issue-quotation.dto';
import { QuotationsService } from './quotations.service';

// RQ3: ADMIN e VENDEDOR, sem restrição de responsável. RQ8: o Orçamento é
// imutável — não existe rota de edição nem de exclusão.
@ApiBearerAuth()
@Roles(RoleEnum.ADMIN, RoleEnum.VENDEDOR)
@Controller()
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post('negotiations/:id/quotations')
  @ApiOperation({
    summary: 'Emitir um Orçamento a partir da negociação',
    description:
      'Congela os itens da negociação e calcula no backend o total à vista, o ' +
      'total com juros e a parcela; do corpo vêm só o nº de parcelas, a taxa e ' +
      'a validade. Taxa e validade ausentes vêm da configuração (0% e 7 dias se ' +
      'nunca configurada). Não muda a negociação, o pedido nem o estoque.',
  })
  @ApiResponse({ status: 201, description: 'Orçamento emitido' })
  @ApiResponse({
    status: 400,
    description:
      'Parcelas fora de 1 a 12, taxa fora de 0 a 100% ou validade fora de ' +
      'amanhã a hoje + 90 dias',
  })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  @ApiResponse({ status: 404, description: 'Negociação não encontrada' })
  @ApiResponse({
    status: 409,
    description: 'Negociação não está em aberto ou não tem itens',
  })
  issue(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: IssueQuotationDto,
    @Req() req: { user: { id: number } },
  ) {
    return this.quotationsService.issue(id, dto, req.user.id);
  }

  @Get('negotiations/:id/quotations')
  @ApiOperation({
    summary: 'Listar os Orçamentos emitidos da negociação',
    description:
      'Do mais novo para o mais antigo, todos válidos ao mesmo tempo. "expired" ' +
      'é derivado na leitura (validade antes de hoje) e não bloqueia nada.',
  })
  @ApiResponse({ status: 200, description: 'Orçamentos da negociação' })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  @ApiResponse({ status: 404, description: 'Negociação não encontrada' })
  findByNegotiation(@Param('id', ParseIntPipe) id: number) {
    return this.quotationsService.findByNegotiation(id);
  }
}
