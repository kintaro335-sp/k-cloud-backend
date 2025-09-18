/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

const rawWhiteList = process.env.CORS_LIST || ('' as string);

const whiteList = rawWhiteList.split('|');

export default [...whiteList];
