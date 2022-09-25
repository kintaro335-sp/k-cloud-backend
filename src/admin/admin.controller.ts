import { Controller, Post, Get, Delete, Body, UseGuards, Param } from '@nestjs/common';

// services
import { AdminService } from './admin.service';
import { AuthService } from '../auth/auth.service';
// dto
import { DedicatedSpaceDTO } from './dto/dedicated-space-dto';
import { SetPasswordDTO } from './dto/set-password.dto';
import { SetAdminDTO } from './dto/set-admin.dto';
import { RegisterDTO } from '../auth/dtos/Register.dto';
// guards
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
// decorators
import { RequireAdmin } from './decorators/admin.decorator';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminServ: AdminService, private readonly authServ: AuthService) {}

  @RequireAdmin(true)
  @Post('/set-dedicated-space')
  async setDedicatedSpace(@Body() body: DedicatedSpaceDTO) {
    this.adminServ.setDedicatedSpace(body.quantity, body.unitTipe);

    return { message: 'capacity setted' };
  }

  @RequireAdmin(true)
  @Get('/used-space/update')
  async updateUsedSpace() {
    return this.adminServ.updateUsedSpace();
  }

  @RequireAdmin(true)
  @Get('/used-space')
  async getUsedSpace() {
    return this.adminServ.getUsedSpace();
  }

  // user management

  @RequireAdmin(true)
  @Get('/users/list')
  async usersList() {
    return this.authServ.userList();
  }

  @RequireAdmin(true)
  @Post('/users/password/:userid')
  async setUserPasword(@Param('userid') userid: string, @Body() body: SetPasswordDTO) {
    return this.authServ.setPaswword(userid, body.password);
  }

  @RequireAdmin(true)
  @Post('/users/admin/:userid')
  async setUserType(@Param('userid') userid: string, @Body() body: SetAdminDTO) {
    return this.authServ.setAdmin(userid, body.admin);
  }

  @RequireAdmin(true)
  @Post('/users/create')
  async createUser(@Body() body: RegisterDTO) {
    return this.authServ.register(body.username, body.password);
  }

  @RequireAdmin(true)
  @Delete('/users/delete/:userid')
  async deleteUser(@Param('userid') userid: string) {
    return this.authServ.deleteUser(userid);
  }
}
