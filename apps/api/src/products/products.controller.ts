import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RoleEnum } from 'src/users/dto/create-user.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsService } from './products.service';

// RP10: consultar o catálogo é do ADMIN e do VENDEDOR; manter o catálogo é só do
// ADMIN, por @Roles na rota. ATENDENTE e TECNICO não entram em nenhuma das duas
// — mesma sobreposição usada em clients.controller.ts.
@ApiBearerAuth()
@Roles(RoleEnum.ADMIN, RoleEnum.VENDEDOR)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Cadastrar um produto no catálogo',
    description:
      'O código de referência é gravado normalizado (sem espaços nas pontas, em ' +
      'maiúsculas) e precisa ser único entre os produtos não excluídos. Uma ' +
      'quantidade inicial maior que zero grava, na mesma transação, o movimento ' +
      'de Entrada da carga inicial (ADR 0013).',
  })
  @ApiResponse({ status: 201, description: 'Produto cadastrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  @ApiResponse({
    status: 409,
    description: 'Código de referência já cadastrado',
  })
  create(@Body() dto: CreateProductDto, @Req() req: { user: { id: number } }) {
    return this.productsService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar os produtos não excluídos do catálogo' })
  @ApiResponse({ status: 200, description: 'Lista de produtos' })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  findAll() {
    return this.productsService.findAll();
  }
}
