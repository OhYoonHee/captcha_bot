import { Bot } from 'grammy';
import { CustomContext } from './class/context';
import env from "./env";
import Utilities from "./class/utils";
import { find_chat, db, connect_database } from './database';
import { Room, room as InitRoom } from './class/room';
import { InlineKeyboard } from "./class/keyboard";
import * as route from './route';
import * as handle from './handle';
import * as cron from 'node-cron';

const bot = new Bot<CustomContext>(env.BOT_TOKEN as string, {
    ContextConstructor : CustomContext
});

bot.use(handle.ParseModeHTML);

cron.schedule('*/20 * * * * *', async () => {
    let data = InitRoom.toArray();
    let cari_telat = await Utilities.array_filter_async(data, async (e : any) => {
        let chat_id = e.value.chat_id;
        let database = await find_chat(chat_id);
        if( database == undefined ) return false;
        let { json } = database; 
        let now = Date.now() / 1000;
        let room_date = e.value.date;
        let kurang = now - room_date;
        let menit = kurang/60;
        return menit >= json.timeout;
    });
    for(let x of cari_telat) {
        let room = x.value;
        let tag = Utilities.create_tag_html(room.fullname, room.user_id);
        let database = await find_chat(room.chat_id);
        if( database == undefined ) return false;
        let { json } = database; 
        try{
            if(json.on_timeout == "kick") {
                await bot.api.banChatMember(room.chat_id, room.user_id);
                await bot.api.unbanChatMember(room.chat_id, room.user_id, {
                    only_if_banned : true
                });
            } else if (json.on_timeout == "ban") {
                await bot.api.banChatMember(room.chat_id, room.user_id);
            }
        } catch(e) {};
        let kirim_group = await bot.api.sendMessage(room.chat_id, `#FAILED\n${tag} Failed Verified in ${json.timeout} minutes`);
        setTimeout(async () => {
            try{
                await bot.api.deleteMessage(kirim_group.chat.id, kirim_group.message_id);
                await bot.api.deleteMessage(kirim_group.chat.id, room?.message_id as number);
            } catch(e) {}
        }, 5000);
        Room.delete_room(room.room_id)
    }
});

bot.catch(async (error) => {
    //await error.ctx.reply('There has been an error');
    console.log(`ERROR : ${error.message}`);
    return;
});

bot.filter(ctx => ["group", "supergroup"].includes(ctx.chat?.type as string)).use(async (ctx, next) => {
    let chat_id = ctx.chat?.id as number;
    let data = await find_chat(chat_id);
    if(data == undefined) {
        let get_chat = await ctx.getChat();
        let get_admin = await ctx.getChatAdministrators();
        let admins = get_admin.map(e => ({id : e.user.id}));
        if( "permissions" in get_chat ){
            let permissions = get_chat.permissions as any;
            let dataset = new db({
                admins,
                chat_id,
                permissions,
                reload : (Date.now() / 1000)
            });
            await dataset.save();
            return await next();
        }
        return await next();
    }
    return await next();
});

bot.on('message:new_chat_members', async (ctx, next) => {
    let from_bot = ctx.from.is_bot;

    for(let user of ctx.message.new_chat_members) {
        ctx.from.id = user.id;
        ctx.from.first_name = user.first_name;
        ctx.from.last_name = user.last_name;
        ctx.from.is_bot = user.is_bot;

        if(from_bot) {
            continue;
        }

        try{
            await handle.RestrictMember.MuteMember(ctx, ctx.chat.id, ctx.from.id);
        } catch(e) {}

        let fullname = ctx.from.last_name ? ctx.from.first_name + " " + ctx.from.last_name : ctx.from.first_name;
        let tag = Utilities.create_tag_html(fullname, ctx.from.id);
        let { text, url} = await Utilities.create_captcha();
        let room_id = Utilities.create_room_id(String(ctx.chat.id), String(ctx.from.id));
        let pesan = `Hi ${tag}, welcome to ${Utilities.escape_html((ctx.message.chat as any).title)}\nTo chat here, you have verify yourself.`
        let keyboard = new InlineKeyboard();
        keyboard.url('Verify', `https://t.me/${ctx.me.username}?start=${room_id}`).text('Pass', `/pass ${room_id}`);
        let send_welcome = await ctx.replyWithHTML(pesan, {
            reply_markup : {
                inline_keyboard : keyboard.inline_keyboard
            }
        });

        Room.create(room_id, {
            room_id,
            fullname,
            answer : text,
            chat_id : ctx.chat.id,
            image : url,
            user_id : ctx.from.id,
            message_id : send_welcome.message_id,
            date : ctx.msg.date
        });

    }

    return;

});

bot.on('message:text', async (ctx, next) => {
    return await route.command.middleware()(ctx, next);
});

bot.on('callback_query:data', async (ctx, next) => {
    return await route.callback.middleware()(ctx, next);
})

bot.start({
    onStart : ( async (botinfo) => {
        console.log("Bot run....");
        await connect_database();
        console.log("Database connected");
        console.log("BOT NAME :", botinfo.first_name);
        console.log("BOT USERNAME :", botinfo.username);
        console.log("BOT ID :", botinfo.id);
    })
});

process.once('SIGINT', async () => await bot.stop());
process.once('SIGTERM', async () => await bot.stop());
