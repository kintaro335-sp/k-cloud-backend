import { Controller, Post, Get, UseGuards, Request, Body, Put, Headers, Param } from '@nestjs/common';
// services
import { AuthService } from './auth.service';
// guards
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiKeyGuard } from './guards/apikey.guard';
// dtos
import { LoginDTO } from './dtos/login.dto';
import { RegisterDTO } from './dtos/Register.dto';
import { PasswdDTO } from './dtos/passwd.dto';
// interfaces
import { UserPayload } from './interfaces/userPayload.interface';
import { ApiKeysResponse, SessionsResponse } from './interfaces/apikey.interface';
import { AuthResponse, MessageResponse } from './interfaces/response.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async checkToken(@Request() req): Promise<UserPayload> {
    return req.user
  }

  @Post('login')
  async login(@Body() body: LoginDTO, @Headers('User-Agent') device: string): Promise<AuthResponse> {
    return this.authService.login(body.username, body.password, device);
  }

  @Post('register')
  async register(@Body() body: RegisterDTO, @Headers('User-Agent') device: string): Promise<AuthResponse> {
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

  @Post('apikey')
  @UseGuards(JwtAuthGuard, ApiKeyGuard)
  async createApiKey(@Request() req): Promise<AuthResponse> {
    const user: UserPayload = req.user;
    return this.authService.createApiKey(user);
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
