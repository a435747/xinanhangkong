const express = require('express');
const cors = require('cors');
const axios = require('axios');
const paymentUtils = require('./payment-utils');
const app = express();
const port = process.env.PORT || 8080;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.text({ type: 'application/xml' })); // 支持微信支付回调XML

// 对象存储配置
const STORAGE_BASE_URL = 'https://636c-cloudbase-8geef97fbe06f6f1-1371111601.tcb.qcloud.la';

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
    version: "2.0.0",
    status: "running", 
    timestamp: new Date().toISOString(),
    endpoints: {
      // 基础接口
      health: "/health",
      trees: "/api/trees/:id",
      treePoints: "/api/tree-points", 
      care: "/api/care",
      comments: "/api/comments",
      images: "/api/images/*",
      count: "/api/count",
      
      // 支付相关接口
      createOrder: "POST /api/orders",
      queryOrder: "GET /api/orders/:orderId", 
      unifiedOrder: "POST /api/payment/unifiedorder",
      paymentNotify: "POST /api/payment/notify",
      queryPayment: "GET /api/payment/query/:orderId",
      mockPayment: "POST /api/payment/mock-success/:orderId"
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
    
    // 处理双层images目录结构
    // 如果路径是 images/xxx，需要映射到 images/images/xxx
    let actualPath = imagePath;
    if (imagePath.startsWith('images/')) {
      actualPath = `images/${imagePath}`;
    }
    
    const imageUrl = `${STORAGE_BASE_URL}/${actualPath}`;
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

// 🔐 微信登录接口 - 通过code换取openid
app.post('/api/auth/login', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        code: -1,
        message: '缺少登录code'
      });
    }
    
    // 调用微信接口获取openid
    const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: process.env.WECHAT_APPID || 'wxe48f433772f6ca68',
        secret: process.env.WECHAT_SECRET || '你需要在环境变量中配置小程序secret',
        js_code: code,
        grant_type: 'authorization_code'
      },
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
      }),
      timeout: 10000
    });
    
    if (response.data.errcode) {
      console.error('微信登录失败:', response.data);
      return res.status(400).json({
        code: -1,
        message: '微信登录失败: ' + response.data.errmsg
      });
    }
    
    const { openid, session_key } = response.data;
    
    res.json({
      code: 0,
      data: {
        openid,
        sessionKey: session_key
      },
      message: '登录成功'
    });
    
  } catch (error) {
    console.error('登录接口错误:', error);
    res.status(500).json({
      code: -1,
      message: '登录失败：' + error.message
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

// ========================= 💳 支付相关接口 =========================

// 内存存储（生产环境应使用数据库）
const orders = new Map();
const payments = new Map();

// 🛒 创建订单
app.post('/api/orders', (req, res) => {
  try {
    const {
      orderType,
      amount,
      title,
      description,
      orderDetails,
      contactInfo,
      userId
    } = req.body;
    
    // 验证必要参数
    if (!orderType || !amount || !title || !userId) {
      return res.status(400).json({
        code: -1,
        message: '缺少必要参数'
      });
    }
    
    // 生成订单
    const orderId = paymentUtils.generateOrderId();
    const now = new Date();
    const expiredAt = new Date(now.getTime() + 30 * 60 * 1000); // 30分钟后过期
    
    const order = {
      orderId,
      userId,
      orderType,
      status: 'pending',
      amount: parseInt(amount),
      currency: 'CNY',
      title,
      description,
      orderDetails: orderDetails || {},
      contactInfo: contactInfo || {},
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiredAt: expiredAt.toISOString(),
      paidAt: null,
      paymentMethod: null,
      paymentId: null,
      transactionId: null,
      fulfillment: {
        treeId: null,
        certificateUrl: null,
        qrCodeUrl: null,
        status: 'pending'
      }
    };
    
    // 保存订单
    orders.set(orderId, order);
    
    console.log(`创建订单成功: ${orderId}, 金额: ¥${amount/100}`);
    
    res.json({
      code: 0,
      data: order,
      message: '订单创建成功'
    });
    
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({
      code: -1,
      message: '创建订单失败：' + error.message
    });
  }
});

// 📋 查询订单
app.get('/api/orders/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    const order = orders.get(orderId);
    
    if (!order) {
      return res.status(404).json({
        code: -1,
        message: '订单不存在'
      });
    }
    
    res.json({
      code: 0,
      data: order,
      message: '查询成功'
    });
    
  } catch (error) {
    res.status(500).json({
      code: -1,
      message: '查询订单失败：' + error.message
    });
  }
});

// 💳 统一下单（创建支付）
app.post('/api/payment/unifiedorder', async (req, res) => {
  try {
    const { orderId } = req.body;
    
    // 查询订单
    const order = orders.get(orderId);
    if (!order) {
      return res.status(404).json({
        code: -1,
        message: '订单不存在'
      });
    }
    
    // 检查订单状态
    if (order.status !== 'pending') {
      return res.status(400).json({
        code: -1,
        message: '订单状态不允许支付'
      });
    }
    
    // 检查订单是否过期
    if (new Date() > new Date(order.expiredAt)) {
      order.status = 'cancelled';
      orders.set(orderId, order);
      return res.status(400).json({
        code: -1,
        message: '订单已过期'
      });
    }
    
    // 生成支付记录
    const paymentId = paymentUtils.generatePaymentId();
    const now = new Date();
    
    try {
      // 添加调试日志
      console.log(`统一下单开始 - 订单ID: ${orderId}, 用户ID: ${order.userId}`);
      
      // 如果是测试用户，直接使用模拟支付
      if (order.userId.startsWith('test_')) {
        console.log('检测到测试用户，使用模拟支付模式');
        throw new Error('模拟微信支付失败，切换到测试模式');
      }
      
      console.log('非测试用户，调用真实微信支付接口');
      
      // 调用微信统一下单API
      const wechatResult = await paymentUtils.callUnifiedOrder({
        orderId,
        amount: order.amount,
        description: order.title,
        userId: order.userId,
        clientIp: req.ip || '127.0.0.1'
      });
      
      // 创建支付记录
      const payment = {
        paymentId,
        orderId,
        userId: order.userId,
        paymentMethod: 'wechat',
        amount: order.amount,
        currency: 'CNY',
        status: 'pending',
        wechatPayment: {
          appId: paymentUtils.PAYMENT_CONFIG.appId,
          mchId: paymentUtils.PAYMENT_CONFIG.mchId,
          nonceStr: wechatResult.nonceStr,
          prepayId: wechatResult.prepay_id,
          transactionId: null,
          tradeType: 'JSAPI',
          signType: wechatResult.signType,
          paySign: wechatResult.paySign
        },
        createdAt: now.toISOString(),
        paidAt: null,
        notifiedAt: null,
        notifyData: null,
        verifyStatus: null
      };
      
      // 保存支付记录
      payments.set(paymentId, payment);
      
      // 更新订单
      order.paymentId = paymentId;
      order.updatedAt = now.toISOString();
      orders.set(orderId, order);
      
      console.log(`统一下单成功: ${orderId}, 支付ID: ${paymentId}`);
      
      // 返回小程序支付参数
      res.json({
        code: 0,
        data: {
          orderId,
          paymentId,
          timeStamp: wechatResult.timeStamp,
          nonceStr: wechatResult.nonceStr,
          package: wechatResult.package,
          signType: wechatResult.signType,
          paySign: wechatResult.paySign
        },
        message: '创建支付成功'
      });
      
    } catch (wechatError) {
      console.error('微信统一下单失败:', wechatError);
      
      // 如果是测试环境或测试用户，返回模拟数据
      if (process.env.NODE_ENV === 'development' || order.userId.startsWith('test_')) {
        const mockPayment = {
          paymentId,
          orderId,
          userId: order.userId,
          paymentMethod: 'wechat',
          amount: order.amount,
          currency: 'CNY',
          status: 'pending',
          wechatPayment: {
            appId: paymentUtils.PAYMENT_CONFIG.appId,
            mchId: 'mock_mch_id',
            nonceStr: paymentUtils.generateNonceStr(),
            prepayId: 'mock_prepay_id',
            transactionId: null,
            tradeType: 'JSAPI',
            signType: 'MD5',
            paySign: 'mock_pay_sign'
          },
          createdAt: now.toISOString(),
          paidAt: null
        };
        
        payments.set(paymentId, mockPayment);
        order.paymentId = paymentId;
        orders.set(orderId, order);
        
        res.json({
          code: 0,
          data: {
            orderId,
            paymentId,
            timeStamp: Math.floor(Date.now() / 1000).toString(),
            nonceStr: mockPayment.wechatPayment.nonceStr,
            package: 'prepay_id=' + mockPayment.wechatPayment.prepayId,
            signType: 'MD5',
            paySign: mockPayment.wechatPayment.paySign,
            mockMode: true
          },
          message: '创建支付成功（测试模式）'
        });
      } else {
        throw wechatError;
      }
    }
    
  } catch (error) {
    console.error('统一下单失败:', error);
    res.status(500).json({
      code: -1,
      message: '创建支付失败：' + error.message
    });
  }
});

// 📞 支付回调通知
app.post('/api/payment/notify', (req, res) => {
  try {
    console.log('收到微信支付回调通知');
    
    // 解析XML数据
    let notifyData;
    if (typeof req.body === 'string') {
      notifyData = paymentUtils.xmlToObject(req.body);
    } else {
      notifyData = req.body;
    }
    
    console.log('回调数据:', notifyData);
    
    // 验证回调签名
    const isValidSign = paymentUtils.verifyNotifySign({...notifyData});
    
    if (!isValidSign) {
      console.error('支付回调签名验证失败');
      return res.send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[签名验证失败]]></return_msg></xml>');
    }
    
    // 处理支付成功
    if (notifyData.result_code === 'SUCCESS' && notifyData.return_code === 'SUCCESS') {
      const orderId = notifyData.out_trade_no;
      const transactionId = notifyData.transaction_id;
      const totalFee = parseInt(notifyData.total_fee);
      
      // 查找订单和支付记录
      const order = orders.get(orderId);
      if (!order) {
        console.error('回调中订单不存在:', orderId);
        return res.send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[订单不存在]]></return_msg></xml>');
      }
      
      const payment = payments.get(order.paymentId);
      if (!payment) {
        console.error('回调中支付记录不存在:', order.paymentId);
        return res.send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[支付记录不存在]]></return_msg></xml>');
      }
      
      // 检查金额
      if (totalFee !== order.amount) {
        console.error('回调金额不匹配:', totalFee, 'vs', order.amount);
        return res.send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[金额不匹配]]></return_msg></xml>');
      }
      
      // 更新支付记录
      const now = new Date();
      payment.status = 'success';
      payment.wechatPayment.transactionId = transactionId;
      payment.paidAt = now.toISOString();
      payment.notifiedAt = now.toISOString();
      payment.notifyData = notifyData;
      payment.verifyStatus = 'verified';
      payments.set(payment.paymentId, payment);
      
      // 更新订单状态
      order.status = 'paid';
      order.paidAt = now.toISOString();
      order.updatedAt = now.toISOString();
      order.transactionId = transactionId;
      orders.set(orderId, order);
      
      console.log(`支付成功: 订单${orderId}, 微信交易号${transactionId}, 金额¥${totalFee/100}`);
      
      // 触发订单履约（异步处理）
      setTimeout(() => fulfillOrder(orderId), 100);
      
      // 返回成功响应
      res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>');
    } else {
      console.error('支付失败回调:', notifyData.err_code, notifyData.err_code_des);
      res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>');
    }
    
  } catch (error) {
    console.error('处理支付回调失败:', error);
    res.send('<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[系统错误]]></return_msg></xml>');
  }
});

