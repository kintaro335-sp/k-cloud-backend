import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
// services
import { LogsService } from '../logs/logs.service';
// utils
import { v4 as uuidv4 } from 'uuid';
// types
import { ActionT, statusT, reasonT } from '../logs/interfaces/sharedfileActivity.interface';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logServ: LogsService) {}

  private processPath(path: Record<string, string>) {
    const pathString = Object.keys(path)
      .filter((v) => v !== 'id')
      .map((key) => path[key])
      .join('/');
    return pathString;
  }

  getAction(method: string, path: string, dq = 0): ActionT {
    switch (method) {
      case 'GET':
        if (path.includes('zip')) {
          return 'DOWNLOAD_ZIP';
        }
        if (Boolean(dq)) {
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

  getStatus(statusCode: number): statusT {
    if ([200, 201, 304].includes(statusCode)) {
      return 'ALLOWED';
    }

    return 'DENIED';
  }

  getReason(statusCode: number, path: string): reasonT {
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
    if (method === 'PATCH') {
      return;
    }
    if (route.includes('list') || route.includes('pages')) {
      return;
    }
    const tokenid = params.id || '';
    const path = this.processPath(params);
    const action = this.getAction(method, route, Number(req.query.d));
    const status = this.getStatus(res.statusCode);
    const reason = this.getReason(res.statusCode, route);
    // @ts-ignore
    const user = req.user.userId || '';
    const newEntry = { id, action, status, tokenid, date: new Date(), path, reason, user };
    this.logServ.createLog(newEntry);
  }

  use(req: Request, res: Response, next: NextFunction) {
    res.on('finish', () => {
      try {
        this.RegisterActivity(req, res);
      } catch (err) {}
    });
    next();
  }
}
