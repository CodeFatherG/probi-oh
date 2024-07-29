import React from 'react';
import { Report } from '../utils/report'; // Adjust the import path as necessary

interface ReportDisplayProps {
    reports: Report[];
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ reports }) => {
    return (
        <div className="report-container">
            {reports.map((report, index) => (
                <div key={index} className="report">
                    <h3>Condition {index + 1}: {report.conditionStats.condition.toString()}</h3>
                    <p>Success Rate: {report.successRatePercentage}</p>
                    
                    <h4>Card Statistics:</h4>
                    <ul>
                        {Array.from(report.cardNameStats.entries()).map(([name, stats]) => (
                            <li key={name}>
                                {name}: Seen {((stats.cardSeenCount / report.simulations.length) * 100).toFixed(2)}% of the time 
                                and drawn {((stats.cardDrawnCount / stats.cardSeenCount) * 100).toFixed(2)}%
                            </li>
                        ))}
                    </ul>
                    
                    <h4>Free Card Statistics:</h4>
                    <ul>
                        {Array.from(report.freeCardStats.entries()).map(([name, stats]) => (
                            <li key={name}>
                                {name}: Seen {((stats.cardSeenCount / report.simulations.length) * 100).toFixed(2)}% of the time. 
                                Used {(stats.activationRate * 100).toFixed(2)}% of the time 
                                and wasted {(stats.unusedRate * 100).toFixed(2)}%
                            </li>
                        ))}
                    </ul>
                    
                    <h4>Condition Statistics:</h4>
                    <ul>
                        <li>
                            {report.conditionStats.condition.toString()}: 
                            Success Rate: {(report.conditionStats.successRate * 100).toFixed(2)}%
                        </li>
                        {Array.from(report.conditionStats.subConditionStats.entries()).map(([key, stats]) => (
                            <li key={key}>
                                {key}: Success Rate: {(stats.successRate * 100).toFixed(2)}%
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default ReportDisplay;