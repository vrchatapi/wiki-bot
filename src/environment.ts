import { parseArgs } from "util";

const env = (name: string, fallback?: string) => {
	if (process.env[name]) return process.env[name];
	if (fallback) return fallback;

	throw new ReferenceError(`Missing argument: ${name}.`);
};

export const version = env("GITHUB_SHA", "local");

export const {
	values: {
		dry = false,
		verbose = false,
		"verbose-length": verboseLengthString,
		force = false,
		filter = "**",
		"vrchat-email": vrchatEmail = env("VRCHAT_EMAIL"),
		"vrchat-password": vrchatPassword = env("VRCHAT_PASSWORD"),
		"vrchat-totp-secret": vrchatTotpSecret = env("VRCHAT_TOTP_SECRET"),
		"mediawiki-username": mediawikiUsername = env("MEDIAWIKI_USERNAME"),
		"mediawiki-password": mediawikiPassword = env("MEDIAWIKI_PASSWORD"),
		"bypass-token": bypassToken = env("BYPASS_TOKEN"),
		"user-agent": userAgent = env(
			"USER_AGENT",
			`wiki.vrchat.com bot/${version} https://github.com/vrchatapi/wiki-bot/issues/new`
		)
	}
} = parseArgs({
	args: Bun.argv.slice(2),
	options: {
		"bypass-token": {
			type: "string"
		},
		dry: {
			short: "d",
			type: "boolean"
		},
		filter: {
			type: "string"
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
		"user-agent": {
			type: "string"
		},
		verbose: {
			short: "v",
			type: "boolean"
		},
		"verbose-length": {
			type: "string"
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

export const verboseLength =
	(verboseLengthString && Number.parseInt(verboseLengthString, 10)) || 512;
export const filterGlob = new Bun.Glob(filter);
