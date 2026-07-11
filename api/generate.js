	export default async function handler(req, res) {
	  // ====== 新增：允许跨域请求的代码 ======
	  // 设置 CORS 头
	  res.setHeader('Access-Control-Allow-Credentials', 'true');
	  res.setHeader('Access-Control-Allow-Origin', 'https://xubinlin123.github.io');
	  // 或者用 * 允许所有来源（测试时用）
	  res.setHeader('Access-Control-Allow-Origin', '*');
	  //res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
	 // res.setHeader(
	    'Access-Control-Allow-Headers',
	    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
	  );
	  
	  // 处理预检请求
	  if (req.method === 'OPTIONS') {
	    return res.status(200).end();
	  }
	  if (req.method !== 'POST') {
	    return res.status(405).json({ error: 'Method Not Allowed' });
	  }
	  try {
	    const { imageBase64 } = req.body;
	    if (!imageBase64) {
	      return res.status(400).json({ error: '缺少图片数据' });
	    }
	    // 1. 调用 Qwen-VL 识别商品信息
	    const qwenResponse = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
	      method: 'POST',
	      headers: {
	        'Authorization': `Bearer ${process.env.QWEN_API_KEY}`,
	        'Content-Type': 'application/json'
	      },
	      body: JSON.stringify({
	        model: 'qwen-vl-max',
	        messages: [{
	          role: 'user',
	          content: [
	            { type: 'text', text: '请分析这张商品图片，提取以下信息并严格以JSON格式返回：{"name":"商品名称","category":"分类","features":["卖点1","卖点2"],"material":"主要材质"}' },
	            { type: 'image_url', image: { url: imageBase64 } }
	          ]
	        }]
	      })
	    });
	    const qwenData = await qwenResponse.json();
	    const vlContent = qwenData.choices[0].message.content;
	    const productInfo = JSON.parse(vlContent.replace(/```json|```/g, '').trim());
	    // 2. 调用 DeepSeek 生成营销文案
	    const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
	      method: 'POST',
	      headers: {
	        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
	        'Content-Type': 'application/json'
	      },
	      body: JSON.stringify({
	        model: 'deepseek-chat',
	        messages: [{
	          role: 'system',
	          content: '你是一个顶级电商文案策划，擅长根据商品信息生成极具吸引力的抖店商品标题和详情文案。'
	        }, {
	          role: 'user',
	          content: `基于以下商品信息：${JSON.stringify(productInfo)}，请生成：1. 吸引人的商品标题(30字内) 2. 适合短视频/图文的种草文案(200字内)。以JSON格式返回：{"title":"标题","copywriting":"文案"}`
	        }]
	      })
	    });
	    const dsData = await deepseekResponse.json();
	    const copyInfo = JSON.parse(dsData.choices[0].message.content.replace(/```json|```/g, '').trim());
	    // 3. 返回完整材料
	    res.status(200).json({
	      success: true,
	      data: {
	        product: productInfo,
	        marketing: copyInfo
	      }
	    });
	  } catch (error) {
	    console.error('生成失败:', error);
	    res.status(500).json({ success: false, error: '素材生成失败，请重试' });
	  }
	}
