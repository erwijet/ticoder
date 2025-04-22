import plugin from 'tailwindcss/plugin';

// defines styles for markdown-rendered content

export const ticoderMarkdown = plugin(({ addComponents, theme }) => {
	addComponents({
		'.markdown': {
			color: theme('colors.gray.950'),
			padding: theme('spacing.8'),
			h1: {
				fontWeight: 'bold',
				fontSize: '2rem',
				marginBottom: theme('spacing.4'),
				color: theme('colors.glaucous.500')
			},
			h2: {
				fontSize: '1.5rem',
				fontWeight: 'bold',
				marginBottom: theme('spacing.4'),
				color: theme('colors.glaucous.500'),
				textDecoration: `solid underline ${theme('colors.glaucous.500')}`,
				textDecorationThickness: '3px',
				textUnderlineOffset: '5px'
			},
			'h3, h4': {
				fontWeight: 'bold',
				fontSize: '1.25rem',
				marginBottom: theme('spacing.2'),
				color: theme('colors.glaucous.500')
			},
			p: {
				marginBottom: theme('spacing.4')
			},
			a: {
				textDecoration: 'underline'
			},
			'a:hover': {
				textDecoration: 'underline'
			},
			ul: {
				marginBottom: theme('spacing.4'),
				paddingLeft: theme('spacing.6')
			},
			li: {
				marginBottom: theme('spacing.2')
			},
			table: {
				width: theme('size.full'),
				borderCollapse: 'collapse',
				marginBottom: theme('spacing.4')
			},
			thead: {
				backgroundColor: theme('colors.glaucous.500')
			},
			th: {
				padding: theme('spacing.2'),
				textAlign: 'left',
				'&:first-child': {
					borderTopLeftRadius: theme('borderRadius.md'),
					borderBottomLeftRadius: theme('borderRadius.md')
				},
				'&:last-child': {
					borderTopRightRadius: theme('borderRadius.md'),
					borderBottomRightRadius: theme('borderRadius.md')
				}
			},
			'li::marker': {
				content: "'•  '"
				// color: 'white'
			},
			td: {
				padding: theme('spacing.2'),
				textAlign: 'start'
			},
			tr: {
				'&:not(:last-child)': {
					borderBottom: `2px solid ${theme('colors.chocolate-cosmos.500')}`
				}
			},
			':not(pre)>code': {
				padding: '2px 4px',
				fontSize: theme('fontSize.sm'),
				borderRadius: theme('borderRadius.md'),
				backgroundColor: theme('colors.glaucous.500')
			},
			pre: {
				padding: '8px',
				fontSize: theme('fontSize.sm'),
				borderRadius: theme('borderRadius.md'),
				backgroundColor: theme('colors.glaucous.500')
			},
			blockquote: {
				padding: theme('spacing.4'),
				backgroundColor: theme('colors.thistle.400'),
				borderLeft: `solid 4px ${theme('colors.glaucous.500')}`,
				marginBottom: theme('spacing.2'),
				borderRadius: theme('borderRadius.md')
			},
			'blockquote *': {
				marginBottom: '0px',
				fontStyle: 'italic',
				color: theme('colors.lavender.500')
			},
			hr: {
				paddingTop: '5px',
				paddingBottom: '5px',
				borderColor: theme('colors.thistle.500')
			}
		}
	});
});
