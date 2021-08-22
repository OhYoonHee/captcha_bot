import { CustomContext } from "../class/context";
import { NextFunction } from "grammy";

export function ParseModeHTML(ctx : CustomContext, next : NextFunction) {
    ctx.api.config.use((prev, method, _params) => {
        let params : any = _params;
        if(params.parse_mode == undefined) params.parse_mode = "HTML";
        return prev(method, params);
    });
    return next();
}