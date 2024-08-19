/* eslint-disable sort-keys/sort-keys-fix */

import { test, expect } from "bun:test";
import React from "react";

import { toHTML } from "./html";
import { defaultElements, type RenderOptions } from "./elements";

import { toSyntaxTree } from ".";

test("toSyntaxTree", () => {
	expect(
		toSyntaxTree("<size=140%><b>Welcome to <i>VRChat</i>!</b></size>")
	).toMatchObject({
		type: "root",
		children: [
			{
				type: "size",
				value: "140%",
				children: [
					{
						type: "b",
						children: [
							"Welcome to ",
							{
								type: "i",
								children: ["VRChat"]
							},
							"!"
						]
					}
				]
			}
		]
	});

	expect(
		toSyntaxTree("<b>Community Spotlight</b>: Trans Academy")
	).toMatchObject({
		type: "root",
		children: [
			{
				type: "b",
				children: ["Community Spotlight"]
			},
			": Trans Academy"
		]
	});
});

test("toHTML", () => {
	const renderOptions: RenderOptions = {
		errorStrategy: "throw"
	};

	expect(
		toHTML("<b>Community Spotlight</b>: Trans Academy", renderOptions)
	).toBe("<strong>Community Spotlight</strong>: Trans Academy");

	expect(toHTML("hello<br>world", renderOptions)).toBe("hello<br/>world");

	expect(
		toHTML(
			"Looking to explore the VRChat community and find a digital home of your own?<br><br>For starters, try checking out our <link=discord><color=#7777fc><u>Discord</u></color></link>! You’ll also be able to find information there about all the latest VRChat updates.<br><br>Likewise, if you want to stay up-to-date on what’s going on in VRChat, you should follow our <link=twitter><color=#7777fc><u>Twitter</u></color></link> account.<br><br>Additionally, you can join the <link=facebook><color=#7777fc><u>VRChat Facebook Group</u></color></link> to interact with others from the community.<br><br>Another way to get help and interact with the community is via our <link=ask-forums><color=#7777fc><u>VRChat Ask Forums</u></color></link>! You can find official messaging there along with information on world and avatar creation.<br><br>While using VRChat if you would like to share any feedback please head over to our <link=feedback><color=#7777fc><u>VRChat Feedback Boards</u></color></link> page to do so.<br><br>We use Crowdin to allow <b>you</b> to provide localization suggestions. Learn more at our <link=crowdin-doc><color=#7777fc><u>Crowdin Documentation</u></color></link> page.",
			{
				...renderOptions,
				elements: {
					...defaultElements,
					link: ({ value, children }) => (
						<span data-href={value}>{children()}</span>
					),
					u: ({ children }) => <u>{children()}</u>
				}
			}
		)
	).toBe(
		'Looking to explore the VRChat community and find a digital home of your own?<br/><br/>For starters, try checking out our <span data-href="discord"><span style="color:#7777fc"><u>Discord</u></span></span>! You’ll also be able to find information there about all the latest VRChat updates.<br/><br/>Likewise, if you want to stay up-to-date on what’s going on in VRChat, you should follow our <span data-href="twitter"><span style="color:#7777fc"><u>Twitter</u></span></span> account.<br/><br/>Additionally, you can join the <span data-href="facebook"><span style="color:#7777fc"><u>VRChat Facebook Group</u></span></span> to interact with others from the community.<br/><br/>Another way to get help and interact with the community is via our <span data-href="ask-forums"><span style="color:#7777fc"><u>VRChat Ask Forums</u></span></span>! You can find official messaging there along with information on world and avatar creation.<br/><br/>While using VRChat if you would like to share any feedback please head over to our <span data-href="feedback"><span style="color:#7777fc"><u>VRChat Feedback Boards</u></span></span> page to do so.<br/><br/>We use Crowdin to allow <strong>you</strong> to provide localization suggestions. Learn more at our <span data-href="crowdin-doc"><span style="color:#7777fc"><u>Crowdin Documentation</u></span></span> page.'
	);
});
