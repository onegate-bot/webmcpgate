import { TargetConfig } from '../config';
export declare function evaluateActionability(config: TargetConfig): Promise<{
    dimension: string;
    score: number;
    maxScore: number;
    details: string[];
}>;
