/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { Controller, Post, Get, Patch, Delete, Body, UseGuards, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiQuery, ApiParam, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse } from '@nestjs/swagger';
// swagger
import { MessageResponse } from '../responses/messageResponse.resp';
import { ErrorResponse } from '../responses/errorResponse.resp';
import { SpaceConfigResp } from './responses/spaceConfig.resp';
import { SpaceUsedResp } from './responses/spaceUsed.resp';
import { UsedSpaceUserResp } from './responses/usedSpaceUser.resp';
import { UsedSpaceTypeResp } from './responses/usedSpaceType.resp';
import { UserResp } from './responses/usersList.resp';
import { OwnerIdResponse } from './responses/ownerId.resp';
import { MemoryUsageResponse } from './responses/memoryUsage.resp';
import { PagesResp } from './responses/pages.resp';
import { SharedFileActivityResp } from './responses/sharedFileAct.resp';
import { SerieLineChartResp } from './responses/statsLineChart.resp';
// services
import { AdminService } from './admin.service';
import { AuthService } from '../auth/auth.service';
import { LogsService } from '../logs/logs.service';
import { MonitorService } from '../monitor/monitor.service';
import { SystemService } from '../system/system.service';
// ineterfaces
import { MessageResponseI } from '../auth/interfaces/response.interface';
import { SpaceUsed, UsedSpaceUser } from './interfaces/spaceused.interface';
import { UsedSpaceType } from 'src/files/interfaces/list-file.interface';
import { TIMEOPTION } from 'src/logs/interfaces/options.interface';
import { GROUPFILTER } from 'src/logs/interfaces/groupfilter.interface';
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
import { OwnerGuard } from './guards/owner.guard';
// decorators
import { RequireAdmin } from './decorators/admin.decorator';
import { SharedFileActivity } from 'src/logs/interfaces/sharedfileActivity.interface';
import { NotOwnerGuard } from './guards/notowner.guard';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
@ApiTags('Admin')
export class AdminController {
  constructor(
    private readonly adminServ: AdminService,
    private readonly authServ: AuthService,
    private readonly logserv: LogsService,
    private readonly monitorServ: MonitorService,
    private readonly systemServ: SystemService
  ) {}

