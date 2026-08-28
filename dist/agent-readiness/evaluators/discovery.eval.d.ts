import { TargetConfig } from '../config';
export declare function evaluateDiscovery(config: TargetConfig): Promise<{
    dimension: string;
    score: number;
    maxScore: number;
    details: string[];
}>;
