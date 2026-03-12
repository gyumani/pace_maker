/**
 * Vercel Serverless Function: Garmin Activities
 * POST /api/garmin/activities
 */
const { getRecentActivities } = require('../_lib/garmin');

module.exports = async (req, res) => {
  const startTime = Date.now();

  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    console.warn('⚠️ [Activities API] Method not allowed:', req.method);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { email, password } = req.body;
    const limit = parseInt(req.query.limit) || 10;

    console.log('📍 [Activities API] 요청 시작:', {
      timestamp: new Date().toISOString(),
      email,
      limit
    });

    if (!email || !password) {
      console.warn('⚠️ [Activities API] 인증 정보 누락');
      return res.status(400).json({
        success: false,
        error: '이메일과 비밀번호를 입력해주세요'
      });
    }

    console.log('🔄 [Activities API] 활동 데이터 요청:', { email, limit });
    const activities = await getRecentActivities(email, password, limit);

    const duration = Date.now() - startTime;
    console.log('✅ [Activities API] 성공:', {
      email,
      count: activities.length,
      duration: `${duration}ms`
    });

    res.status(200).json({
      success: true,
      data: activities,
      count: activities.length
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ [Activities API] 실패:', {
      error: error.message,
      duration: `${duration}ms`,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
