import { Peer } from "peerjs";

const chars = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']

class Server{
    constructor() {
        if (Server._instance) {
          return Server._instance
        }
        Server._instance = this;
        this.msgQueue = []
        this.isHost = false
    }
    createRoom(onConnect, onDisconnect, onError) {
        this.isHost = true
        const roomID = this.genName()
        this.peer = new Peer(roomID)
        this.peer.on('error', err => onError(err));
        this.peer.on("open", (id) => {
            console.log("Joining RoomID: " + id);
        })
        this.peer.on("connection", (conn) => {
            this.conn = conn
            this.conn.on('open',()=>{
                console.log("Connected RoomID");
                this.conn.on("data", (data) => {
                    this.msgQueue.push(data)
                })
                onConnect()
                this.conn.on('close', onDisconnect);
            })
        })
        return roomID
    }
    connectRoom(roomID, onConnect, onDisconnect, onError){
        this.peer = new Peer()
        this.peer.on('error', err => onError(err));
        this.peer.on("open", (id) => {
            console.log("Joining RoomID: " + id);
            this.conn = this.peer.connect(roomID)
            this.conn.on("open", ()=>{
                console.log("Connected RoomID: " + id);
                this.conn.on("data", (data) => {
                    this.msgQueue.push(data)
                })
                onConnect()
                this.conn.on('close', onDisconnect);
            })
        })
    }
    close(){
        console.log('Closing connection')
        this.msgQueue = []
        this.isHost = false
        clearInterval(this.waitMsg)
        if (this.peer) this.peer.destroy()
    }
    send(msg){
        this.conn.send(msg)
    }
    recv(){
        return new Promise((resolve)=>{
            if (this.msgQueue.length > 0){
                resolve(this.msgQueue.pop())
            } else {
                this.waitMsg = setInterval(()=>{
                    if (this.msgQueue.length > 0){
                        clearInterval(this.waitMsg)
                        resolve(this.msgQueue.pop())
                    }
                },500)
            }
        })
    }
    genName(){
        return Array(4).fill().map(_=>chars[Math.floor(Math.random() * chars.length)]).join('')
    }
}

export default Server