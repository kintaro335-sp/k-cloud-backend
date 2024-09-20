/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

const secret = process.env.SECRET_KEY || 'foo';

export const jwtConstants = {
  secret
};
