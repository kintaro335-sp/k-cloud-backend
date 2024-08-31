import { Controller, Post, Get, UseGuards, Request, Body, Put, Headers, Param } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
// swagger
import { ErrorResponse } from '../responses/errorResponse.resp';
import { MessageResponse } from '../responses/messageResponse.resp';
import { UsePayloadRespose } from './reponses/userPayload.resp';
import { AuthResponse } from './reponses/authResponse.resp';
import { ApiKeysResponse, SessionsResponse } from './reponses/apikeysResponse.resp';
// services
import { AuthService } from './auth.service';
// guards
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiKeyGuard } from './guards/apikey.guard';
// dtos
import { LoginDTO } from './dtos/login.dto';
import { RegisterDTO } from './dtos/Register.dto';
import { PasswdDTO } from './dtos/passwd.dto';
import { ApiKeyNameDto } from './dtos/apikeyname.dto';
// interfaces
import { UserPayload } from './interfaces/userPayload.interface';
import { ApiKeysResponseI, SessionsResponseI } from './interfaces/apikey.interface';
import { AuthResponseI, MessageResponseI } from './interfaces/response.interface';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: UsePayloadRespose })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async checkToken(@Request() req): Promise<UserPayload> {
    return req.user
  }

  @Post('login')
  @ApiOkResponse({ type: AuthResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  async login(@Body() body: LoginDTO, @Headers('User-Agent') device: string): Promise<AuthResponseI> {
    return this.authService.login(body.username, body.password, device);
  }

  @Post('register')
  @ApiOkResponse({ type: AuthResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  async register(@Body() body: RegisterDTO, @Headers('User-Agent') device: string): Promise<AuthResponseI> {
    return this.authService.register(body.username, body.password, device);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: MessageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async logout(@Request() req): Promise<MessageResponseI> {
    const user: UserPayload = req.user;
    return this.authService.logout(user.sessionId);
  }

  @Post('revoke/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: MessageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async revokeSession(@Request() req, @Param('sessionId') sessionId: string): Promise<MessageResponseI> {
    const user: UserPayload = req.user;
    return this.authService.logout(sessionId);
  }

  @Post('apikeys')
  @UseGuards(JwtAuthGuard, ApiKeyGuard)
  @ApiOkResponse({ type: AuthResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async createApiKey(@Request() req, @Body() body: ApiKeyNameDto): Promise<AuthResponseI> {
    const user: UserPayload = req.user;
    return this.authService.createApiKey(user, body.name);
  }

  @Put('password')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: AuthResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  async changePassword(@Request() req, @Body() body: PasswdDTO): Promise<MessageResponseI> {
    const user: UserPayload = req.user;
    return this.authService.changePassword(user.userId, body.password, body.newPassword);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: SessionsResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async getSessions(@Request() req): Promise<SessionsResponseI> {
    const user: UserPayload = req.user;
    return this.authService.getSessions(user);
  }

  @Get('apikeys')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: ApiKeysResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async getApiKeys(@Request() req): Promise<ApiKeysResponseI> {
    const user: UserPayload = req.user;
    return this.authService.getApiKeys(user);
  }
}
