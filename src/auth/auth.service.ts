import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CryptoService } from '../crypto/crypto.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService, private cryptoService: CryptoService) {}

  async validateUser(userId: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne({ id: userId });
    if (this.cryptoService.comparePasswords(pass, user.passwordu)) {
      const { ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload)
    };
  }
}
