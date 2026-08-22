import { useState, useEffect } from "react";
import { DashboardLayout } from "./components/DashboardLayout";
import { UploadView } from "./components/UploadView";
import { AnalyzingView } from "./components/AnalyzingView";
import { ResultsDashboard } from "./components/ResultsDashboard";
import { useAnalysisStore } from "./store/useAnalysisStore";
import { IntroLoader } from "./components/IntroLoader";

function App() {
  const { currentResult, isAnalyzing } = useAnalysisStore();
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const hasLoaded = sessionStorage.getItem("truthlens_intro_loaded");
    if (hasLoaded === "true") {
      setShowIntro(false);
    }
  }, []);

  if (showIntro) {
    return <IntroLoader onComplete={() => setShowIntro(false)} />;
  }

  const renderContent = () => {
    if (isAnalyzing) {
      return <AnalyzingView />;
    }
    if (currentResult) {
      return <ResultsDashboard />;
    }
    return <UploadView />;
  };

  return <DashboardLayout>{renderContent()}</DashboardLayout>;
}

export default App;
