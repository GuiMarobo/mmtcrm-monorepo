import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, RoleEnum } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ReplaceUserDto } from './dto/replace-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ErasureService } from '../erasure/erasure.service';
import { EraseDataDto } from '../erasure/dto/erase-data.dto';

@ApiBearerAuth()
@Roles(RoleEnum.ADMIN)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly erasureService: ErasureService,
  ) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  updatePartial(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updatePartial(id, updateUserDto);
  }

  @Put(':id')
  replace(
    @Param('id', ParseIntPipe) id: number,
    @Body() replaceUserDto: ReplaceUserDto,
  ) {
    return this.usersService.replace(id, replaceUserDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @Patch(':id/activate')
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.activate(id);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deactivate(id);
  }

  @Patch(':id/change-password')
  changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(id, dto.newPassword);
  }

  @Post(':id/erase')
  @ApiOperation({
    summary: 'Eliminar os dados pessoais do usuário (LGPD, Art. 18, VI)',
    description:
      'Ação irreversível. Usuário que nunca conduziu negociação é eliminado do banco; ' +
      'quem consta como vendedor tem os dados anonimizados e o histórico de vendas preservado.',
  })
  @ApiResponse({ status: 201, description: 'Eliminado ou anonimizado' })
  @ApiResponse({
    status: 403,
    description: 'Apenas ADMIN, e nunca sobre si mesmo',
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 409, description: 'Usuário já anonimizado' })
  erase(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EraseDataDto,
    @Req() req: { user: { id: number } },
  ) {
    return this.erasureService.eraseUser(id, req.user.id, dto.reason);
  }
}
