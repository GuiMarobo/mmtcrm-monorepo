import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { RoleEnum } from '../../users/dto/create-user.dto';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  mustChangePassword: boolean;
}

// O que o Passport pendura em req.user depois do validate(). Os guards leem
// daqui em vez de receber any da Request do Express.
export interface AuthenticatedUser {
  id: number;
  email: string;
  role: RoleEnum;
  mustChangePassword: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'fallback-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findActiveById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Usuário sem acesso ao sistema');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as RoleEnum,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
