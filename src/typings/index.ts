export interface RoomData {
    attempt? : number;
    date : number;
    fullname : string;
    room_id : string;
    image : string;
    chat_id : number;
    user_id : number;
    answer : string;
    message_id : number;
}

export interface CommandsData {
    command : string;
    args : string;
}

export interface JSON_Telegraph {
    error : string
    src : string;
}

export interface Chat_Permissions {
    can_send_messages : boolean;
    can_send_media_messages : boolean;
    can_send_polls : boolean;
    can_send_other_messages : boolean;
    can_add_web_page_previews : boolean;
    can_change_info : boolean;
    can_invite_users : boolean;
    can_pin_messages : boolean;
}