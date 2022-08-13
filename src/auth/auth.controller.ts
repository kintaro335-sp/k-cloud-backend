import { Controller, Post, Get, UseGuards, Request, Body } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async checkToken(@Request() req) {
    return req.user;
  }

  
  @Post('login')
  async login(@Body() body) {
    return this.authService.login(body);
  }

}
