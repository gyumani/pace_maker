/**
 * Vercel Serverless Function: Garmin Profile
 * POST /api/garmin-profile
 */
const { getUserProfile } = require('../server/garminService');

module.exports = async (req, res) => {
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
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '이메일과 비밀번호를 입력해주세요'
      });
    }

    const profile = await getUserProfile(email, password);

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Profile API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
