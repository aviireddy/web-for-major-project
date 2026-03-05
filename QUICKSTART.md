# Quick Start Guide: Adversarial Dashboard

## 🎯 Fast Track Setup (5 Minutes)

### Step 1: Ensure Backend is Running
The dashboard requires a FastAPI backend. If you don't have one, use the mock server provided below.

### Step 2: Access the Dashboard
1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to:
   ```
   http://localhost:5173/adversarial
   ```

### Step 3: Run Your First Evaluation
1. Wait for "Backend Ready" green badge
2. Enter experiment name: `test_run_1`
3. Keep default settings (CIFAR-10, ResNet-18, FGSM enabled)
4. Click "Start Evaluation"
5. Wait for completion (~30 seconds with mock server)
6. View metrics and export results!

---

## 🧪 Mock Backend Server (For Testing)

If you don't have a FastAPI backend, use this Node.js mock server:

### Create `mock-server.js`
```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let jobs = {};
let results = {};

app.get('/health', (req, res) => {
  console.log('Health check');
  res.json({ status: 'ok' });
});

app.post('/evaluate', (req, res) => {
  const jobId = `job_${Date.now()}`;
  const startTime = Date.now();
  
  console.log('Evaluation started:', jobId);
  console.log('Config:', req.body);
  
  jobs[jobId] = { 
    status: 'running', 
    startTime,
    config: req.body
  };
  
  // Simulate completion after 15 seconds
  setTimeout(() => {
    jobs[jobId].status = 'completed';
    results[jobId] = {
      job_id: jobId,
      status: 'completed',
      metrics: {
        clean_accuracy: 0.8234,
        robust_accuracy: {
          fgsm: 0.4567,
          pgd: 0.4012
        },
        attack_success_rate: {
          fgsm: 0.5433,
          pgd: 0.5988
        },
        worst_case_robust: 0.4012
      },
      evaluation: {
        total_samples: 10000,
        duration_seconds: 15,
        attacks_performed: Object.keys(req.body.attacks).filter(k => req.body.attacks[k].enabled)
      }
    };
    console.log('Evaluation completed:', jobId);
  }, 15000);
  
  res.json({ job_id: jobId, status: 'running' });
});

app.get('/status/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  
  if (!job) {
    console.log('Job not found:', req.params.jobId);
    return res.status(404).json({ error: 'Job not found' });
  }
  
  console.log('Status check:', req.params.jobId, job.status);
  res.json({ 
    job_id: req.params.jobId, 
    status: job.status,
    elapsed: Math.floor((Date.now() - job.startTime) / 1000)
  });
});

app.get('/result/:jobId', (req, res) => {
  const result = results[req.params.jobId];
  
  if (!result) {
    console.log('Result not found:', req.params.jobId);
    return res.status(404).json({ error: 'Result not found' });
  }
  
  console.log('Returning result:', req.params.jobId);
  res.json(result);
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`🚀 Mock FastAPI server running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  GET  /health');
  console.log('  POST /evaluate');
  console.log('  GET  /status/:jobId');
  console.log('  GET  /result/:jobId');
});
```

### Install Dependencies
```bash
npm install -g express cors
```

### Run Mock Server
```bash
node mock-server.js
```

Expected output:
```
🚀 Mock FastAPI server running on http://localhost:8000
Endpoints:
  GET  /health
  POST /evaluate
  GET  /status/:jobId
  GET  /result/:jobId
```

---

## 🎨 Quick Navigation Tips

### Add Dashboard Link to Main App

You can add a navigation button to access the Adversarial Dashboard from your main dashboard:

**Option 1: Direct Link in Browser**
```
http://localhost:5173/adversarial
```

**Option 2: Add Navigation Button**
Update your `Dashboard.tsx` to include a link:
```tsx
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

// Add this button in your dashboard
<Link to="/adversarial">
  <Button variant="outline" className="flex items-center gap-2">
    <Shield className="h-4 w-4" />
    Adversarial Testing
  </Button>
