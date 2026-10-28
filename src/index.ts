window.addEventListener('unhandledrejection', function (event) {
    console.log(event.reason);
    console.log(event.promise);
    if (event.reason && event.reason.stack) {
        console.log(event.reason.stack);
    }
});

import { Session } from "./user/session.js";
import { TPWebApp } from "./app/app.js";
import type { AppProfile } from "./utils/types.js";

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');

const session = new Session();

session.init(id as string)
    .then((profile: AppProfile) => {
        const app = new TPWebApp();
        app.connect(profile);
    }).catch((err) => {
        console.error(err);
    });