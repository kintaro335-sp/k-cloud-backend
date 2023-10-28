import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
// services
import { LogsService } from '../logs/logs.service';
// utils
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logServ: LogsService) {}

  private RegisterActivity(req: Request, res: Response) {
    const params = req.params;
    console.log(params);
    console.log(res.statusCode);
  }

  use(req: Request, res: Response, next: NextFunction) {
    const { method } = req;
    res.on('finish', () => {
      try {
        this.RegisterActivity(req, res);
      } catch (err) {}
    });
    next();
  }
}
