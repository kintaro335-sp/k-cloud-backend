
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';
import { UserPayload } from './interfaces/userPayload.interface';


@Injectable()
export class JwtStrategyHeader extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: UserPayload): Promise<UserPayload> {
    return { sessionId: payload.sessionId, userId: payload.userId, username: payload.username, isadmin: payload.isadmin };
  }
}

@Injectable()
export class JwtStrategyQuery extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromUrlQueryParameter('t'),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: UserPayload): Promise<UserPayload> {
    return { sessionId: payload.sessionId, userId: payload.userId, username: payload.username, isadmin: payload.isadmin };
  }
}
