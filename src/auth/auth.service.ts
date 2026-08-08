import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginUserDto } from './dto/login-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    if (user.status !== 'ATIVO') {
      throw new UnauthorizedException('Usuário inativo');
    }

    return user;
  }

  async login(loginDto: LoginUserDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };
    const { password, ...publicUser } = user;

    return {
      access_token: this.jwtService.sign(payload),
      user: publicUser,
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const valid = await this.usersService.verifyPassword(
      userId,
      dto.currentPassword,
    );
    if (!valid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    const updatedUser = await this.usersService.changePassword(
      userId,
      dto.newPassword,
    );
    const payload = {
      sub: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      mustChangePassword: false,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: updatedUser,
    };
  }
}
