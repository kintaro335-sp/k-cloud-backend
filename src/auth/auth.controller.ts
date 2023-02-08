import { Controller, Post, Get, UseGuards, Request, Body, Put } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
// dtos
import { LoginDTO } from './dtos/login.dto';
import { RegisterDTO } from './dtos/Register.dto';
import { PasswdDTO } from './dtos/passwd.dto';
// interfaces
import { UserPayload } from './interfaces/userPayload.interface';
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
  async login(@Body() body: LoginDTO): Promise<AuthResponse> {
    return this.authService.login(body.username, body.password);
  }

  @Post('register')
  async register(@Body() body: RegisterDTO): Promise<AuthResponse> {
    return this.authService.register(body.username, body.password);
  }

  @Put('password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Request() req, @Body() body: PasswdDTO): Promise<MessageResponse> {
    const user: UserPayload = req.user;
    return this.authService.changePassword(user.userId, body.password, body.newPassword);
  }
}
