import { Injectable, UnauthorizedException } from '@nestjs/common'
import { UsersService } from 'src/users/users.service'
import { LoginUserDto } from './dto/login-user.dto'
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email)
    if (!user) {
      throw new UnauthorizedException('E-mail ou senha inválidos')
    }

    const passwordMatches = await bcrypt.compare(password, user.password)
    if (!passwordMatches) {
      throw new UnauthorizedException('E-mail ou senha inválidos')
    }

    if (user.status !== 'ATIVO') {
      throw new UnauthorizedException('Usuário inativo')
    }

    return user
  }

  async login(loginDto: LoginUserDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password)
    const { password, ...publicUser } = user
    return publicUser
  }
}
