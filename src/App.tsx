import React, { useState } from 'react';
import FileInput from './components/FileInput';
import SimulationRunner from './components/SimulationRunner';
import ProgressBar from './components/ProgressBar';
import ResultDisplay from './components/ResultDisplay';
import ReportToggle from './components/ReportToggle';

const App: React.FC = () => {
    const [yamlContent, setYamlContent] = useState<string | null>(null);
    const [isSimulationRunning, setIsSimulationRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<string | null>(null);
    const [isReportVisible, setIsReportVisible] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [reportData, setReportData] = useState<any>(null);

    const handleFileUpload = (content: string) => {
        setYamlContent(content);
    };

    const runSimulation = async () => {
        if (!yamlContent) return;

        setIsSimulationRunning(true);
        setProgress(0);
        setResult(null);

        // TODO: Implement actual simulation logic here
        // This is a placeholder to simulate progress
        for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 500));
            setProgress(i);
        }

        setResult("Simulation complete. Maximum success probability: 85.23%");
        setIsSimulationRunning(false);
        
        // TODO: Replace this with actual report data
        setReportData({
            conditions: [
                { name: "Condition 1", successRate: 0.8523 },
                { name: "Condition 2", successRate: 0.7142 }
            ]
        });
    };

    const toggleReport = () => {
        setIsReportVisible(!isReportVisible);
    };

    return (
        <div className="App">
            <h1>Probi-oh: Yu-Gi-Oh! Probability Simulator</h1>
            <FileInput onFileUpload={handleFileUpload} accept=".ydk,.yaml,.yml" />
            <SimulationRunner onRun={runSimulation} disabled={!yamlContent || isSimulationRunning} />
            {isSimulationRunning && <ProgressBar progress={progress} />}
            {result && <ResultDisplay result={result} />}
            <ReportToggle onToggle={toggleReport} isVisible={isReportVisible} />
            {isReportVisible && reportData && (
                <div id="reportContainer">
                    {/* TODO: Implement detailed report display */}
                    <pre>{JSON.stringify(reportData, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default App;