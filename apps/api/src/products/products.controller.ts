import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RoleEnum } from 'src/users/dto/create-user.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';
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

  @Get(':id')
  @ApiOperation({
    summary: 'Detalhar um produto com o histórico de movimentações de estoque',
    description:
      'Devolve o produto e a lista de movimentos de estoque associada, do mais ' +
      'recente para o mais antigo, cada um com data, tipo, quantidade, autor e ' +
      'observação (UC6 §2.3).',
  })
  @ApiResponse({
    status: 200,
    description: 'Produto com o histórico de estoque',
  })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Post(':id/stock-movements')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Registrar uma entrada ou saída de estoque',
    description:
      'Único caminho que altera o saldo: grava o movimento e atualiza o saldo na ' +
      'mesma transação (ADR 0013). A quantidade é um inteiro positivo; o tipo ' +
      '(ENTRADA/SAIDA) informa a direção. Uma saída maior que o saldo é recusada ' +
      'e nada é gravado. Devolve o produto atualizado com o histórico.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Movimento registrado; produto com saldo e histórico atualizados',
  })
  @ApiResponse({ status: 400, description: 'Tipo ou quantidade inválidos' })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiResponse({ status: 409, description: 'Saldo insuficiente para a saída' })
  moveStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateStockMovementDto,
    @Req() req: { user: { id: number } },
  ) {
    return this.productsService.moveStock(id, dto, req.user.id);
  }

  @Patch(':id')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Editar os dados cadastrais de um produto',
    description:
      'Aceita nome, código de referência, descrição e categoria. Nunca altera ' +
      'preço nem saldo, mesmo que venham no corpo — o preço tem rota própria e ' +
      'o saldo só muda por movimento de estoque. Trocar o código de referência ' +
      'reaplica a unicidade normalizada. Devolve o produto com o histórico.',
  })
  @ApiResponse({ status: 200, description: 'Produto atualizado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Código de referência já cadastrado',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Patch(':id/price')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Atualizar o preço de venda de um produto',
    description:
      'Grava só o novo preço, que não pode ser negativo. Não retroage sobre ' +
      'negociações e pedidos já registrados. Devolve o produto com o histórico.',
  })
  @ApiResponse({ status: 200, description: 'Preço atualizado' })
  @ApiResponse({ status: 400, description: 'Preço inválido' })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  updatePrice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductPriceDto,
  ) {
    return this.productsService.updatePrice(id, dto);
  }

  @Patch(':id/discontinue')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Descontinuar um produto',
    description:
      'Muda a situação de Ativo para Inativo. O produto continua visível para ' +
      'consulta histórica. Devolve o produto com o histórico.',
  })
  @ApiResponse({ status: 200, description: 'Produto descontinuado' })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiResponse({ status: 409, description: 'Produto já está Inativo' })
  discontinue(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.discontinue(id);
  }

  @Patch(':id/reactivate')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Reativar um produto descontinuado',
    description:
      'Devolve a situação de Inativo para Ativo. Devolve o produto com o histórico.',
  })
  @ApiResponse({ status: 200, description: 'Produto reativado' })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiResponse({ status: 409, description: 'Produto já está Ativo' })
  reactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.reactivate(id);
  }

  @Delete(':id')
  @Roles(RoleEnum.ADMIN)
  @HttpCode(204)
  @ApiOperation({
    summary: 'Excluir um produto (exclusão lógica)',
    description:
      'Marca a data de exclusão; a linha e o histórico de estoque são ' +
      'preservados, mas o produto some de todas as consultas (ADR 0008).',
  })
  @ApiResponse({ status: 204, description: 'Produto excluído' })
  @ApiResponse({ status: 403, description: 'Perfil sem permissão' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