// 🔍 查询支付状态
app.get('/api/payment/query/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = orders.get(orderId);
    if (!order) {
      return res.status(404).json({
        code: -1,
        message: '订单不存在'
      });
    }
    
    const payment = payments.get(order.paymentId);
    if (!payment) {
      return res.status(404).json({
        code: -1,
        message: '支付记录不存在'
      });
    }
    
    // 如果订单未支付，主动查询微信支付状态
    if (order.status === 'pending' && payment.status === 'pending') {
      try {
        const queryResult = await paymentUtils.queryOrderStatus(orderId);
        
        if (queryResult.success && queryResult.tradeState === 'SUCCESS') {
          // 更新订单和支付状态
          const now = new Date();
          
          payment.status = 'success';
          payment.wechatPayment.transactionId = queryResult.transactionId;
          payment.paidAt = now.toISOString();
          payments.set(payment.paymentId, payment);
          
          order.status = 'paid';
          order.paidAt = now.toISOString();
          order.updatedAt = now.toISOString();
          order.transactionId = queryResult.transactionId;
          orders.set(orderId, order);
          
          // 触发订单履约
          setTimeout(() => fulfillOrder(orderId), 100);
        }
      } catch (queryError) {
        console.error('查询微信支付状态失败:', queryError);
      }
    }
    
    res.json({
      code: 0,
      data: {
        orderId,
        orderStatus: order.status,
        paymentStatus: payment.status,
        amount: payment.amount,
        paidAt: payment.paidAt,
        transactionId: payment.wechatPayment?.transactionId
      },
      message: '查询成功'
    });
    
  } catch (error) {
    res.status(500).json({
      code: -1,
      message: '查询支付状态失败：' + error.message
    });
  }
});

