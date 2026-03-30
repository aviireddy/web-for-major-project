# API Calls Audit & Dynamization Plan

## Current Static API Calls

### 1. **EvaluationSetupPage.tsx** - `startEvaluation()`
**Location**: Line 77-89  
**Currently Static Values**:
```
- dataset.name: 'cifar10' (hardcoded)
- dataset.root: './data/cifar' (hardcoded)
- dataset.batch_size: 32 (hardcoded)
- dataset.num_workers: 2 (hardcoded)
- model.architecture: 'resnet50' (hardcoded)
- model.pretrained: true (hardcoded)
- model.weights_path: null (hardcoded)
- model.num_classes: 10 (hardcoded)
- model.input_size: [3, 32, 32] (hardcoded)
- attacks.fgsm.eps: 0.03 (hardcoded)
- attacks.pgd.eps: 0.03, alpha: 0.007, steps: 10 (hardcoded)
- attacks.cw parameters (hardcoded)
- evaluation.results_dir: uses userId + expName
```
**Dynamic from UI**:
- experiment_name (from input)
- attacks.fgsm|pgd|cw|jsma|deepfool enabled state (from toggles)

---

### 2. **AdversarialDashboard.tsx** - `fetch('/evaluate')`
**Location**: Lines 198-212  
**Currently Static Values**:
```
- dataset selection (cifar10, mnist, tiny-imagenet)
- model.architecture: 'resnet50' (hardcoded)
- model.pretrained: true (hardcoded)
- batch_size, num_workers (hardcoded)
- Attack parameters (mostly hardcoded)
```
**Dynamic from UI**:
- dataset (dropdown)
- architecture (dropdown) - but limited options
- userid (input)
- expName (input)
- attacks enabled state (toggles)

---

### 3. **LiveEvaluationPage.tsx** - `getStatus()` & `getResult()`
**Location**: Lines 74, 78, 92  
**Dynamic**:
- jobId (from URL params)
- Uses polling to fetch status and results

---

### 4. **AccuracyPage.tsx** - `supabase.from('attack_results')`
**Location**: Line 21-27  
**Dynamic**:
- project_id (from URL params)
- Queries from database based on project ID

---

### 5. **Dashboard.tsx** - `supabase.from('projects')`
**Location**: Line 33-43  
**Dynamic**:
- Fetches user's projects from database

---

### 6. **ProjectDetails.tsx**
**Status**: Unknown - needs inspection

---

## Pages Flow & Data Dependencies

```
Dashboard (shows user projects)
  ↓
ProjectDetails (shows project details)
  ↓
EvaluationSetupPage (setup evaluation with hardcoded parameters)
  ↓
LiveEvaluationPage (polls results)
  ↓
AccuracyPage (shows results from database)
```

## Issues to Solve

1. **User never selects dataset/model parameters** - currently all hardcoded in EvaluationSetupPage
2. **No way to specify model architecture** - only resnet50 is supported
3. **No model/dataset configuration UI** - users can only change experiment name & attack toggles
4. **Attack parameters aren't customizable** - all hardcoded (eps, alpha, steps, etc.)
5. **No context/state management** between pages - data doesn't flow from previous pages

## Solution Approach

### Option 1: Add Configuration Page Before Evaluation Setup
Create new page: `ModelConfigPage.tsx` that collects:
- Dataset selection
- Model architecture selection
- Model parameters (num_classes, input_size)
- Attack parameters (eps, alpha, steps, etc.)
- Then pass to EvaluationSetupPage

### Option 2: Enhance EvaluationSetupPage UI
Add collapsible sections for:
- Dataset configuration
- Model parameters
- Attack parameters with detailed controls

### Option 3: Use Context/State Management (Recommended)
Create `EvaluationContext.tsx` to pass evaluation config through pages without prop drilling

## Files to Modify

1. ✅ `/src/lib/api.ts` - Already generic, just needs proper calls
2. ✅ `/src/pages/EvaluationSetupPage.tsx` - Add UI for dataset/model/attack config
3. ✅ `/src/context/UserContext.tsx` - Extend or create EvaluationContext
4. ✅ `/src/pages/AdversarialDashboard.tsx` - Make parameters dynamic
5. (Optional) Create `/src/pages/ModelConfigPage.tsx` - For detailed configuration

