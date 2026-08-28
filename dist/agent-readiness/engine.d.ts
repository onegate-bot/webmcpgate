import { TargetConfig } from './config';
export declare function runAgentReadinessAudit(customConfig?: Partial<TargetConfig>): Promise<{
    finalScore: number;
    passed: boolean;
    results: [{
        dimension: string;
        score: number;
        maxScore: number;
        details: string[];
    }, {
        dimension: string;
        score: number;
        maxScore: number;
        details: string[];
    }, {
        dimension: string;
        score: number;
        maxScore: number;
        details: string[];
    }, {
        dimension: string;
        score: number;
        maxScore: number;
        details: string[];
    }];
}>;
