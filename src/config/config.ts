import { TPDataFeed } from "../data/datafeed.js"

export class Config {
    datastore: TPDataFeed | null = null;

    constructor() {
        //this.datastore = new TPDataFeed();
        //this.datastore.init();
    }

    getDataStore(): TPDataFeed {
        if (!this.datastore)
            throw new Error("No data store found, please initialize");
        return this.datastore;
    }

}