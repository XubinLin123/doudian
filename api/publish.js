	export default async function handler(req, res) {
	  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
	  const { finalData } = req.body;
	  // TODO: 后续接入抖店开放平台 API
	  console.log('准备发布到抖店:', finalData);
	  res.status(200).json({ success: true, message: '已加入发布队列，待抖店API接入后自动发布' });
	}
