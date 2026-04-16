import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { ReplaceUserDto } from './dto/replace-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly userSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (user) {
      throw new ConflictException('E-mail already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        password: hashedPassword,
        role: createUserDto.role ?? 'VENDEDOR',
        status: createUserDto.status ?? 'ATIVO',
      },
      select: this.userSelect,
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: this.userSelect,
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async replace(id: number, replaceUserDto: ReplaceUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (replaceUserDto.email !== user.email) {
      await this.checkEmail(replaceUserDto.email, id);
    }

    const hashedPassword = await bcrypt.hash(replaceUserDto.password, 10);

    return this.prisma.user.update({
      where: { id },
      data: {
        name: replaceUserDto.name,
        email: replaceUserDto.email,
        password: hashedPassword,
      },
      select: this.userSelect,
    });
  }

  async updatePartial(id: number, updateUserDto: UpdateUserDto) {
    if (!updateUserDto || Object.keys(updateUserDto).length === 0) {
      throw new BadRequestException('PATCH requires at least one field to update');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      await this.checkEmail(updateUserDto.email, id);
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: this.userSelect,
    });
  }

  async remove(id: number) {
    try {
      return await this.prisma.user.delete({
        where: { id },
        select: this.userSelect,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`User with id ${id} not found`);
      }
      throw error;
    }
  }

  private async checkEmail(email: string, userId?: number) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email,
        NOT: userId ? { id: userId } : undefined,
      },
    });

    if (existingUser) {
      throw new ConflictException('E-mail already exists');
    }
  }
}
