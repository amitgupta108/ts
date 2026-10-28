import type { AppProfile, HistoryRequest, ChartRequest } from "../utils/types.js";
import { Authorizer } from "../services/auth.js";

export class Session {

    appProfile?: AppProfile;

    constructor() {
    }

    async init(id: string) {
        const auth = new Authorizer();
        const profile = await auth.loadAppProfile(id);
        if (profile) {
            this.appProfile = profile;
        } else {
            throw new Error("Invalid application id");
        }
        return profile;
    }

    getAppProfile(): AppProfile {
        if (!this.appProfile)
            throw new Error("No profile found, please initialize");
        return this.appProfile;
    }
}