// 🚀 模拟支付成功（仅测试用）
app.post('/api/payment/mock-success/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = orders.get(orderId);
    if (!order) {
      return res.status(404).json({
        code: -1,
        message: '订单不存在'
      });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({
        code: -1,
        message: '订单状态不允许支付'
      });
    }
    
    const payment = payments.get(order.paymentId);
    if (!payment) {
      return res.status(404).json({
        code: -1,
        message: '支付记录不存在'
      });
    }
    
    // 模拟支付成功
    const now = new Date();
    const mockTransactionId = 'MOCK_' + Date.now();
    
    payment.status = 'success';
    payment.wechatPayment.transactionId = mockTransactionId;
    payment.paidAt = now.toISOString();
    payments.set(payment.paymentId, payment);
    
    order.status = 'paid';
    order.paidAt = now.toISOString();
    order.updatedAt = now.toISOString();
    order.transactionId = mockTransactionId;
    orders.set(orderId, order);
    
    console.log(`模拟支付成功: ${orderId}`);
    
    // 触发订单履约
    setTimeout(() => fulfillOrder(orderId), 100);
    
    res.json({
      code: 0,
      data: {
        orderId,
        transactionId: mockTransactionId,
        paidAt: now.toISOString()
      },
      message: '模拟支付成功'
    });
    
  } catch (error) {
    res.status(500).json({
      code: -1,
      message: '模拟支付失败：' + error.message
    });
  }
});

