import { Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RoleEnum } from 'src/users/dto/create-user.dto';
import { OrdersService } from './orders.service';

@ApiBearerAuth()
@Roles(RoleEnum.ADMIN, RoleEnum.VENDEDOR)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar os pedidos não excluídos, na ordem da fila de cobrança',
    description:
      'Todos os pedidos, de qualquer vendedor (RN14). Ordem padrão: "Aguardando ' +
      'Pagamento" primeiro, do mais antigo para o mais novo por "situação desde".',
  })
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar um pedido e a negociação de origem' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Aprovar a compra do pedido (registrar pagamento confirmado)',
    description:
      'EM_NEGOCIACAO ("Aguardando Pagamento") → COMPRA_APROVADA. Registra o ' +
      'pagamento confirmado, não uma aprovação de crédito. Desfazer só reabrindo ' +
      'a negociação-mãe, e um pedido pago só um ADMIN reabre (RN11).',
  })
  @ApiResponse({ status: 200, description: 'Compra aprovada' })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Pedido não está aguardando pagamento',
  })
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.markAsPaid(id);
  }
}
