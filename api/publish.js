	export default async function handler(req, res) {
	 // ========== 1. 先设置 CORS 头（必须放在最前面）==========
	  res.setHeader('Access-Control-Allow-Credentials', 'true');
	  res.setHeader('Access-Control-Allow-Origin', 'https://xubinlin123.github.io');
	  // 如果要允许多个域名，可以改成：
	  // const allowedOrigins = ['https://xubinlin123.github.io', 'http://localhost:3000'];
	  // const origin = req.headers.origin;
	  // if (allowedOrigins.includes(origin)) {
	  //   res.setHeader('Access-Control-Allow-Origin', origin);
	  // }
	  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
	  res.setHeader(
	    'Access-Control-Allow-Headers',
	    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
	  );
		
	  // 处理预检请求
	  if (req.method === 'OPTIONS') {
	    return res.status(200).end();
	  }
		
	  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
	  const { finalData } = req.body;
	  // TODO: 后续接入抖店开放平台 API
	  console.log('准备发布到抖店:', finalData);
	  res.status(200).json({ success: true, message: '已加入发布队列，待抖店API接入后自动发布' });
	}
