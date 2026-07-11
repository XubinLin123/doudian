	export default async function handler(req, res) {
	  // ====== 新增：允许跨域请求的代码 ======
	  // 设置 CORS 头
	  res.setHeader('Access-Control-Allow-Credentials', 'true');
	  res.setHeader('Access-Control-Allow-Origin', 'https://xubinlin123.github.io');
	  // 或者用 * 允许所有来源（测试时用）
	  // res.setHeader('Access-Control-Allow-Origin', '*');
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
