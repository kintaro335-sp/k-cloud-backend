/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

const rawWhiteList = process.env.CORS_LIST || ('' as string);

const whiteList = rawWhiteList.split('|');

export default [...whiteList];
