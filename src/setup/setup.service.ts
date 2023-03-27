import { Injectable } from '@nestjs/common';
// service
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class SetupService {
  constructor(private readonly usersServ: UsersService, private readonly authServ: AuthService) {}

  async isConfigured(): Promise<boolean> {
    const count = await this.usersServ.countAdminUsers();
    return count !== 0;
  }

  async createFirstUser(userName: string, password: string) {
    await this.authServ.registerAdmin(userName, password);
  }
}