</Link>
```

---

## 📊 Sample Test Scenarios

### Scenario 1: Quick FGSM Test
- **Experiment Name**: `quick_fgsm_test`
- **Dataset**: CIFAR-10
- **Model**: ResNet-18
- **Attacks**: FGSM only
- **Expected Time**: ~15 seconds (mock server)

### Scenario 2: Multi-Attack Comparison
- **Experiment Name**: `multi_attack_test`
- **Dataset**: CIFAR-10
- **Model**: ResNet-50
- **Attacks**: FGSM + PGD
- **Expected Time**: ~30 seconds (mock server)

### Scenario 3: Robustness Benchmark
- **Experiment Name**: `full_robustness_test`
- **Dataset**: CIFAR-100
- **Model**: VGG-16
- **Attacks**: All enabled
- **Expected Time**: ~60 seconds (mock server)

---

## ✅ Feature Checklist

Test these features in order:

- [ ] 1. Backend health check shows green "Ready" badge
- [ ] 2. Form accepts experiment name input
- [ ] 3. Dataset dropdown works
- [ ] 4. Attack toggles switch on/off
- [ ] 5. "Start Evaluation" button submits job
- [ ] 6. Loading spinner appears with timer
- [ ] 7. Status changes to "completed" after time
- [ ] 8. Metrics table displays with values
- [ ] 9. Export CSV downloads file
- [ ] 10. Export JSON downloads file
- [ ] 11. "New Evaluation" button resets form
- [ ] 12. Refresh page resumes evaluation (if active)

---

## 🐛 Quick Troubleshooting

### Issue: Backend Offline
**Fix**: Start mock server or check FastAPI backend is running

### Issue: No Metrics Showing
**Fix**: Wait for "completed" status. Check mock server console logs.

### Issue: Can't Find Dashboard
**Fix**: Go to `http://localhost:5173/adversarial` directly

### Issue: Stuck on "Running"
**Fix**: 
1. Check mock server console
2. Check browser console (F12)
3. Refresh page to resume

---

## 📸 Expected UI Flow

```
┌────────────────────────────────────────┐
│  🛡️ Adversarial Evaluation Dashboard  │
│                                        │
│  ✅ Backend: Ready                     │
├────────────────────────────────────────┤
│  User ID:      [user1            ]    │
│  Exp Name:     [quick_test       ]    │
│  Dataset:      [CIFAR-10    ▼    ]    │
│  Model:        [ResNet-18   ▼    ]    │
│                                        │
│  Attacks:                              │
│  ☑ FGSM      ☐ PGD      ☐ C&W         │
│  ☐ JSMA      ☐ DeepFool               │
│                                        │
│  [         Start Evaluation         ] │
└────────────────────────────────────────┘

            ↓ (after clicking Start)

┌────────────────────────────────────────┐
│  ⏳ Evaluating quick_test... 0m 7s     │
│  [    ⚡ Loading Spinner      ]        │
│  ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░         │
│                                        │
│  📊 Running adversarial attacks...     │
│  ⚡ This may take several minutes       │
│  🔄 Job ID: job_1234567890            │
│                                        │
│  [           Cancel           ]        │
└────────────────────────────────────────┘

            ↓ (after completion)

┌────────────────────────────────────────┐
│  ✅ Evaluation Complete!               │
│                                        │
│  Metric                    │ Value     │
│  ─────────────────────────────────────│
│  Clean Accuracy            │ 82.34%   │
│  FGSM Robust Accuracy      │ 45.67%   │
│  FGSM Attack Success       │ 54.33%   │
│  Worst Case Robust         │ 45.67%   │
│                                        │
│  [Export CSV] [Export JSON]           │
│  [        New Evaluation      ]       │
└────────────────────────────────────────┘
```

---

## 🎓 Next Steps

1. ✅ Complete quick test with mock server
2. 🔧 Integrate with real FastAPI backend
3. 📊 Test with actual models and datasets
4. 🎨 Customize styling if needed
5. 🚀 Deploy to production

---

## 📚 Additional Resources

- **Full Documentation**: See `ADVERSARIAL_DASHBOARD.md`
- **API Specification**: Check your FastAPI backend docs at `http://localhost:8000/docs`
- **Component Code**: 
  - Dashboard: `src/pages/AdversarialDashboard.tsx`
  - Hook: `src/hooks/useJobPolling.ts`

---

## 💡 Pro Tips

1. **Keep Mock Server Running**: Use it for frontend development without real GPU computation
2. **Use Browser DevTools**: Network tab shows all API calls
3. **Check Console**: Important debug info appears there
4. **localStorage Persistence**: Close tab and reopen to see job resume
5. **Export Early**: Download results before starting new evaluation

---

**Need Help?** Check the browser console (F12) for detailed error messages!

🎉 **Happy Testing!**
