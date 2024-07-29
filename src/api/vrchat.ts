import QueryStringAddon from "wretch/addons/queryString";
import wretch from "wretch";
import { TOTP } from "totp-generator";

import { vrchatEmail, vrchatPassword, vrchatTotpSecret } from "~/environment";

import { cookie, log } from "./middleware";

import type { InfoPush, CurrentUser, Verify2FAResult } from "vrchat";

const baseUrl = "https://vrchat.com/api/1/";

const baseApi = wretch()
	.url(baseUrl)
	.addon(QueryStringAddon)
	.middlewares([log, cookie]);

async function verify2FA() {
	const { verified } = await baseApi
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

				const allCookies = await cookies.all();

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
	}
]);

export interface InfopushOptions {
	require: Array<string>;
	include: Array<string>;
}

export function getInfopush(query: InfopushOptions) {
	return api.url("infopush").query(query).get().json<Array<InfoPush>>();
}
