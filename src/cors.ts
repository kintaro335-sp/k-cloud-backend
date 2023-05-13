const rawWhiteList = process.env.CORS_LIST || ('' as string);

const whiteList = rawWhiteList.split('|');

export default [...whiteList];
