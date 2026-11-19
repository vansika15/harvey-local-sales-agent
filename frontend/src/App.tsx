import React from "react";
import { useApp } from "./context/AppContext";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { NotificationToastContainer } from "./components/NotificationToast";

// Views
import { OverviewDashboard } from "./views/OverviewDashboard";
import { CompanyManagement } from "./views/CompanyManagement";
import { ProductManagement } from "./views/ProductManagement";
import { HardwareStatusView } from "./views/HardwareStatusView";
import { ICPGenerationView } from "./views/ICPGenerationView";
import { ProspectDiscoveryView } from "./views/ProspectDiscoveryView";
import { ProspectResearchView } from "./views/ProspectResearchView";
import { BuyingSignalsView } from "./views/BuyingSignalsView";
import { ProblemStatementsView } from "./views/ProblemStatementsView";
import { ProspectScoringView } from "./views/ProspectScoringView";
import { EmailGenerationView } from "./views/EmailGenerationView";
import { ReplyClassificationView } from "./views/ReplyClassificationView";
import { ConversationHistoryView } from "./views/ConversationHistoryView";
import { ModelExecutionLogsView } from "./views/ModelExecutionLogsView";
import { SettingsHealthView } from "./views/SettingsHealthView";

export const App: React.FC = () => {
  const { activeView } = useApp();

  const renderView = () => {
    switch (activeView) {
      case "overview":
        return <OverviewDashboard />;
      case "companies":
        return <CompanyManagement />;
      case "products":
        return <ProductManagement />;
      case "hardware":
        return <HardwareStatusView />;
      case "icp":
        return <ICPGenerationView />;
      case "discovery":
        return <ProspectDiscoveryView />;
      case "research":
        return <ProspectResearchView />;
      case "signals":
        return <BuyingSignalsView />;
      case "problems":
        return <ProblemStatementsView />;
      case "scoring":
        return <ProspectScoringView />;
      case "emails":
        return <EmailGenerationView />;
      case "replies":
        return <ReplyClassificationView />;
      case "history":
        return <ConversationHistoryView />;
      case "logs":
        return <ModelExecutionLogsView />;
      case "settings":
        return <SettingsHealthView />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-950/40">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>
      <NotificationToastContainer />
    </div>
  );
};
