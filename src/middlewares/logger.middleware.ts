import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
// services
import { LogsService } from '../logs/logs.service';
// utils
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logServ: LogsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method } = req;
    res.on('finish', () => {
      this.logServ.createLog({
        id: uuidv4(),
        date: new Date(Date.now()),
        method,
        route: req.route.path,
        statusCode: String(res.statusCode),
        MessageError: ''
      });
    });
    next();
  }
}
