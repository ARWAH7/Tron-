import express from 'express';
import cors from 'cors';
import { 
  redis,
  getBlocks, 
  getStats, 
  clearAll,
  saveAIPrediction,
  getAIPredictions,
  saveAIModelStats,
  getAIModelStats,
  clearAIPredictions,
  clearAIModelStats,
  saveBetRecord,
  getBetRecords,
  saveBetTasks,
  getBetTasks,
  saveBetConfig,
  getBetConfig
} from './redis';

export function createAPI(port: number = 3001) {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  
  // 获取区块列表
  app.get('/api/blocks', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 1000;
      const blocks = await getBlocks(limit);
      
      res.json({
        success: true,
        data: blocks,
        count: blocks.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 获取统计信息
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await getStats();
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 清空所有数据
  app.delete('/api/blocks', async (req, res) => {
    try {
      await clearAll();
      
      res.json({
        success: true,
        message: '所有数据已清空',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 健康检查
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: Date.now(),
    });
  });
  
  // ==================== AI 预测 API ====================
  
  // 保存 AI 预测记录
  app.post('/api/ai/predictions', async (req, res) => {
    try {
      const prediction = req.body;
      await saveAIPrediction(prediction);
      
      res.json({
        success: true,
        message: 'AI 预测记录已保存',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 获取 AI 预测历史
  app.get('/api/ai/predictions', async (req, res) => {
    try {
      const modelId = req.query.modelId as string | undefined;
      const ruleId = req.query.ruleId as string | undefined;
      const limit = parseInt(req.query.limit as string) || 100;
      
      const predictions = await getAIPredictions(modelId, ruleId, limit);
      
      res.json({
        success: true,
        data: predictions,
        count: predictions.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 保存 AI 模型统计
  app.post('/api/ai/model-stats', async (req, res) => {
    try {
      const stats = req.body;
      await saveAIModelStats(stats);
      
      res.json({
        success: true,
        message: 'AI 模型统计已保存',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 获取 AI 模型统计
  app.get('/api/ai/model-stats', async (req, res) => {
    try {
      const stats = await getAIModelStats();
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 清除 AI 预测历史
  app.delete('/api/ai/predictions', async (req, res) => {
    try {
      await clearAIPredictions();
      
      res.json({
        success: true,
        message: 'AI 预测历史已清除',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 清除 AI 模型统计
  app.delete('/api/ai/model-stats', async (req, res) => {
    try {
      await clearAIModelStats();
      
      res.json({
        success: true,
        message: 'AI 模型统计已清除',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // ==================== 下注记录 API ====================
  
  // 保存下注记录
  app.post('/api/bets/records', async (req, res) => {
    try {
      const bet = req.body;
      await saveBetRecord(bet);
      
      res.json({
        success: true,
        message: '下注记录已保存',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 获取下注记录
  app.get('/api/bets/records', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 500;
      const records = await getBetRecords(limit);
      
      res.json({
        success: true,
        data: records,
        count: records.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 保存托管任务
  app.post('/api/bets/tasks', async (req, res) => {
    try {
      const tasks = req.body;
      await saveBetTasks(tasks);
      
      res.json({
        success: true,
        message: '托管任务已保存',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 获取托管任务
  app.get('/api/bets/tasks', async (req, res) => {
    try {
      const tasks = await getBetTasks();
      
      res.json({
        success: true,
        data: tasks,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 保存下注配置
  app.post('/api/bets/config', async (req, res) => {
    try {
      const config = req.body;
      await saveBetConfig(config);
      
      res.json({
        success: true,
        message: '下注配置已保存',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 获取下注配置
  app.get('/api/bets/config', async (req, res) => {
    try {
      const config = await getBetConfig();
      
      res.json({
        success: true,
        data: config,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // ==================== 用户配置 API ====================
  
  // 保存主题颜色
  app.post('/api/config/theme', async (req, res) => {
    try {
      const colors = req.body;
      await redis.set('tron:config:theme', JSON.stringify(colors));
      
      res.json({
        success: true,
        message: '主题颜色已保存',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 获取主题颜色
  app.get('/api/config/theme', async (req, res) => {
    try {
      const data = await redis.get('tron:config:theme');
      const colors = data ? JSON.parse(data) : null;
      
      res.json({
        success: true,
        data: colors,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 保存采样规则
  app.post('/api/config/rules', async (req, res) => {
    try {
      const rules = req.body;
      await redis.set('tron:config:rules', JSON.stringify(rules));
      
      res.json({
        success: true,
        message: '采样规则已保存',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 获取采样规则
  app.get('/api/config/rules', async (req, res) => {
    try {
      const data = await redis.get('tron:config:rules');
      const rules = data ? JSON.parse(data) : null;
      
      res.json({
        success: true,
        data: rules,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 保存激活的规则ID
  app.post('/api/config/active-rule', async (req, res) => {
    try {
      const { ruleId } = req.body;
      await redis.set('tron:config:active_rule', ruleId);
      
      res.json({
        success: true,
        message: '激活规则已保存',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 获取激活的规则ID
  app.get('/api/config/active-rule', async (req, res) => {
    try {
      const ruleId = await redis.get('tron:config:active_rule');
      
      res.json({
        success: true,
        data: ruleId,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 保存关注的模式
  app.post('/api/config/followed-patterns', async (req, res) => {
    try {
      const patterns = req.body;
      await redis.set('tron:config:followed_patterns', JSON.stringify(patterns));
      
      res.json({
        success: true,
        message: '关注模式已保存',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 获取关注的模式
  app.get('/api/config/followed-patterns', async (req, res) => {
    try {
      const data = await redis.get('tron:config:followed_patterns');
      const patterns = data ? JSON.parse(data) : null;
      
      res.json({
        success: true,
        data: patterns,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 清除所有配置
  app.delete('/api/config/all', async (req, res) => {
    try {
      await redis.del('tron:config:theme');
      await redis.del('tron:config:rules');
      await redis.del('tron:config:active_rule');
      await redis.del('tron:config:followed_patterns');
      
      res.json({
        success: true,
        message: '所有配置已清除',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // ==================== 下注余额和指标 API ====================
  
  // 保存账户余额
  app.post('/api/bets/balance', async (req, res) => {
    try {
      const { balance } = req.body;
      await redis.set('tron:bets:balance', balance.toString());
      
      res.json({
        success: true,
        message: '账户余额已保存',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 获取账户余额
  app.get('/api/bets/balance', async (req, res) => {
    try {
      const balance = await redis.get('tron:bets:balance');
      
      res.json({
        success: true,
        data: balance ? parseFloat(balance) : null,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 保存全局指标
  app.post('/api/bets/global-metrics', async (req, res) => {
    try {
      const metrics = req.body;
      await redis.set('tron:bets:global_metrics', JSON.stringify(metrics));
      
      res.json({
        success: true,
        message: '全局指标已保存',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 获取全局指标
  app.get('/api/bets/global-metrics', async (req, res) => {
    try {
      const data = await redis.get('tron:bets:global_metrics');
      const metrics = data ? JSON.parse(data) : null;
      
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  app.listen(port, () => {
    console.log(`[API] 🚀 REST API 启动在端口 ${port}`);
  });
  
  return app;
}
