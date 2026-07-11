export default async function handler(req, res) {
  // ========== CORS 头 ==========
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', 'https://xubinlin123.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

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

    // ========== 检查环境变量 ==========
    if (!process.env.QWEN_API_KEY) {
      console.error('❌ QWEN_API_KEY 未设置');
      return res.status(500).json({ success: false, error: '服务器配置错误：QWEN_API_KEY 未设置' });
    }
    if (!process.env.DEEPSEEK_API_KEY) {
      console.error('❌ DEEPSEEK_API_KEY 未设置');
      return res.status(500).json({ success: false, error: '服务器配置错误：DEEPSEEK_API_KEY 未设置' });
    }

    // ========== 1. 调用 Qwen-VL ==========
    console.log('🚀 调用 Qwen-VL...');
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
            { type: 'image_url', image_url: { url: imageBase64 } }
          ]
        }]
      })
    });

    // 检查 HTTP 状态码
    if (!qwenResponse.ok) {
      const errorText = await qwenResponse.text();
      console.error('❌ Qwen-VL HTTP 错误:', qwenResponse.status, errorText);
      return res.status(500).json({ success: false, error: `Qwen-VL 请求失败: ${qwenResponse.status}` });
    }

    const qwenData = await qwenResponse.json();
    console.log('📦 Qwen-VL 原始响应:', JSON.stringify(qwenData, null, 2));

    // 检查响应结构
    if (!qwenData.choices || !qwenData.choices[0] || !qwenData.choices[0].message) {
      console.error('❌ Qwen-VL 响应结构异常:', qwenData);
      return res.status(500).json({ success: false, error: 'Qwen-VL 返回数据格式异常' });
    }

    const vlContent = qwenData.choices[0].message.content;
    console.log('📝 Qwen-VL content:', vlContent);

    // 安全解析 JSON
    let productInfo;
    try {
      const cleaned = vlContent
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/^\s*[\r\n]+/g, '')
        .replace(/[\r\n]+\s*$/g, '')
        .trim();
      console.log('🧹 清理后:', cleaned);
      productInfo = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('❌ JSON 解析失败:', parseErr.message, '原始内容:', vlContent);
      return res.status(500).json({ success: false, error: 'AI 返回内容解析失败', raw: vlContent });
    }

    // ========== 2. 调用 DeepSeek ==========
    console.log('🚀 调用 DeepSeek...');
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

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      console.error('❌ DeepSeek HTTP 错误:', deepseekResponse.status, errorText);
      return res.status(500).json({ success: false, error: `DeepSeek 请求失败: ${deepseekResponse.status}` });
    }

    const dsData = await deepseekResponse.json();
    console.log('📦 DeepSeek 原始响应:', JSON.stringify(dsData, null, 2));

    if (!dsData.choices || !dsData.choices[0] || !dsData.choices[0].message) {
      console.error('❌ DeepSeek 响应结构异常:', dsData);
      return res.status(500).json({ success: false, error: 'DeepSeek 返回数据格式异常' });
    }

    const dsContent = dsData.choices[0].message.content;
    console.log('📝 DeepSeek content:', dsContent);

    let copyInfo;
    try {
      const cleaned = dsContent
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/^\s*[\r\n]+/g, '')
        .replace(/[\r\n]+\s*$/g, '')
        .trim();
      copyInfo = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('❌ DeepSeek JSON 解析失败:', parseErr.message, '原始内容:', dsContent);
      return res.status(500).json({ success: false, error: 'DeepSeek 返回内容解析失败', raw: dsContent });
    }

    // ========== 3. 返回结果 ==========
    console.log('✅ 生成成功');
    res.status(200).json({
      success: true,
      data: {
        product: productInfo,
        marketing: copyInfo
      }
    });

  } catch (error) {
    console.error('❌ 未捕获异常:', error);
    res.status(500).json({ success: false, error: error.message || '素材生成失败，请重试' });
  }
}
