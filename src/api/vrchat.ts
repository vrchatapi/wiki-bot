import QueryStringAddon from "wretch/addons/queryString";
import wretch from "wretch";
import { TOTP } from "totp-generator";

import {
	userAgent,
	vrchatEmail,
	vrchatPassword,
	vrchatTotpSecret
} from "~/environment";

import { cookie, cookies, log, serializeCookies } from "./middleware";

import type { InfoPush, CurrentUser, Verify2FAResult } from "vrchat";

export const uniqueCharacters: { [key: string]: string } = {
	ǃ: "!",
	"˸": ":",
	";": ";",
	"‘": "'",
	"’": "'",
	"‚": ",",
	"․": ".",
	"⁄": "/",
	"∗": "*",
	"≺": "<",
	"≻": ">",
	"＂": '"',
	"＃": "#",
	"＄": "$",
	"％": "%",
	"＆": "&",
	"（": "(",
	"）": ")",
	"＋": "+",
	"＝": "=",
	"＠": "@",
	"［": "[",
	"＼": "\\",
	"］": "]",
	"＾": "^",
	"｛": "{",
	"｜": "|",
	"｝": "}"
};

export function normalizeVRChat(value: string) {
	return value
		.split("")
		.map((character) => uniqueCharacters[character] ?? character)
		.join("");
}

const baseUrl = "https://api.vrchat.cloud/api/1/";

const baseApi = wretch()
	.url(baseUrl)
	.addon(QueryStringAddon)
	.middlewares([cookie])
	.headers({
		"user-agent": userAgent
	});

async function verify2FA() {
	const { verified } = await baseApi
		.middlewares([log])
		.url("auth/twofactorauth/totp/verify")
		.json({
			code: TOTP.generate(vrchatTotpSecret).otp
		})
		.post()
		.json<Verify2FAResult>()
		.catch((reason) => {
			console.log("verify2FA", reason);
			throw reason;
		});

	return verified;
}

async function login(): Promise<boolean> {
	const user = await baseApi
		.middlewares([log])
		.url("auth/user")
		.auth(`Basic ${btoa(`${vrchatEmail}:${vrchatPassword}`)}`)
		.get()
		.json<CurrentUser | { requiresTwoFactorAuth: Array<"totp" | "otp"> }>();

	if (!("requiresTwoFactorAuth" in user)) return true;

	if (!user.requiresTwoFactorAuth.includes("totp")) {
		console.error(
			`Unsupported 2FA methods: ${user.requiresTwoFactorAuth.join(", ")}`
		);
		return false;
	}

	return verify2FA();
}

const api = baseApi.middlewares([
	(next) => {
		return async (url, options) => {
			const response = await next(url, options);

			if (response.status === 401) {
				console.log("Invalid session, re-authenticating...");

				if (!(await login())) {
					console.log("Failed to re-authenticate.");
					throw new Error("Failed to re-authenticate.");
				}

				const { origin } = new URL(url);
				const allCookies = await cookies.all(origin);

				return next(url, {
					...options,
					headers: {
						...options["headers"],
						cookie:
							Object.keys(allCookies).length > 0
								? serializeCookies(allCookies)
								: undefined
					}
				});
			}

			return response;
		};
	},
	log
]);

export interface InfopushOptions {
	require: Array<string>;
	include: Array<string>;
}

export function getInfopush(query: InfopushOptions) {
	return api.url("infopush").query(query).get().json<Array<InfoPush>>();
}
