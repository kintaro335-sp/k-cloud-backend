import { Controller, Post, Get, Delete, Body, UseGuards, Param, Query, ParseIntPipe } from '@nestjs/common';
// services
import { AdminService } from './admin.service';
import { AuthService } from '../auth/auth.service';
import { LogsService } from '../logs/logs.service';
import { MonitorService } from '../monitor/monitor.service';
// ineterfaces
import { MessageResponse } from '../auth/interfaces/response.interface';
import { SpaceUsed, UsedSpaceUser } from './interfaces/spaceused.interface';
import { UsedSpaceType } from 'src/files/interfaces/list-file.interface';
import { TIMEOPTION } from 'src/logs/interfaces/options.interface';
import { GROUPFILTER } from 'src/logs/interfaces/groupfilter.interface';
import { LogR } from 'src/logs/interfaces/logres.interface';
import { StatsLineChart } from 'src/logs/interfaces/statslinechart.interface';
import { UserL } from 'src/users/interfaces/userl.interface';
// dto
import { DedicatedSpaceDTO } from './dto/dedicated-space-dto';
import { SetPasswordDTO } from './dto/set-password.dto';
import { SetAdminDTO } from './dto/set-admin.dto';
import { RegisterDTO } from '../auth/dtos/Register.dto';
// guards
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { FirstUserGuard } from './guards/first-user-guard';
// decorators
import { RequireAdmin } from './decorators/admin.decorator';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminServ: AdminService,
    private readonly authServ: AuthService,
    private readonly logserv: LogsService,
    private readonly monitorServ: MonitorService
  ) {}

  @RequireAdmin(true)
  @Post('/dedicated-space')
  async setDedicatedSpace(@Body() body: DedicatedSpaceDTO) {
    this.adminServ.setDedicatedSpace(body.quantity, body.unitTipe);

    return { message: 'capacity setted' };
  }

  @RequireAdmin(true)
  @Get('/dedicated-space')
  getDedicatedSpace() {
    return this.adminServ.getSpaceConfig();
  }

  @RequireAdmin(true)
  @Get('/used-space/update')
  async updateUsedSpace(): Promise<SpaceUsed> {
    return this.adminServ.updateUsedSpace();
  }

  @RequireAdmin(true)
  @Get('/used-space')
  async getUsedSpace(): Promise<SpaceUsed> {
    return this.adminServ.getUsedSpace();
  }

  @RequireAdmin(true)
  @Get('/used-space/users')
  async getUsedSpaceByUsers(): Promise<UsedSpaceUser[]> {
    return this.adminServ.getUsedSpaceByUsers();
  }

  @RequireAdmin(true)
  @Get('/used-space/files')
  async getUsedSpaceByFileType(): Promise<UsedSpaceType[]> {
    return this.adminServ.getUsedSpaceByFileType();
  }

  // user management

  @RequireAdmin(true)
  @Get('/users/list')
  async usersList(): Promise<UserL[]> {
    return this.authServ.userList();
  }

  @RequireAdmin(true)
  @Post('/users/password/:userid')
  async setUserPasword(@Param('userid') userid: string, @Body() body: SetPasswordDTO): Promise<MessageResponse> {
    return this.authServ.setPaswword(userid, body.password);
  }

  @RequireAdmin(true)
  @Post('/users/admin/:userid')
  async setUserType(@Param('userid') userid: string, @Body() body: SetAdminDTO): Promise<MessageResponse> {
    return this.authServ.setAdmin(userid, body.admin);
  }

  @RequireAdmin(true)
  @Post('/users/create')
  async createUser(@Body() body: RegisterDTO): Promise<MessageResponse> {
    await this.authServ.register(body.username, body.password);
    return { message: 'Usuario Creado' };
  }

  @RequireAdmin(true)
  @UseGuards(FirstUserGuard)
  @Delete('/users/delete/:userid')
  async deleteUser(@Param('userid') userid: string): Promise<MessageResponse> {
    return this.authServ.deleteUser(userid);
  }

  @Get('/memory/rss')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getMemoryUsageRss(): { usage: number } {
    return { usage: this.adminServ.getMemoryUsage() };
  }

  @Get('/memory/buffer')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getMemoryUsageBuffer(): { usage: number } {
    return { usage: this.adminServ.getBufferUsage() };
  }

  @Get('memory/stats/line')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getMemorystats(): StatsLineChart {
    return this.monitorServ.getLineChartdataMemoryUsage();
  }

  @Get('logs/stats/:group/line/:time')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getLineChartData(@Param('group') group: GROUPFILTER, @Param('time') time: TIMEOPTION): Promise<StatsLineChart> {
    return this.logserv.getLineChartData(group, time);
  }

  @Get('logs/list')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getLogsList(@Query('page', ParseIntPipe) page: number): Promise<LogR[]> {
    return this.logserv.getLogs(page);
  }

  @Get('logs/pages')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getLogsPages(): Promise<{ pages: number }> {
    return { pages: await this.logserv.getPagesLogs() };
  }
}
