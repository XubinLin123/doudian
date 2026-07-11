	export default async function handler(req, res) {
	  // ====== 新增：允许跨域请求的代码（必须放在函数最开头） ======
	  res.setHeader('Access-Control-Allow-Origin', '*'); // 允许所有域名访问（包括您的 GitHub Pages）
	  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // 允许的请求方法
	  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // 允许的请求头
	 
	  // 如果是浏览器发送的预检请求（OPTIONS），直接返回 200，不往下执行
	  if (req.method === 'OPTIONS') {
	    return res.status(200).end();
	  }
		
	  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
	  const { finalData } = req.body;
	  // TODO: 后续接入抖店开放平台 API
	  console.log('准备发布到抖店:', finalData);
	  res.status(200).json({ success: true, message: '已加入发布队列，待抖店API接入后自动发布' });
	}
