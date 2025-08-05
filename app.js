const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 80;

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'tree-care-api',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: '🌲 名师林数字化小程序API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      trees: '/api/trees',
      treePoints: '/api/tree-points',
      care: '/api/care',
      comments: '/api/comments'
    }
  });
});

// 树木相关API
app.get('/api/trees', async (req, res) => {
  try {
    // 返回树木列表数据
    res.json({
      code: 0,
      data: [
        {
          id: "1",
          name: "银杏树",
          type: "乔木",
          scientificName: "Ginkgo biloba",
          location: "名师林",
          x: 150,
          y: 150,
          growthLevel: 1,
          status: "healthy"
        },
        {
          id: "2", 
          name: "樱花树",
          type: "乔木",
          scientificName: "Prunus serrulata",
          location: "名师林",
          x: 200,
          y: 200,
          growthLevel: 2,
          status: "healthy"
        }
      ],
      message: '获取树木列表成功'
    });
  } catch (error) {
    res.status(500).json({
      code: -1,
      message: '获取树木列表失败：' + error.message
    });
  }
});

// 获取树木坐标点
app.get('/api/tree-points', async (req, res) => {
  try {
    const { region } = req.query;
    
    res.json({
      code: 0,
      data: [
        {
          id: "1",
          name: "银杏树",
          x: 150,
          y: 150,
          region: region || "名师林",
          emoji: "🌲"
        },
        {
          id: "2",
          name: "樱花树", 
          x: 200,
          y: 200,
          region: region || "名师林",
          emoji: "🌸"
        }
      ],
      message: '获取树木坐标点成功'
    });
  } catch (error) {
    res.status(500).json({
      code: -1,
      message: '获取树木坐标点失败：' + error.message
    });
  }
});

// 获取树木详情
app.get('/api/trees/:treeId', async (req, res) => {
  try {
    const { treeId } = req.params;
    
    res.json({
      code: 0,
      data: {
        treeInfo: {
          id: treeId,
          name: "银杏树",
          type: "乔木",
          scientificName: "Ginkgo biloba",
          description: "这是一棵百年银杏树，位于名师林核心区域",
          age: 108,
          height: 15.2,
          growthLevel: 1,
          growthPoints: 0,
          status: "healthy",
          statusText: "健康成长",
          location: "名师林",
          images: [
            process.env.IMAGE_BASE_URL + "/images/1.png"
          ]
        },
        careHistory: [
          {
            id: "1",
            type: "浇水",
            userId: "user123",
            userName: "园丁小王",
            exp: 10,
            createdAt: new Date()
          }
        ],
        comments: [
          {
            id: "1",
            content: "这棵银杏树真的很美！",
            userId: "user456",
            userName: "自然爱好者",
            createdAt: new Date()
          }
        ],
        isCollected: false,
        canWater: true,
        canFertilize: true,
        watered: false
      },
      message: '获取树木详情成功'
    });
  } catch (error) {
    res.status(500).json({
      code: -1,
      message: '获取树木详情失败：' + error.message
    });
  }
});

// 护理记录API
app.post('/api/care', async (req, res) => {
  try {
    const { treeId, careType, expValue } = req.body;
    
    if (!treeId || !careType) {
      return res.status(400).json({
        code: -1,
        message: '参数错误：缺少必要参数'
      });
    }
    
    const careRecord = {
      id: Date.now().toString(),
      treeId,
      type: careType,
      exp: expValue || 10,
      userId: 'mock-user-id',
      userName: '用户',
      createdAt: new Date()
    };
    
    res.json({
      code: 0,
      data: {
        careRecord,
        message: `${careType}成功！获得经验值 ${careRecord.exp}`
      },
      message: '护理记录成功'
    });
  } catch (error) {
    res.status(500).json({
      code: -1,
      message: '护理记录失败：' + error.message
    });
  }
});

// 添加评论API
app.post('/api/comments', async (req, res) => {
  try {
    const { treeId, content } = req.body;
    
    if (!treeId || !content) {
      return res.status(400).json({
        code: -1,
        message: '参数错误：缺少必要参数'
      });
    }
    
    const comment = {
      id: Date.now().toString(),
      treeId,
      content,
      userId: 'mock-user-id',
      userName: '游客',
      avatar: process.env.IMAGE_BASE_URL + '/images/default-avatar.png',
      likes: 0,
      createdAt: new Date()
    };
    
    res.json({
      code: 0,
      data: {
        comment
      },
      message: '评论添加成功'
    });
  } catch (error) {
    res.status(500).json({
      code: -1,
      message: '添加评论失败：' + error.message
    });
  }
});

// 获取评论列表
app.get('/api/comments/:treeId', async (req, res) => {
  try {
    const { treeId } = req.params;
    
    res.json({
      code: 0,
      data: [
        {
          id: "1",
          treeId,
          content: "这棵树真的很美！",
          userId: "user1",
          userName: "自然爱好者",
          avatar: process.env.IMAGE_BASE_URL + "/images/default-avatar.png",
          likes: 5,
          createdAt: new Date()
        }
      ],
      message: '获取评论成功'
    });
  } catch (error) {
    res.status(500).json({
      code: -1,
      message: '获取评论失败：' + error.message
    });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('API Error:', err.stack);
  res.status(500).json({
    code: -1,
    message: '服务器内部错误'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    code: -1,
    message: `接口 ${req.originalUrl} 不存在`
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('🌲 ===== 名师林API服务启动成功 =====');
  console.log(`🚀 服务运行在端口: ${PORT}`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📅 启动时间: ${new Date().toISOString()}`);
  console.log(`💾 图片服务器: ${process.env.IMAGE_BASE_URL || '未配置'}`);
  console.log('🔗 可用接口:');
  console.log('   GET  /health - 健康检查');
  console.log('   GET  /api/trees - 获取树木列表');
  console.log('   GET  /api/tree-points - 获取树木坐标');
  console.log('   GET  /api/trees/:id - 获取树木详情');
  console.log('   POST /api/care - 护理记录');
  console.log('   POST /api/comments - 添加评论');
  console.log('=====================================');
});

module.exports = app;
