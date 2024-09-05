import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
// swagger
import { MessageResponse } from '../responses/messageResponse.resp';
import { ErrorResponse } from '../responses/errorResponse.resp';
import { ConfiguredResponse } from './responses/configured.resp';
// service
import { SetupService } from './setup.service';
// interfaces
import { ConfiguredResponseI } from './interfaces/configured.interface';
// dtos
import { RegisterDTO } from '../auth/dtos/Register.dto';
import { UserIdDTO } from './dto/userid.dto';
// guards
import { UserSetupGuard } from './guards/user-setup.guard';

@Controller('setup')
@ApiTags('Setup')
export class SetupController {
  constructor(private readonly setupserv: SetupService) {}

  @Get('is-configured')
  @ApiOkResponse({ type: ConfiguredResponse })
  async getIsConfigured(): Promise<ConfiguredResponseI> {
    const configured = await this.setupserv.isConfigured();
    return { configured };
  }

  @UseGuards(UserSetupGuard)
  @Post('create-first-user')
  @ApiCreatedResponse({ type: MessageResponse })
  async postCreateUser(@Body() user: RegisterDTO) {
    await this.setupserv.createFirstUser(user.username, user.password);
    return { message: 'success' };
  }

  // @UseGuards(UserSetupGuard)
  // @Post('set-first-user')
  // @ApiOkResponse({ type: MessageResponse })
  // async setMainUser(@Body() user: UserIdDTO) {
  //   return this.setupserv.setMainUser(user.userid);
  // }
}
