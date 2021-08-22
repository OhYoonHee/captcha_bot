import { Context } from "grammy";
import { CustomContext } from "../class/context";

export async function MuteMember(ctx : CustomContext, chat_id : string | number, user_id : number) {
    return await ctx.api.restrictChatMember(chat_id, user_id, {
        can_send_messages : false
    });
}

export async function UnMuteMember(ctx : CustomContext, chat_id : string | number, user_id : number) {
    return await ctx.api.restrictChatMember(chat_id, user_id, {
        can_send_messages : true,
        can_send_media_messages : true,
        can_send_other_messages : true
    });
}