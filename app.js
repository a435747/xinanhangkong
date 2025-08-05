const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8080;

// 中间件
app.use(cors());
app.use(express.json());

// 对象存储配置
const STORAGE_BASE_URL = 'https://7072-prod-1guuly5pb8565610-1371111601.tcb.qcloud.la';

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: '名师林数字化小程序API'
  });
});

// 根路径 - 显示所有可用接口
app.get('/', (req, res) => {
  res.json({
    message: "🌲 名师林数字化小程序API",
    version: "1.0.1",
    status: "running", 
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      trees: "/api/trees/:id",
      treePoints: "/api/tree-points", 
      care: "/api/care",
      comments: "/api/comments",
      images: "/api/images/*",
      count: "/api/count"
    }
  });
});

// 🖼️ 图片代理接口 - 重要：放在具体路由之前
app.get('/api/images/*', (req, res) => {
  try {
    const imagePath = req.params[0];
    if (!imagePath) {
      return res.status(400).json({
        code: -1,
        message: '图片路径不能为空'
      });
    }
    
    const imageUrl = `${STORAGE_BASE_URL}/${imagePath}`;
    console.log(`图片代理请求: ${imagePath} -> ${imageUrl}`);
    
    // 重定向到对象存储
    res.redirect(302, imageUrl);
    
  } catch (error) {
    console.error('图片获取失败:', error);
    res.status(404).json({
      code: -1,
      message: '图片获取失败',
      path: req.params[0] || 'unknown'
    });
  }
});

// 🌳 获取树木坐标点
app.get('/api/tree-points', (req, res) => {
  try {
    const { region } = req.query;
    
    const mockTreePoints = [
      {
        id: "1",
        name: "梧桐树", 
        x: 300,
        y: 200,
        region: "名师林",
        level: 5,
        health: "健康"
      },
      {
        id: "2",
        name: "银杏树",
        x: 500, 
        y: 350,
        region: "名师林",
        level: 3,
        health: "良好"
      }
    ];
    
    let filteredPoints = mockTreePoints;
    if (region) {
      filteredPoints = mockTreePoints.filter(point => point.region === region);
    }
    
    res.json({
      code: 0,
      data: filteredPoints,
      message: '获取成功'
    });
  } catch (error) {
    res.status(500).json({
      code: -1,
      message: '获取树木坐标点失败：' + error.message
    });
  }
});

// 🌳 获取树木详情
app.get('/api/trees/:treeId', (req, res) => {
  try {
    const { treeId } = req.params;
    
    const mockTreeDetail = {
      id: treeId,
      name: "梧桐树",
      species: "法桐", 
      age: 8,
      height: "12米",
      diameter: "30厘米",
      health: "健康",
      location: {
        region: "名师林",
        x: 300,
        y: 200
      },
      careHistory: [
        {
          id: "1",
          type: "浇水",
          date: "2024-08-01", 
          operator: "张同学",
          notes: "定期浇水维护"
        }
      ],
      images: [
        "/images/1.png",
        "/images/2.png"
      ]
    };
    
    res.json({
      code: 0,
      data: mockTreeDetail,
      message: '获取成功'
    });
  } catch (error) {
    res.status(500).json({
      code: -1,
      message: '获取树木详情失败：' + error.message
    });
  }
});

// 🌱 护理记录
app.post('/api/care', (req, res) => {
  try {
    const { treeId, careType, expValue, photoUrl } = req.body;
    
    const careRecord = {
      id: Date.now().toString(),
      treeId,
      careType,
      expValue: expValue || 10,
      photoUrl,
      timestamp: new Date().toISOString(),
      operator: "当前用户"
    };
    
    res.json({
      code: 0,
      data: careRecord,
      message: '护理记录成功'
    });
  } catch (error) {
    res.status(500).json({
      code: -1,
      message: '护理记录失败：' + error.message
    });
  }
});

// 💬 添加评论
app.post('/api/comments', (req, res) => {
  try {
    const { treeId, content } = req.body;
    
    const comment = {
      id: Date.now().toString(),
      treeId,
      content,
      author: "当前用户",
      timestamp: new Date().toISOString(),
      likes: 0
    };
    
    res.json({
      code: 0,
      data: comment,
      message: '评论成功'
    });
  } catch (error) {
    res.status(500).json({
      code: -1,
      message: '评论失败：' + error.message
    });
  }
});

// 💬 获取评论
app.get('/api/comments/:treeId', (req, res) => {
  try {
    const { treeId } = req.params;
    
    const mockComments = [
      {
        id: "1",
        treeId,
        content: "这棵树长得真好！",
        author: "李同学",
        timestamp: "2024-08-01T10:00:00Z",
        likes: 5
      }
    ];
    
    res.json({
      code: 0,
      data: mockComments,
      message: '获取成功'
    });
  } catch (error) {
    res.status(500).json({
      code: -1,
      message: '获取评论失败：' + error.message
    });
  }
});

// 📊 计数接口
app.post('/api/count', (req, res) => {
  try {
    const { action } = req.body;
    
    if (action === 'inc') {
      const count = Math.floor(Math.random() * 100) + 1;
      
      res.json({
        code: 0,
        data: {
          count: count,
          action: 'inc',
          timestamp: new Date().toISOString()
        },
        message: '计数成功'
      });
    } else {
      res.status(400).json({
        code: -1,
        message: '无效的操作类型'
      });
    }
  } catch (error) {
    res.status(500).json({
      code: -1, 
      message: '计数操作失败：' + error.message
    });
  }
});

// 404处理 - 放在最后
app.use('*', (req, res) => {
  res.status(404).json({
    code: -1,
    message: `接口 ${req.originalUrl} 不存在`,
    availableEndpoints: [
      '/health',
      '/',
      '/api/tree-points',
      '/api/trees/:id',
      '/api/care',
      '/api/comments',
      '/api/comments/:treeId',
      '/api/images/*',
      '/api/count'
    ]
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`🚀 名师林API服务运行在端口 ${port}`);
  console.log(`📊 健康检查: http://localhost:${port}/health`);
  console.log(`🖼️ 图片代理: http://localhost:${port}/api/images/images/1.png`);
  console.log(`🌳 树木接口: http://localhost:${port}/api/trees/1`);
  console.log(`📍 坐标接口: http://localhost:${port}/api/tree-points`);
});
