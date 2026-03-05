// Example: Adding Navigation to Adversarial Dashboard from Main Dashboard
// Add this to src/pages/Dashboard.tsx

import { Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Inside the Dashboard component, add this button:

const Dashboard = () => {
  const navigate = useNavigate();
  
  // ... existing code ...
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        
        {/* Add this section after the header, before projects list */}
        <div className="mb-6 flex gap-4">
          <Button
            onClick={createProject}
            className="bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
          
          {/* NEW: Adversarial Dashboard Button */}
          <Button
            onClick={() => navigate("/adversarial")}
            variant="outline"
            className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            <Shield className="mr-2 h-4 w-4" />
            Adversarial Testing
          </Button>
        </div>
        
        {/* ... rest of existing code ... */}
      </div>
    </div>
  );
};

// Alternative: Add as a Card in the Dashboard

<Card className="mb-6 border-2 border-blue-500">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Shield className="h-6 w-6 text-blue-600" />
      Adversarial Robustness Testing
    </CardTitle>
    <CardDescription>
      Test your models against adversarial attacks (FGSM, PGD, C&W, JSMA, DeepFool)
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Button
      onClick={() => navigate("/adversarial")}
      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
    >
      <Shield className="mr-2 h-4 w-4" />
      Launch Adversarial Dashboard
    </Button>
  </CardContent>
</Card>

// Alternative: Add to Navigation Menu (if you have one)

<nav>
  <Link to="/dashboard">
    <Button variant="ghost">Dashboard</Button>
  </Link>
  <Link to="/adversarial">
    <Button variant="ghost">
      <Shield className="mr-2 h-4 w-4" />
      Adversarial Testing
    </Button>
  </Link>
</nav>
