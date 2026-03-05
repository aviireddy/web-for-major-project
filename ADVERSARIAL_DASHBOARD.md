# Adversarial Robustness Evaluation Dashboard

## 🎯 Overview

A complete React frontend component for evaluating deep learning models against adversarial attacks. This dashboard integrates seamlessly with a FastAPI backend to perform comprehensive robustness testing using multiple attack methods.

## ✨ Features

### Core Functionality
- ✅ **Health Check**: Automatic backend connectivity verification on load
- 🚀 **Dynamic Evaluation**: Submit evaluation jobs with customizable configurations
- 📊 **Real-time Polling**: Intelligent status monitoring with 3-second intervals
- 💾 **Persistent State**: Auto-resume evaluations after browser refresh
- ⏱️ **Timeout Handling**: 30-minute timeout with user notifications
- 📥 **Export Options**: Download results as CSV or JSON
- 🎨 **Responsive Design**: Mobile-first, fully responsive UI

### Attack Methods Supported
- **FGSM** (Fast Gradient Sign Method)
- **PGD** (Projected Gradient Descent)
- **C&W** (Carlini & Wagner)
- **JSMA** (Jacobian-based Saliency Map Attack)
- **DeepFool**

### UI States
1. **IDLE**: Configuration form with backend health status
2. **RUNNING**: Animated loading state with elapsed timer
3. **COMPLETED**: Comprehensive metrics display with export options
4. **FAILED**: Error handling with retry mechanisms

## 🏗️ Architecture

### File Structure
```
src/
├── pages/
│   └── AdversarialDashboard.tsx    # Main dashboard component
├── hooks/
│   └── useJobPolling.ts            # Custom polling hook
└── components/
    └── ui/                         # shadcn/ui components
```

### Components

#### 1. **AdversarialDashboard.tsx**
Main dashboard component managing the entire evaluation workflow.

**Key Features:**
- State management for job lifecycle
- Form handling for evaluation configuration
- Conditional rendering based on evaluation status
- Export functionality for results

#### 2. **useJobPolling.ts**
Custom React hook for intelligent job status polling.

**Key Features:**
- Automatic status polling every 3 seconds
- Exponential backoff retry logic
- Timeout handling (30 minutes default)
- Automatic result fetching on completion
- Cleanup on unmount

## 🔌 API Integration

### Backend Endpoints

#### 1. Health Check
```http
GET /health
Response: { "status": "ok" }
```

#### 2. Start Evaluation
```http
POST /evaluate
Content-Type: application/json

Request Body:
{
  "experiment_name": "string",
  "device": "auto",
  "dataset": {
    "name": "cifar10",
    "root": "./data/cifar",
    "batch_size": 32,
    "num_workers": 2
  },
  "model": {
    "architecture": "resnet18",
    "pretrained": true,
    "num_classes": 10,
    "input_size": [3, 224, 224]
  },
  "attacks": {
    "fgsm": { "enabled": true, "eps": 0.03 },
    "pgd": { "enabled": false },
    "cw": { "enabled": false },
    "jsma": { "enabled": false },
    "deepfool": { "enabled": false }
  },
  "evaluation": {
    "results_dir": "./experiments/{userid}/{experiment_name}/"
  }
}

Response:
{
  "job_id": "uuid-string",
  "status": "running"
}
```

#### 3. Check Status
```http
GET /status/{job_id}
Response: 
{
  "job_id": "uuid-string",
  "status": "running|completed|failed",
  "message": "optional message"
}
```

#### 4. Get Results
```http
GET /result/{job_id}
Response:
{
  "job_id": "uuid-string",
  "status": "completed",
  "metrics": {
    "clean_accuracy": 0.823,
    "robust_accuracy": {
      "fgsm": 0.456,
      "pgd": 0.401
    },
    "attack_success_rate": {
      "fgsm": 0.544,
      "pgd": 0.599
    },
    "worst_case_robust": 0.401
  }
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- FastAPI backend running on `http://localhost:8000`
- Existing nebula-canvas-79 project

### Installation

The dashboard is already integrated into the project. No additional installation needed!

### Running the Application

1. **Start the backend API** (in a separate terminal):
   ```bash
   # Navigate to your backend directory
   cd path/to/fastapi/backend
   
   # Start the FastAPI server
   uvicorn main:app --reload --port 8000
   ```

2. **Start the frontend** (in project directory):
   ```bash
   cd nebula-canvas-79
   npm run dev
   ```

3. **Access the dashboard**:
   ```
   http://localhost:5173/adversarial
   ```

## 📖 Usage Guide

### Step 1: Configuration
1. Ensure the backend shows "Backend Ready" (green badge)
2. Enter your User ID (default: "user1")
3. Enter an Experiment Name (required)
4. Select your dataset (CIFAR-10, CIFAR-100, ImageNet, MNIST)
5. Choose model architecture (ResNet-18, ResNet-50, VGG-16, MobileNet)
6. Toggle attack methods you want to test

### Step 2: Start Evaluation
1. Click "Start Evaluation" button
2. The dashboard will show a loading spinner with elapsed time
3. Status updates every 3 seconds automatically
4. Job ID is saved to localStorage for persistence

