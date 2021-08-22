import { Mep } from "./map";
import { RoomData } from "../typings";

export const room : Mep<string, RoomData> = new Mep();
export const admin : Mep<string, {id : number|string}[]> = new Mep();
class RoomSetting {
    constructor() {}

    create(room_id : string, data : RoomData) {
        if(room.get(room_id)) {
            return room.get(room_id);
        }
        if( !data.attempt ) data.attempt = 3;
        return room.set(room_id, data);
    }

    set_room(room_id : string, data : RoomData) {
        return room.set(room_id, data);
    }

    get_room(room_id : string, userId : string|number) : RoomData|undefined {
        let [_, user_id] = room_id.split('_');
        if(user_id != userId) return undefined;
        return room.get(room_id);
    }
    
    delete_room(room_id : string) {
        return room.delete(room_id);
    }
}

export const Room = new RoomSetting();