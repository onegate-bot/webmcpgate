import { TargetConfig } from '../config';
export declare function evaluateWAF(config: TargetConfig): Promise<{
    dimension: string;
    score: number;
    maxScore: number;
    details: string[];
}>;
