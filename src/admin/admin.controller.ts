import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';

// services
import { AdminService } from './admin.service';
// dto
import { DedicatedSpaceDTO } from './dto/dedicated-space-dto';
// guards
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
// decorators
import { RequireAdmin } from './decorators/admin.decorator';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminServ: AdminService) {}

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
}
