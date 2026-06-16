// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import codeImport from 'remark-code-import';

// Shiki ships no CDDL grammar, so highlighting the schema page needs this one.
const cddlGrammar = JSON.parse(
	readFileSync(new URL('./src/grammars/cddl.tmLanguage.json', import.meta.url), 'utf8'),
);

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.1retro.com',
	// Starlight emits trailing-slash links; make the convention explicit.
	trailingSlash: 'always',
	markdown: {
		// Lets fenced blocks pull their body from a file via ```lang file=./path,
		// so the CDDL schema lives in one validatable .cddl file and is inlined
		// into its rendered page at build time.
		remarkPlugins: [codeImport],
	},
	integrations: [
		starlight({
			// Fails the build on broken internal links, so link integrity is
			// checked as part of `astro build`.
			plugins: [starlightLinksValidator()],
			expressiveCode: {
				shiki: {
					langs: [cddlGrammar],
				},
			},
			title: '1Retro Docs',
			favicon: '/1retro.png',
			logo: {
				src: './src/assets/1retro.png',
				alt: '1Retro',
			},
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/hansl/docs.1retro.com',
				},
			],
			sidebar: [
				{
					label: 'Specifications',
					items: [{ autogenerate: { directory: 'specifications' } }],
				},
				{
					label: 'Guides',
					items: [{ autogenerate: { directory: 'guides' } }],
				},
			],
		}),
	],
});