// 🎯 订单履约处理
function fulfillOrder(orderId) {
  try {
    const order = orders.get(orderId);
    if (!order || order.status !== 'paid') {
      return;
    }
    
    console.log(`开始履约订单: ${orderId}`);
    
    // 根据订单类型进行不同的履约处理
    switch (order.orderType) {
      case 'donation':
        // 树木捐赠履约
        fulfillDonationOrder(order);
        break;
      case 'watering':
        // 浇水服务履约
        fulfillWateringOrder(order);
        break;
      default:
        console.log(`未知订单类型: ${order.orderType}`);
    }
    
  } catch (error) {
    console.error('订单履约失败:', error);
  }
}

// 履约捐赠订单
function fulfillDonationOrder(order) {
  // 模拟分配树木
  const mockTreeId = 'TREE_' + Date.now();
  const mockCertificateUrl = `${STORAGE_BASE_URL}/certificates/${order.orderId}.pdf`;
  const mockQrCodeUrl = `${STORAGE_BASE_URL}/qrcodes/${mockTreeId}.png`;
  
  order.fulfillment = {
    treeId: mockTreeId,
    certificateUrl: mockCertificateUrl,
    qrCodeUrl: mockQrCodeUrl,
    status: 'fulfilled'
  };
  
  orders.set(order.orderId, order);
  
  console.log(`捐赠订单履约完成: ${order.orderId}, 分配树木: ${mockTreeId}`);
}

// 履约浇水订单
function fulfillWateringOrder(order) {
  // 模拟浇水服务完成
  order.fulfillment = {
    treeId: order.orderDetails?.treeId || null,
    serviceTime: new Date().toISOString(),
    status: 'fulfilled'
  };
  
  orders.set(order.orderId, order);
  
  console.log(`浇水订单履约完成: ${order.orderId}`);
}

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
