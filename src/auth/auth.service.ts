import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CryptoService } from '../crypto/crypto.service';
// interfaces
import { UserPayload } from './interfaces/userPayload.interface';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService, private cryptoService: CryptoService) {}

  async login(userName: string, pasword: string) {
    const user = await this.usersService.findOne({ username: userName });
    if (!user) {
      throw new BadRequestException('Usuario o contraseña incorrectos');
    }
    if (this.cryptoService.comparePasswords(pasword, user.passwordu)) {
      const payload: UserPayload = { userId: user.id, username: user.username };
      return {
        access_token: this.jwtService.sign(payload)
      };
    }
    throw new BadRequestException('Usuario o contraseña incorrectos');
  }

  async register(userName: string, pasword: string) {
    const user = await this.usersService.findOne({ username: userName });
    if (user) {
      throw new BadRequestException('Usuario ya existe');
    }
    const newUser = await this.usersService.create({
      id: this.cryptoService.createUserId(userName),
      username: userName,
      passwordu: this.cryptoService.createPassword(pasword)
    });
    const payload: UserPayload = { userId: newUser.id, username: newUser.username };
    return {
      access_token: this.jwtService.sign(payload)
    };
  }

  async changePassword(userId: string, password: string, newPassword: string) {
    const user = await this.usersService.findOne({ id: userId });
    if (!user) {
      throw new BadRequestException('Usuario no existe');
    }
    if (this.cryptoService.comparePasswords(password, user.passwordu)) {
      await this.usersService.update({ id: userId }, { passwordu: this.cryptoService.createPassword(newPassword) });
      return { message: 'password changed' };
    }
    throw new BadRequestException('Contraseña incorrecta');
  }
}
