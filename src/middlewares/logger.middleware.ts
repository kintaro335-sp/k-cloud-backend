/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
// services
import { LogsService } from '../logs/logs.service';
import { PrismaService } from '../prisma.service';
// utils
import { v4 as uuidv4 } from 'uuid';
// types
import { ActionT, statusT, reasonT } from '../logs/interfaces/sharedfileActivity.interface';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  // constants
  private apiPrefix = Boolean(process.env.SERVE_CLIENT) ? '/api' : '';
  private databaseWal = process.env.DATABASE_WAL === '1';
  // variables
  private logsWritten = 0;

  constructor(
    private readonly logServ: LogsService,
    private prismaServ: PrismaService
  ) {}

  private truncateWal() {
    if (this.logsWritten > 100 && this.databaseWal) {
      this.prismaServ.$executeRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE);');
      this.logsWritten = 0;
    }
  }

  private processPath(path: string[] | undefined) {
    if (path === undefined) return '';
    const pathString = path.join('/');
    return pathString;
  }

  private getAction(method: string, path: string, dq = 0): ActionT {
    switch (method) {
      case 'GET':
        if (path.includes('zip')) {
          return 'DOWNLOAD_ZIP';
        }
        if (dq == 1) {
          return 'DOWNLOAD';
        }
        return 'READ';
      case 'POST':
        if (path.includes('share')) {
          return 'CREATED';
        }
        return 'MODIFY';
      case 'PATCH':
        return 'DELETE';
      case 'DELETE':
        return 'DELETE';
    }
  }

  private getStatus(statusCode: number): statusT {
    if ([200, 201, 304].includes(statusCode)) {
      return 'ALLOWED';
    }

    return 'DENIED';
  }

  private getReason(statusCode: number, path: string): reasonT {
    if ([200, 201, 304].includes(statusCode)) {
      return 'NONE';
    }
    if (statusCode === 404) {
      if (path.includes('content') || path.includes('info')) {
        return 'EXPIRED';
      }
      return 'NOT_EXIST';
    }
    return 'NOT_EXIST';
  }

  private RegisterActivity(req: Request, res: Response) {
    const id = uuidv4();
    const params = req.params;
    const method = req.method;
    const route = req.route.path as string;
    if (
      ![
        `${this.apiPrefix}/shared-file/content/:id`,
        `${this.apiPrefix}/shared-file/content/:id/*path`,
        `${this.apiPrefix}/shared-file/zip/:id`,
        `${this.apiPrefix}/shared-file/zip/:id/*path`
      ].includes(route)
    ) {
      return;
    }
    if (method === 'PATCH') {
      return;
    }
    if (route.includes('list') || route.includes('pages')) {
      return;
    }
    const tokenid = params.id || '';
    // @ts-ignore
    const path = this.processPath(params.path);
    const action = this.getAction(method, route, Number(req.query.d));
    const status = this.getStatus(res.statusCode);
    const reason = this.getReason(res.statusCode, route);
    // @ts-ignore
    const user = req?.user?.userId || '';
    const newEntry = { id, action, status, tokenid, date: new Date(), path, reason, user };
    this.logsWritten++;
    this.truncateWal();
    this.logServ.createLog(newEntry);
  }

  use(req: Request, res: Response, next: NextFunction) {
    res.on('finish', () => {
      try {
        this.RegisterActivity(req, res);
      } catch (err) {
        console.error(err);
      }
    });
    next();
  }
}
