/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

const secret = process.env.SECRET_KEY || 'foo';

export const jwtConstants = {
  secret
};