  @RequireAdmin(true)
  @Post('/dedicated-space')
  @ApiSecurity('t')
  @ApiOkResponse({ type: MessageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  async setDedicatedSpace(@Body() body: DedicatedSpaceDTO) {
    this.adminServ.setDedicatedSpace(body.quantity, body.unitTipe);

    return { message: 'capacity setted' };
  }

  @RequireAdmin(true)
  @Get('/dedicated-space')
  @ApiSecurity('t')
  @ApiOkResponse({ type: SpaceConfigResp })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  getDedicatedSpace() {
    return this.adminServ.getSpaceConfig();
  }

  @RequireAdmin(true)
  @Get('/used-space/update')
  @ApiSecurity('t')
  @ApiOkResponse({ type: SpaceUsedResp })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async updateUsedSpace(): Promise<SpaceUsed> {
    return this.adminServ.updateUsedSpace();
  }

  @RequireAdmin(true)
  @Get('/used-space')
  @ApiSecurity('t')
  @ApiOkResponse({ type: SpaceUsedResp })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async getUsedSpace(): Promise<SpaceUsed> {
    return this.adminServ.getUsedSpace();
  }

  @RequireAdmin(true)
  @Get('/used-space/users')
  @ApiSecurity('t')
  @ApiOkResponse({ type: [UsedSpaceUserResp] })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async getUsedSpaceByUsers(): Promise<UsedSpaceUser[]> {
    return this.adminServ.getUsedSpaceByUsers();
  }

  @RequireAdmin(true)
  @Get('/used-space/files')
  @ApiSecurity('t')
  @ApiOkResponse({ type: [UsedSpaceTypeResp] })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async getUsedSpaceByFileType(): Promise<UsedSpaceType[]> {
    return this.adminServ.getUsedSpaceByFileType();
  }

  @RequireAdmin(true)
  @Patch('/update-users-trees')
  @ApiSecurity('t')
  @ApiOkResponse({ type: MessageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async getUsedSpaceByFileTypeByType(){
    return this.adminServ.updateUsersTrees();
  }

  // user management

  @RequireAdmin(true)
  @Get('/users/list')
  @ApiSecurity('t')
  @ApiOkResponse({ type: [UserResp] })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async usersList(): Promise<UserL[]> {
    return this.authServ.userList();
  }

  @RequireAdmin(true)
  @Post('/users/password/:userid')
  @UseGuards(NotOwnerGuard)
  @ApiSecurity('t')
  @ApiOkResponse({ type: MessageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  async setUserPasword(@Param('userid') userid: string, @Body() body: SetPasswordDTO): Promise<MessageResponseI> {
    return this.authServ.setPaswword(userid, body.password);
  }

  @RequireAdmin(true)
  @Post('/users/admin/:userid')
  @UseGuards(NotOwnerGuard)
  @ApiSecurity('t')
  @ApiOkResponse({ type: MessageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  async setUserType(@Param('userid') userid: string, @Body() body: SetAdminDTO): Promise<MessageResponseI> {
    return this.authServ.setAdmin(userid, body.admin);
  }

  @RequireAdmin(true)
  @Get('users/owner')
  @ApiSecurity('t')
  @ApiOkResponse({ type: OwnerIdResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async getAdmin(): Promise<{ id: string | null }> {
    const userId = this.adminServ.getOwner();
    return { id: userId };
  }

  @Patch('users/owner/:userid')
  @UseGuards(OwnerGuard)
  @ApiSecurity('t')
  @ApiOkResponse({ type: MessageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  async changeOwner(@Param('userid') userId: string) {
    await this.authServ.setAdmin(userId, true);
    this.adminServ.changeOwner(userId);
    this.systemServ.emitChangeUsersUpdates();
    return { message: 'owner changed' };
  }

  @RequireAdmin(true)
  @Post('/users/create')
  @ApiSecurity('t')
  @ApiOkResponse({ type: MessageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  async createUser(@Body() body: RegisterDTO): Promise<MessageResponseI> {
    await this.authServ.register(body.username, body.password);
    return { message: 'Usuario Creado' };
  }

  @RequireAdmin(true)
  @UseGuards(FirstUserGuard)
  @Delete('/users/delete/:userid')
  @ApiSecurity('t')
  @ApiOkResponse({ type: MessageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  async deleteUser(@Param('userid') userid: string): Promise<MessageResponseI> {
    return this.authServ.deleteUser(userid);
  }

  @Get('/memory/rss')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiSecurity('t')
  @ApiOkResponse({ type: MemoryUsageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  getMemoryUsageRss(): { usage: number } {
    return { usage: this.adminServ.getMemoryUsage() };
  }

  @Get('/memory/buffer')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiSecurity('t')
  @ApiOkResponse({ type: MemoryUsageResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  getMemoryUsageBuffer(): { usage: number } {
    return { usage: this.adminServ.getBufferUsage() };
  }

  @Get('memory/stats/line')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiSecurity('t')
  @ApiOkResponse({ type: [SerieLineChartResp] })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  getMemorystats(): StatsLineChart {
    return this.monitorServ.getLineChartdataMemoryUsage();
  }

  @Get('logs/stats/:group/line/:time')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiSecurity('t')
  @ApiOkResponse({ type: [SerieLineChartResp] })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiParam({ name: 'group', enum: ['status', 'action', 'reason'], required: true })
  @ApiParam({ name: 'time', enum: ['today', '7days', 'thismonth', '30days', 'custom'], required: true })
  async getLineChartData(@Param('group') group: GROUPFILTER, @Param('time') time: TIMEOPTION): Promise<StatsLineChart> {
    return this.logserv.getLineChartData(group, time);
  }

  @Get('logs/list')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiSecurity('t')
  @ApiQuery({ name: 'page', type: Number, required: true, example: 1 })
  @ApiOkResponse({ type: [SharedFileActivityResp] })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async getLogsList(@Query('page', ParseIntPipe) page: number): Promise<SharedFileActivity[]> {
    return this.logserv.getLogs(page);
  }

  @Get('logs/pages')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiSecurity('t')
  @ApiOkResponse({ type: PagesResp })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async getLogsPages(): Promise<{ pages: number }> {
    return { pages: await this.logserv.getPagesLogs() };
  }
}
