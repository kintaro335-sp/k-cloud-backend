import { Controller, Post, Body } from '@nestjs/common';

// services
import { AdminService } from './admin.service';
// dto
import { DedicatedSpaceDTO } from './dto/dedicated-space-dto';
@Controller('admin')
export class AdminController {
  constructor(private readonly adminServ: AdminService) {}

  @Post('/set-dedicated-space')
  async setDedicatedSpace(@Body() body: DedicatedSpaceDTO) {
    this.adminServ.setDedicatedSpace(body.quantity, body.unitTipe);

    return { message: 'capacity setted' };
  }
}
