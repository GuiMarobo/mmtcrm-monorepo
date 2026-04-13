import { BadRequestException, Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ReplaceUserDto } from './dto/replace-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    if (!createUserDto) {
      throw new BadRequestException('Request body is required');
    }
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  updatePartial(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updatePartial(+id, updateUserDto);
  }

  @Put(':id')
  replace(@Param('id') id: string, @Body() replaceUserDto: ReplaceUserDto) {
    return this.usersService.replace(+id, replaceUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
