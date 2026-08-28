export interface TargetConfig {
    baseUrl: string;
    minPassingScore: number;
    discovery: {
        endpoints: string[];
        htmlDiscoveryRelTags: string[];
    };
    semantics: {
        requiredJsonLdTypes: string[];
        requireOpenGraph: boolean;
    };
    actionability: {
        manifestEndpoint: string;
        validateToolEndpoints: boolean;
    };
    waf: {
        botUserAgents: string[];
        timeoutMs: number;
    };
}
export declare const defaultConfig: TargetConfig;
