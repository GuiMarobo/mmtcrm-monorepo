import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ReplaceClientDto } from './dto/replace-client.dto';
import { QualifyClientDto } from './dto/qualify-client.dto';
import { RoleEnum } from 'src/users/dto/create-user.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiBearerAuth()
@Roles(RoleEnum.ADMIN, RoleEnum.VENDEDOR, RoleEnum.ATENDENTE)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Get()
  findAll() {
    return this.clientsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.findOne(id);
  }

  @Get(':id/is-lead')
  isLead(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.isLead(id);
  }

  @Put(':id')
  replace(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplaceClientDto,
  ) {
    return this.clientsService.replace(id, dto);
  }

  @Patch(':id')
  updatePartial(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.updatePartial(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.remove(id);
  }

  @Patch(':id/qualify')
  qualify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: QualifyClientDto,
  ) {
    return this.clientsService.qualify(id, dto.qualification);
  }

  @Patch(':id/contact')
  registerContact(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.registerContact(id);
  }

  @Patch(':id/activate')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.activate(id);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.deactivate(id);
  }
}
