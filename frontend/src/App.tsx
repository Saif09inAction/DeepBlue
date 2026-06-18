import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/Layout/AppLayout";
import Dashboard       from "./pages/Dashboard";
import OceanMap        from "./pages/OceanMap";
import ClimateAnalytics from "./pages/ClimateAnalytics";
import AlertCenter     from "./pages/AlertCenter";
import ResearchData    from "./pages/ResearchData";
import Infrastructure  from "./pages/Infrastructure";
import Architecture    from "./pages/Architecture";
import DevOpsPipeline  from "./pages/DevOpsPipeline";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/"              element={<Dashboard />}        />
          <Route path="/map"           element={<OceanMap />}         />
          <Route path="/analytics"     element={<ClimateAnalytics />} />
          <Route path="/alerts"        element={<AlertCenter />}      />
          <Route path="/data"          element={<ResearchData />}     />
          <Route path="/infrastructure"element={<Infrastructure />}   />
          <Route path="/architecture"  element={<Architecture />}     />
          <Route path="/devops"        element={<DevOpsPipeline />}   />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
