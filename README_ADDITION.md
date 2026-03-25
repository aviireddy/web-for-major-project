# Add this section to your main README.md

## 🛡️ Adversarial Robustness Evaluation Dashboard

A comprehensive React frontend for evaluating deep learning models against adversarial attacks, with seamless FastAPI backend integration.

### Features

- **Real-time Evaluation**: Submit evaluation jobs and monitor progress with automatic status polling
- **Multiple Attack Methods**: Support for FGSM, PGD, C&W, JSMA, and DeepFool attacks
- **Dynamic Configuration**: Select datasets (CIFAR-10, CIFAR-100, ImageNet, MNIST) and model architectures
- **Intelligent Polling**: Auto-updates every 3 seconds with 30-minute timeout protection
- **Export Results**: Download metrics as CSV or JSON
- **Persistent State**: Resume evaluations after browser refresh using localStorage
- **Error Recovery**: Automatic retry logic with exponential backoff
- **Responsive Design**: Mobile-first UI with modern gradient styling

### Quick Access

Navigate to: `http://localhost:5173/adversarial`

### Documentation

- **Full Documentation**: [ADVERSARIAL_DASHBOARD.md](ADVERSARIAL_DASHBOARD.md)
- **Quick Start Guide**: [QUICKSTART.md](QUICKSTART.md)
- **Implementation Details**: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

### Backend Requirements

The dashboard requires a FastAPI backend with the following endpoints:

- `GET /health` - Health check
- `POST /evaluate` - Submit evaluation job
- `GET /status/{job_id}` - Check job status
- `GET /result/{job_id}` - Retrieve results

For testing without a backend, see the mock server in [QUICKSTART.md](QUICKSTART.md).

### Usage

1. Ensure FastAPI backend is running on `http://localhost:8000`
2. Start the development server: `npm run dev`
3. Navigate to `/adversarial`
4. Configure your evaluation (experiment name, dataset, model, attacks)
5. Click "Start Evaluation" and wait for results
6. Export metrics or start a new evaluation

### Tech Stack

- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Custom polling hook with intelligent retry
- Sonner for notifications
- Lucide React icons
- localStorage for persistence

---
