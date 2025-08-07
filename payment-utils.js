/**
 * 微信支付工具函数
 * 包含签名生成、验证、API调用等功能
 */

const crypto = require('crypto');
const axios = require('axios');

// 微信支付配置
const PAYMENT_CONFIG = {
  appId: process.env.WECHAT_APPID || 'wxe48f433772f6ca68',
  mchId: process.env.WECHAT_MCHID || '1723052039',
  apiKey: process.env.WECHAT_API_KEY || '6yHvP4n9JgKbL7qRd1tF8cYxXaZ2wE39',
  notifyUrl: process.env.PAYMENT_NOTIFY_URL || 'https://test-175573-5-1371111601.sh.run.tcloudbase.com/api/payment/notify',
  unifiedOrderUrl: 'https://api.mch.weixin.qq.com/pay/unifiedorder',
  orderQueryUrl: 'https://api.mch.weixin.qq.com/pay/orderquery'
};

/**
 * 生成随机字符串
 * @param {number} length 长度
 * @returns {string} 随机字符串
 */
function generateNonceStr(length = 32) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成微信支付签名
 * @param {Object} params 参数对象
 * @param {string} apiKey API密钥
 * @returns {string} 签名
 */
function generateSign(params, apiKey) {
  // 1. 排序参数
  const sortedParams = Object.keys(params)
    .filter(key => params[key] !== '' && key !== 'sign')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  // 2. 拼接API密钥
  const stringToSign = `${sortedParams}&key=${apiKey}`;
  
  // 3. MD5加密并转为大写
  return crypto.createHash('md5').update(stringToSign, 'utf8').digest('hex').toUpperCase();
}

/**
 * 验证微信支付回调签名
 * @param {Object} data 回调数据
 * @returns {boolean} 验证结果
 */
function verifyNotifySign(data) {
  const receivedSign = data.sign;
  delete data.sign; // 临时删除sign字段
  
  const calculatedSign = generateSign(data, PAYMENT_CONFIG.apiKey);
  
  // 恢复sign字段
  data.sign = receivedSign;
  
  return receivedSign === calculatedSign;
}

/**
 * 对象转XML
 * @param {Object} obj 对象
 * @returns {string} XML字符串
 */
function objectToXml(obj) {
  let xml = '<xml>';
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (typeof value === 'object' && value !== null) {
      xml += `<${key}>${objectToXml(value)}</${key}>`;
    } else {
      xml += `<${key}><![CDATA[${value}]]></${key}>`;
    }
  });
  xml += '</xml>';
  return xml;
}

/**
 * XML转对象
 * @param {string} xml XML字符串
 * @returns {Object} 对象
 */
function xmlToObject(xml) {
  const result = {};
  const regex = /<(\w+)><!\[CDATA\[(.*?)\]\]><\/\1>/g;
  let match;
  
  while ((match = regex.exec(xml)) !== null) {
    result[match[1]] = match[2];
  }
  
  return result;
}

/**
 * 调用微信统一下单API
 * @param {Object} orderInfo 订单信息
 * @returns {Promise<Object>} 统一下单结果
 */
async function callUnifiedOrder(orderInfo) {
  const {
    orderId,
    amount,
    description,
    userId,
    clientIp = '127.0.0.1'
  } = orderInfo;
  
  // 构造请求参数
  const params = {
    appid: PAYMENT_CONFIG.appId,
    mch_id: PAYMENT_CONFIG.mchId,
    nonce_str: generateNonceStr(),
    body: description,
    out_trade_no: orderId,
    total_fee: amount,
    spbill_create_ip: clientIp,
    notify_url: PAYMENT_CONFIG.notifyUrl,
    trade_type: 'JSAPI',
    openid: userId
  };
  
  // 生成签名
  params.sign = generateSign(params, PAYMENT_CONFIG.apiKey);
  
  // 转换为XML
  const xmlData = objectToXml(params);
  
  try {
    // 调用微信API
    const response = await axios.post(PAYMENT_CONFIG.unifiedOrderUrl, xmlData, {
      headers: {
        'Content-Type': 'application/xml'
      },
      timeout: 10000
    });
    
    // 解析响应
    const result = xmlToObject(response.data);
    
    if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
      // 生成小程序支付参数
      const paymentParams = generateMiniProgramPaymentParams(result.prepay_id);
      
      return {
        success: true,
        prepayId: result.prepay_id,
        ...paymentParams
      };
    } else {
      throw new Error(result.err_code_des || result.return_msg || '统一下单失败');
    }
    
  } catch (error) {
    console.error('调用微信统一下单API失败:', error);
    throw new Error('调用微信支付接口失败: ' + error.message);
  }
}

/**
 * 生成小程序支付参数
 * @param {string} prepayId 预支付ID
 * @returns {Object} 支付参数
 */
function generateMiniProgramPaymentParams(prepayId) {
  const timeStamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = generateNonceStr();
  const packageStr = `prepay_id=${prepayId}`;
  const signType = 'MD5';
  
  // 生成支付签名
  const paySignParams = {
    appId: PAYMENT_CONFIG.appId,
    timeStamp,
    nonceStr,
    package: packageStr,
    signType
  };
  
  const paySign = generateSign(paySignParams, PAYMENT_CONFIG.apiKey);
  
  return {
    timeStamp,
    nonceStr,
    package: packageStr,
    signType,
    paySign
  };
}

/**
 * 查询订单支付状态
 * @param {string} orderId 订单号
 * @returns {Promise<Object>} 查询结果
 */
async function queryOrderStatus(orderId) {
  const params = {
    appid: PAYMENT_CONFIG.appId,
    mch_id: PAYMENT_CONFIG.mchId,
    out_trade_no: orderId,
    nonce_str: generateNonceStr()
  };
  
  params.sign = generateSign(params, PAYMENT_CONFIG.apiKey);
  
  const xmlData = objectToXml(params);
  
  try {
    const response = await axios.post(PAYMENT_CONFIG.orderQueryUrl, xmlData, {
      headers: {
        'Content-Type': 'application/xml'
      },
      timeout: 10000
    });
    
    const result = xmlToObject(response.data);
    
    if (result.return_code === 'SUCCESS') {
      return {
        success: true,
        tradeState: result.trade_state,
        transactionId: result.transaction_id,
        totalFee: parseInt(result.total_fee),
        timeEnd: result.time_end
      };
    } else {
      throw new Error(result.return_msg || '查询订单失败');
    }
    
  } catch (error) {
    console.error('查询订单状态失败:', error);
    throw new Error('查询订单状态失败: ' + error.message);
  }
}

/**
 * 生成订单号
 * @param {string} prefix 前缀
 * @returns {string} 订单号
 */
function generateOrderId(prefix = 'ORDER') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * 生成支付流水号
 * @returns {string} 支付流水号
 */
function generatePaymentId() {
  return generateOrderId('PAY');
}

module.exports = {
  PAYMENT_CONFIG,
  generateNonceStr,
  generateSign,
  verifyNotifySign,
  objectToXml,
  xmlToObject,
  callUnifiedOrder,
  generateMiniProgramPaymentParams,
  queryOrderStatus,
  generateOrderId,
  generatePaymentId
};
