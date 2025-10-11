import type { Meta, StoryObj } from '@storybook/react-vite'

const Button = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) =>
  <button className="rounded-lg border px-4 py-2 hover:bg-gray-50" {...props} />

export default {
  title: 'Atoms/Button',
  component: Button,
} as Meta<typeof Button>

export const Primary: StoryObj<typeof Button> = { args: { children: 'Click me' } }
