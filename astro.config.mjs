// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.1retro.com',
	// Starlight emits trailing-slash links; make the convention explicit.
	trailingSlash: 'always',
	integrations: [
		starlight({
			// Fails the build on broken internal links, so link integrity is
			// checked as part of `astro build`.
			plugins: [starlightLinksValidator()],
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
					href: 'https://github.com/one-retro/docs',
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
