import { Injectable } from '@nestjs/common';
// service
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import { AdminService } from '../admin/admin.service';

@Injectable()
export class SetupService {
  constructor(private readonly usersServ: UsersService, private readonly authServ: AuthService, private readonly adminServ: AdminService) {}

  async isConfigured(): Promise<boolean> {
    const count = await this.usersServ.countAdminUsers();
    return count !== 0 && this.adminServ.getfirstUser() == null;
  }

  setMainUser(userId: string) {
    this.adminServ.setFirstUser(userId);
    return { message: `user ${userId} is Main User` };
  }

  async createFirstUser(userName: string, password: string) {
    const newUser = await this.authServ.registerAdmin(userName, password);
    this.adminServ.setFirstUser(newUser.idUser);
  }
}
