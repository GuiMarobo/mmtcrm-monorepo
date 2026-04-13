import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { ReplaceUserDto } from './dto/replace-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';


@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    if (!createUserDto || !createUserDto.email) {
      throw new BadRequestException('Request body must include a valid email');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        email: createUserDto.email
      }
    });
    if (user){
      throw new HttpException('E-mail already exists', HttpStatus.BAD_REQUEST);
    }
    return this.prisma.user.create({
      data: createUserDto
    });
  }


  async findAll() {
    return await this.prisma.user.findMany();
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id
      }
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async replace(id: number, replaceUserDto: ReplaceUserDto) {
    if (!replaceUserDto || !replaceUserDto.email || !replaceUserDto.name || !replaceUserDto.password) {
      throw new BadRequestException('PUT requires all user fields: name, email, password');
    }

    const user = await this.prisma.user.findFirst({
      where: { id },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (replaceUserDto.email !== user.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: replaceUserDto.email,
          NOT: { id }
        }
      });
      if (existingUser) {
        throw new HttpException('E-mail already exists', HttpStatus.BAD_REQUEST);
      }
    }

    return await this.prisma.user.update({
      where: { id },
      data: replaceUserDto
    });
  }

  async updatePartial(id: number, updateUserDto: UpdateUserDto) {
    if (!updateUserDto || Object.keys(updateUserDto).length === 0) {
      throw new BadRequestException('PATCH requires at least one field to update');
    }

    const user = await this.prisma.user.findFirst({
      where: { id },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: updateUserDto.email,
          NOT: { id }
        }
      });
      if (existingUser) {
        throw new HttpException('E-mail already exists', HttpStatus.BAD_REQUEST);
      }
    }

    return await this.prisma.user.update({
      where: { id },
      data: updateUserDto
    });
  }


  async remove(id: number) {
    try{
      return await this.prisma.user.delete({
        where: {
          id
        }
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`User with id ${id} not found`);
      }
    }
  }
}