### Step 3: View Results
1. Once completed, metrics table displays:
   - Clean Accuracy
   - Robust Accuracy per attack
   - Attack Success Rate per attack
   - Worst Case Robust accuracy
2. Export results as CSV or JSON
3. Click "New Evaluation" to start another test

### Error Handling
- **Backend Offline**: Red badge with "Backend Offline" message
- **Evaluation Failed**: Error message with retry button
- **Timeout**: "Timeout after 30 minutes" message with retry option
- **Network Error**: Automatic retry with exponential backoff (3 attempts)

## 🎨 UI Components

### Technology Stack
- **React 18**: For component architecture
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling and responsive design
- **shadcn/ui**: Pre-built accessible components
- **Lucide React**: Icon library
- **Sonner**: Toast notifications

### Key UI Elements
- **Health Badge**: Real-time backend status indicator
- **Configuration Form**: Grid layout with labeled inputs
- **Attack Toggles**: Interactive switches for attack selection
- **Loading State**: Animated spinner with progress indicator
- **Metrics Table**: Clean, readable results display
- **Action Buttons**: Gradient-styled CTAs with icons

## 🔧 Configuration

### Dynamic Path Structure
Results are saved to: `./experiments/{userid}/{experiment_name}/`

### Customization Options

#### Polling Interval
Modify in `useJobPolling.ts`:
```typescript
pollInterval?: number; // Default: 3000ms (3 seconds)
```

#### Timeout Duration
Modify in `useJobPolling.ts`:
```typescript
timeout?: number; // Default: 1,800,000ms (30 minutes)
```

#### Backend URL
Modify in `AdversarialDashboard.tsx`:
```typescript
const BASE_URL = "http://localhost:8000"; // Change as needed
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] Backend health check displays correct status
- [ ] Form validation works (experiment name required)
- [ ] Evaluation starts and returns job_id
- [ ] Status polling updates every 3 seconds
- [ ] Loading spinner displays with elapsed timer
- [ ] Results display correctly when completed
- [ ] CSV export downloads valid file
- [ ] JSON export downloads valid file
- [ ] New evaluation resets form
- [ ] localStorage persistence works across refreshes
- [ ] Cancel button stops evaluation
- [ ] Error states display properly
- [ ] Timeout triggers after 30 minutes
- [ ] Responsive design works on mobile

### Backend Mock Server (Optional)
For testing without a real backend, create a mock server:

```javascript
// mock-server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let jobs = {};

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/evaluate', (req, res) => {
  const jobId = Date.now().toString();
  jobs[jobId] = { status: 'running', startTime: Date.now() };
  res.json({ job_id: jobId, status: 'running' });
});

app.get('/status/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  // Simulate completion after 30 seconds
  if (Date.now() - job.startTime > 30000) {
    job.status = 'completed';
  }
  
  res.json({ job_id: req.params.jobId, status: job.status });
});

app.get('/result/:jobId', (req, res) => {
  res.json({
    job_id: req.params.jobId,
    status: 'completed',
    metrics: {
      clean_accuracy: 0.823,
      robust_accuracy: { fgsm: 0.456, pgd: 0.401 },
      attack_success_rate: { fgsm: 0.544, pgd: 0.599 },
      worst_case_robust: 0.401
    }
  });
});

app.listen(8000, () => {
  console.log('Mock server running on http://localhost:8000');
});
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Backend Offline Error
**Problem**: Red "Backend Offline" badge  
**Solution**: 
- Ensure FastAPI server is running on port 8000
- Check CORS settings on backend
- Verify network connectivity

#### 2. CORS Errors
**Problem**: Browser console shows CORS errors  
**Solution**: Add CORS middleware to FastAPI backend:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 3. Polling Doesn't Stop
**Problem**: Status keeps polling after completion  
**Solution**: 
- Check that backend returns exactly `"completed"` or `"failed"` status
- Verify job_id matches between requests
- Clear localStorage and restart evaluation

#### 4. Results Not Displaying
**Problem**: Completed but no metrics shown  
**Solution**:
- Check backend `/result/{job_id}` endpoint returns valid JSON
- Verify metrics object structure matches expected format
- Open browser console to check for parsing errors

## 📊 Metrics Explanation

### Clean Accuracy
Percentage of correctly classified samples on clean (unmodified) test data.

### Robust Accuracy
Percentage of correctly classified samples when adversarial attacks are applied.

### Attack Success Rate
Percentage of samples where the attack successfully fooled the model (1 - Robust Accuracy).

### Worst Case Robust
The lowest robust accuracy across all enabled attacks (weakest defense point).

## 🚀 Future Enhancements

Potential features for future development:
- [ ] Real-time progress bars per attack
- [ ] Dark mode toggle
- [ ] Results history with localStorage
- [ ] Shareable job links
- [ ] PDF export with charts using recharts
- [ ] Live attack visualization
- [ ] Batch evaluation submission
- [ ] Custom attack parameter configuration
- [ ] Model comparison view
- [ ] Dataset upload functionality

## 📝 License

This component is part of the nebula-canvas-79 project and follows the same license.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues or questions:
- Check the troubleshooting section above
- Review backend API logs
- Open an issue on GitHub
- Check browser console for errors

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**
