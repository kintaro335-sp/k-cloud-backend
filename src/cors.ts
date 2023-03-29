const rawWhiteList = process.env.CORS_LIST || '' as string;

const rawIpRange = process.env.CORS_IP_RANGE || '' as string;

const whiteList = rawWhiteList.split('|');
const other = [];

export default [...other, ...whiteList];
