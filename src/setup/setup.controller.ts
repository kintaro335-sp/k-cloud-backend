import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
// service
import { SetupService } from './setup.service';
// interfaces
import { ConfiguredResponse } from './interfaces/configured.interface';
// dtos
import { RegisterDTO } from '../auth/dtos/Register.dto';
// guards
import { UserSetupGuard } from './guards/user-setup.guard';

@Controller('setup')
export class SetupController {
  constructor(private readonly setupserv: SetupService) {}

  @Get('is-configured')
  async getIsConfigured(): Promise<ConfiguredResponse> {
    const configured = await this.setupserv.isConfigured();
    return { configured };
  }

  @UseGuards(UserSetupGuard)
  @Post('create-first-user')
  async postCreateUser(@Body() user: RegisterDTO) {
    await this.setupserv.createFirstUser(user.username, user.password);
    return { message: 'success' };
  }
}
