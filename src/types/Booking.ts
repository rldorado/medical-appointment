import type { Patient } from "./Patient";
import type { Slot } from "./Slot";

export interface BookingRequest {
    Start: string;
    End: string;
    Comments: string;
    Patient: Patient;
}

export interface BookingResponse {
    success: boolean
    message: string
    slot?: Slot
    error?: string
}