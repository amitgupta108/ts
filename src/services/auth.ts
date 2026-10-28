import type { AppProfile } from "../utils/types.js";
import { AUTH_URL } from "../utils/constants.js";

export class Authorizer {

    async loadAppProfile(id: string): Promise<AppProfile | undefined> {
        let profile: AppProfile | undefined = undefined;
        try {
            const response = await fetch(`${AUTH_URL}?key=${id}`, {
                method: "get",
                signal: AbortSignal.timeout(3000)
            });
            profile = response.ok ? await response.json() : undefined;
            if (profile) {
                profile.lookbackend = profile.simStartTime ?? Date.now();
                profile.lookbackstart = profile.lookbackend - 4 * 24 * 60 * 60 * 1000; // 4 days back;
            }
        } catch (error) {
            throw error;
        }
        return profile;
    }
}