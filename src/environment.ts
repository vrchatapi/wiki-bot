import { parseArgs } from "util";

const env = (name: string) => {
	if (process.env[name]) return process.env[name];
	throw new ReferenceError(`Missing argument: ${name}.`);
};

export const {
	values: {
		dry = false,
		verbose = false,
		force = false,
		"vrchat-email": vrchatEmail = env("VRCHAT_EMAIL"),
		"vrchat-password": vrchatPassword = env("VRCHAT_PASSWORD"),
		"vrchat-totp-secret": vrchatTotpSecret = env("VRCHAT_TOTP_SECRET"),
		"mediawiki-username": mediawikiUsername = env("MEDIAWIKI_USERNAME"),
		"mediawiki-password": mediawikiPassword = env("MEDIAWIKI_PASSWORD")
	}
} = parseArgs({
	args: Bun.argv.slice(2),
	options: {
		dry: {
			short: "d",
			type: "boolean"
		},
		force: {
			short: "f",
			type: "boolean"
		},
		"mediawiki-password": {
			type: "string"
		},
		"mediawiki-username": {
			type: "string"
		},
		verbose: {
			short: "v",
			type: "boolean"
		},
		"vrchat-email": {
			type: "string"
		},
		"vrchat-password": {
			type: "string"
		},
		"vrchat-totp-secret": {
			type: "string"
		}
	},
	strict: true
});
