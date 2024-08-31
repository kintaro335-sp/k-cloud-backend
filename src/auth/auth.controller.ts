import { Controller, Post, Get, UseGuards, Request, Body, Put, Headers, Param } from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
// swagger
import { UsePayloadRespose } from './reponses/userPayload.resp';
import { AuthResponse } from './reponses/authResponse.resp';
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
import { ApiKeysResponse, SessionsResponse } from './interfaces/apikey.interface';
import { AuthResponseI, MessageResponse } from './interfaces/response.interface';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: UsePayloadRespose })
  async checkToken(@Request() req): Promise<UserPayload> {
    return req.user
  }

  @Post('login')
  @ApiOkResponse({ type: AuthResponse })
  async login(@Body() body: LoginDTO, @Headers('User-Agent') device: string): Promise<AuthResponseI> {
    return this.authService.login(body.username, body.password, device);
  }

  @Post('register')
  @ApiOkResponse({ type: AuthResponse })
  async register(@Body() body: RegisterDTO, @Headers('User-Agent') device: string): Promise<AuthResponseI> {
    return this.authService.register(body.username, body.password, device);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req): Promise<MessageResponse> {
    const user: UserPayload = req.user;
    return this.authService.logout(user.sessionId);
  }

  @Post('revoke/:sessionId')
  @UseGuards(JwtAuthGuard)
  async revokeSession(@Request() req, @Param('sessionId') sessionId: string): Promise<MessageResponse> {
    const user: UserPayload = req.user;
    return this.authService.logout(sessionId);
  }

  @Post('apikeys')
  @UseGuards(JwtAuthGuard, ApiKeyGuard)
  @ApiOkResponse({ type: AuthResponse })
  async createApiKey(@Request() req, @Body() body: ApiKeyNameDto): Promise<AuthResponseI> {
    const user: UserPayload = req.user;
    return this.authService.createApiKey(user, body.name);
  }

  @Put('password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Request() req, @Body() body: PasswdDTO): Promise<MessageResponse> {
    const user: UserPayload = req.user;
    return this.authService.changePassword(user.userId, body.password, body.newPassword);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getSessions(@Request() req): Promise<SessionsResponse> {
    const user: UserPayload = req.user;
    return this.authService.getSessions(user);
  }

  @Get('apikeys')
  @UseGuards(JwtAuthGuard)
  async getApiKeys(@Request() req): Promise<ApiKeysResponse> {
    const user: UserPayload = req.user;
    return this.authService.getApiKeys(user);
  }
}
