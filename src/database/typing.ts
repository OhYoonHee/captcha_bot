import { Document } from 'mongoose';

type on_timeout = "kick"|"ban"|"mute";

export interface DatabaseData extends Document {
    chat_id : number|string;
    permissions : {
        can_send_messages : boolean;
        can_send_media_messages : boolean;
        can_send_polls : boolean;
        can_send_other_messages : boolean;
        can_add_web_page_previews : boolean;
        can_change_info : boolean;
        can_invite_users : boolean;
        can_pin_messages : boolean;
    };
    admins : {id : number|string}[];
    on_timeout : on_timeout;
    timeout : number;
    reload : number;
}