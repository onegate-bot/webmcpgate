import { TargetConfig } from '../config';
export declare function evaluateSemantics(config: TargetConfig): Promise<{
    dimension: string;
    score: number;
    maxScore: number;
    details: string[];
}>;
