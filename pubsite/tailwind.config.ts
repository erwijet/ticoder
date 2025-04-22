// palette: https://coolors.co/341920-561d29-f42b50-f2e7eb

import { ticoderMarkdown } from './tailwind-plugins/ticoder-markdown';
import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

export default {
	content: ['./src/**/*.{html,js,ts,svelte}'],
	plugins: [ticoderMarkdown],
	theme: {
		fontFamily: {
			display: [
				'Archivo Black',
				'system-ui',
				"'Segoe UI'",
				'Roboto',
				'Helvetica',
				'Arial',
				'sans-serif',
				"'Apple Color Emoji'",
				"'Segoe UI Emoji'",
				"'Segoe UI Symbol'"
			],
			body: [
				'Anonymous Pro',
				'system-ui',
				"'Segoe UI'",
				'Roboto',
				'Helvetica',
				'Arial',
				'sans-serif',
				"'Apple Color Emoji'",
				"'Segoe UI Emoji'",
				"'Segoe UI Symbol'"
			]
		},
		colors: {
			gray: colors.gray,
			slate: colors.slate,
			lavendar: {
				DEFAULT: '#dfdeef',
				100: '#201e3e',
				200: '#403c7c',
				300: '#6661b3',
				400: '#a29fd1',
				500: '#dfdeef',
				600: '#e4e3f2',
				700: '#ebeaf5',
				800: '#f2f1f8',
				900: '#f8f8fc'
			},
			thistle: {
				DEFAULT: '#cec9e4',
				100: '#221d39',
				200: '#443972',
				300: '#6657aa',
				400: '#9a90c7',
				500: '#cec9e4',
				600: '#d8d4e9',
				700: '#e1deef',
				800: '#ebe9f4',
				900: '#f5f4fa'
			},
			glaucous: {
				DEFAULT: '#818ac4',
				100: '#15182c',
				200: '#2a3059',
				300: '#3f4885',
				400: '#5662af',
				500: '#818ac4',
				600: '#9ba2d0',
				700: '#b4b9dc',
				800: '#cdd1e7',
				900: '#e6e8f3'
			},
			'dark-purple': {
				DEFAULT: '#341920',
				100: '#0a0506',
				200: '#150a0d',
				300: '#1f0f13',
				400: '#29141a',
				500: '#341920',
				600: '#6e3544',
				700: '#a95169',
				800: '#c78a9a',
				900: '#e3c4cd'
			},
			'chocolate-cosmos': {
				DEFAULT: '#561d29',
				100: '#120608',
				200: '#230c11',
				300: '#351219',
				400: '#461722',
				500: '#561d29',
				600: '#933146',
				700: '#c44e68',
				800: '#d8899a',
				900: '#ebc4cd'
			},
			folly: {
				DEFAULT: '#f42b50',
				100: '#36030c',
				200: '#6d0619',
				300: '#a30925',
				400: '#d90b31',
				500: '#f42b50',
				600: '#f65472',
				700: '#f87f95',
				800: '#fbaab9',
				900: '#fdd4dc'
			},
			'lavender-blush': {
				DEFAULT: '#f2e7eb',
				100: '#3e212c',
				200: '#7b4257',
				300: '#b06c85',
				400: '#d1aab8',
				500: '#f2e7eb',
				600: '#f5ecf0',
				700: '#f8f1f3',
				800: '#faf6f7',
				900: '#fdfafb'
			}
		}
	}
} satisfies Config;
