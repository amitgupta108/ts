import type { HistoryRequest, Order } from "../utils/types.js";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { Eventer } from "./eventservice.js";
import type { AppProfile } from "../utils/types.js";

export class ServerInterface {
    socket: Socket | null = null;
    host: string | null = null;
    profile: AppProfile | null = null;

    constructor() {
        this.socket = null;
        this.host = null;
        this.profile = null;
    }

    connect(host: string, profile: AppProfile): boolean {
        try {
            this.profile = profile;
            this.socket = io(host, {
                auth: {
                    token: this.profile.appid,
                    mode: this.profile.mode
                },
                transports: ["websocket"],
                reconnection: false,
                reconnectionAttempts: 3,
                reconnectionDelay: 1000
            });

            if (this.socket) {
                this.registerHandlers();
                return this.socket.connected;
            }
            return false;

        } catch (error) {
            console.error(error);
            return false;
        }
    }

    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    registerHandlers() {
        try {
            this.socket?.on("connect", () => {
                console.log("socket connected for appid" + this.socket?.id + "-" + this.profile?.appid + "-" + this.socket?.recovered);
                /*                
                    if (profile.mode === "HISTORY")
                        document.getElementById("optionSpeed").disabled = false;
    
                    */
            });

            this.socket?.on("connect_error", (error: any) => {
                console.log("connection error for appid" + this.socket?.id + "-" + this.profile?.appid + "-" + error.message);
                if (this.socket?.active)
                    console.log("connection error reconnection to be tried " + this.socket?.id);
                else
                    console.log("No reconnection " + error.message);
            });

            this.socket?.on("disconnect", (reason: any) => {
                //bottom_btns[0].disabled = false;
                console.log("disconnected for socketid-appid " + this.socket?.id + "-" + this.profile?.appid + "-" + reason);
            });

            this.socket?.on("history", (data: any) => {
                Eventer.eventDispatch("history", data);
            });

            this.socket?.on("quote", (q: any) => {
                Eventer.eventDispatch("quote", q);
            });

            this.socket?.on("order", (exorder: any) => {
                if (exorder.appid === this.profile?.appid)
                    Eventer.eventDispatch('order', exorder);
            });

            this.socket?.on("orderbook", (orders: any[]) => {
                Eventer.eventDispatch('orderbook', orders);
            });

            this.socket?.on("exit", (response: string) => {
                window.location.reload();
            });

            this.socket?.on("hb", (resp: any) => {
                Eventer.eventDispatch('heartbeat', { connected: resp?.order_socket === 1 });
            });

            /*            
            this.socket?.on("stream", (response: string) => {
                if (response === "paused")
                    document.getElementById("btnStopSim").innerText = "Resume";
                else if (response === "resumed")
                    document.getElementById("btnStopSim").innerText = "Stop";
                else if (response === "started") {
                    bottom_btns[2].disabled = false;
                    bottom_btns[5].disabled = false;
                }
            });
            */
        }
        catch (error) {
            console.log(error);
        }
    }

    history(requests: HistoryRequest[]): void {
        this.emit('history', requests);
    }

    start() {
        this.emit('startv2', {
            simStartTime: this.profile?.simStartTime,
            stockCode: this.profile?.stockCode,
            fExpiry: this.profile?.fExpiry,
            oExpiries: this.profile?.oExpiries,
        });
    }

    submitOrders(orders: Order[]) {
        this.emit('order', orders);
    }

    orderbook() {
        this.emit('orderbook', this.profile?.stockCode);
    }

    cancelOrder(orderid: string) {
        this.emit('cancel', orderid);
    }

    exit() {
        this.emit('exit', 'exit');
    }

    emit(event: string, data: any) {
        this.socket?.emit(event, data);
    }
}