require('dotenv').config();
const express = require('express');
const cors = require('cors');
const garminService = require('./garminService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Health Check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Pace Calculator Server is running' });
});

/**
 * Garmin 로그인 테스트
 */
app.post('/api/garmin/login', async (req, res) => {
  try {
    const result = await garminService.login();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 사용자 프로필 가져오기
 * POST /api/garmin/profile
 */
app.post('/api/garmin/profile', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '이메일과 비밀번호를 입력해주세요'
      });
    }

    const profile = await garminService.getUserProfile(email, password);
    res.json({
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
});

/**
 * 최근 러닝 활동 가져오기
 * POST /api/garmin/activities?limit=10
 */
app.post('/api/garmin/activities', async (req, res) => {
  try {
    const { email, password } = req.body;
    const limit = parseInt(req.query.limit) || 10;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '이메일과 비밀번호를 입력해주세요'
      });
    }

    const activities = await garminService.getRecentActivities(email, password, limit);

    res.json({
      success: true,
      data: activities,
      count: activities.length
    });
  } catch (error) {
    console.error('Activities API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 에러 핸들링 미들웨어
 */
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Pace Calculator Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🏃 Garmin API: http://localhost:${PORT}/api/garmin/*`);
  console.log(`ℹ️  Garmin credentials will be provided via API requests`);
});
