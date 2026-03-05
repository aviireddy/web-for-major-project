import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

let jobs = {};
let results = {};

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('✓ Health check');
  res.json({ status: 'ok' });
});

// Start evaluation endpoint
app.post('/evaluate', (req, res) => {
  const jobId = `job_${Date.now()}`;
  const startTime = Date.now();
  
  console.log('\n🚀 Evaluation started:', jobId);
  console.log('📋 Config:', JSON.stringify(req.body, null, 2));
  
  jobs[jobId] = { 
    status: 'running', 
    startTime,
    config: req.body
  };
  
  // Simulate completion after 20 seconds
  setTimeout(() => {
    jobs[jobId].status = 'completed';
    
    // Generate realistic metrics based on enabled attacks
    const enabledAttacks = Object.keys(req.body.attacks).filter(
      attack => req.body.attacks[attack].enabled
    );
    
    const robustAccuracy = {};
    const attackSuccessRate = {};
    let worstCase = 1.0;
    
    enabledAttacks.forEach(attack => {
      const robust = 0.35 + Math.random() * 0.25; // 0.35-0.60
      robustAccuracy[attack] = robust;
      attackSuccessRate[attack] = 1 - robust;
      worstCase = Math.min(worstCase, robust);
    });
    
    results[jobId] = {
      job_id: jobId,
      status: 'completed',
      metrics: {
        clean_accuracy: 0.78 + Math.random() * 0.15, // 0.78-0.93
        robust_accuracy: robustAccuracy,
        attack_success_rate: attackSuccessRate,
        worst_case_robust: worstCase
      },
      evaluation: {
        experiment_name: req.body.experiment_name,
        total_samples: 10000,
        duration_seconds: 20,
        attacks_performed: enabledAttacks,
        model: req.body.model.architecture,
        dataset: req.body.dataset.name
      }
    };
    
    console.log('✅ Evaluation completed:', jobId);
    console.log('📊 Metrics:', JSON.stringify(results[jobId].metrics, null, 2));
  }, 20000); // 20 seconds
  
  res.json({ job_id: jobId, status: 'running' });
});

// Check status endpoint
app.get('/status/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  
  if (!job) {
    console.log('❌ Job not found:', req.params.jobId);
    return res.status(404).json({ 
      error: 'Job not found',
      message: 'The requested job ID does not exist'
    });
  }
  
  const elapsed = Math.floor((Date.now() - job.startTime) / 1000);
  console.log(`⏱️  Status check [${req.params.jobId}]: ${job.status} (${elapsed}s)`);
  
  res.json({ 
    job_id: req.params.jobId, 
    status: job.status,
    elapsed: elapsed
  });
});

// Get results endpoint
app.get('/result/:jobId', (req, res) => {
  const result = results[req.params.jobId];
  
  if (!result) {
    console.log('❌ Result not found:', req.params.jobId);
    return res.status(404).json({ 
      error: 'Result not found',
      message: 'Results are not ready yet or job does not exist'
    });
  }
  
  console.log('📤 Returning result:', req.params.jobId);
  res.json(result);
});

// Cancel endpoint (optional - for future use)
app.post('/cancel/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  job.status = 'failed';
  console.log('🛑 Job cancelled:', req.params.jobId);
  res.json({ job_id: req.params.jobId, status: 'cancelled' });
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Mock FastAPI Backend Server');
  console.log('='.repeat(60));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log('\n📋 Available Endpoints:');
  console.log('  ✓ GET  /health               - Health check');
  console.log('  ✓ POST /evaluate             - Start evaluation');
  console.log('  ✓ GET  /status/:jobId        - Check job status');
  console.log('  ✓ GET  /result/:jobId        - Get results');
  console.log('  ✓ POST /cancel/:jobId        - Cancel job');
  console.log('\n💡 Frontend URL: http://localhost:8080/adversarial');
  console.log('='.repeat(60) + '\n');
  console.log('⏳ Evaluations take 20 seconds to complete');
  console.log('📊 Watching for requests...\n');
});
