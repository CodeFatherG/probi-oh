import { CardDetails } from "./card-details";

export interface SimulationInput {
    deck: Map<string, CardDetails>;
    conditions: string[];
}