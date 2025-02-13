/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */
import { SetMetadata } from '@nestjs/common';
import { Scope } from '../../sessions/interfaces/session.interface';

export const ScopesR = (scopes: Scope[]) => SetMetadata('scopesR', scopes);
